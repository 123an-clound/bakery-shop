// Moves legacy customer reference photos out of the public catalog bucket.
// Requires an explicit --dry-run or --apply to contact the configured Supabase project.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const apply = process.argv.includes("--apply");
const dryRun = process.argv.includes("--dry-run");
if (!apply && !dryRun) {
  console.log("No action taken. Pass --dry-run to inspect counts or --apply after backup and review.");
  process.exit(0);
}
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase URL or service-role environment variable.");
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const sourcePrefix = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/bakery/`;

function legacyPath(value) {
  if (typeof value !== "string" || !value.startsWith(`${sourcePrefix}custom-cake/`)) return null;
  let path;
  try {
    path = decodeURIComponent(value.slice(sourcePrefix.length));
  } catch {
    return null;
  }
  if (!/^custom-cake\/[0-9a-f-]{36}\.(?:webp|png|jpe?g|avif)$/i.test(path)) return null;
  return path;
}

async function readRows(type) {
  const rows = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await client
      .from("bakery")
      .select("id,type,data,updated_at")
      .eq("type", type)
      .range(from, from + 499);
    if (error) throw new Error(`Could not read ${type} rows.`);
    rows.push(...(data ?? []));
    if (!data || data.length < 500) return rows;
  }
}

async function listLegacyObjects() {
  const paths = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.storage.from("bakery").list("custom-cake", {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error("Could not inventory the legacy public image folder.");
    paths.push(...(data ?? [])
      .map((entry) => `custom-cake/${entry.name}`)
      .filter((path) => /^custom-cake\/[0-9a-f-]{36}\.(?:webp|png|jpe?g|avif)$/i.test(path)));
    if (!data || data.length < 1000) return paths;
  }
}

const [cakes, orders] = await Promise.all([readRows("custom_cake"), readRows("order")]);
const legacyObjects = await listLegacyObjects();
const rows = [...cakes, ...orders];
const references = new Map();
for (const row of rows) {
  const values = row.type === "custom_cake"
    ? row.data?.reference_images ?? []
    : (row.data?.items_snapshot ?? []).map((item) => item?.image).filter(Boolean);
  for (const value of values) {
    const path = legacyPath(value);
    if (path) references.set(value, path);
  }
}

const replacements = new Map([...references].map(([url, path]) => [url, path]));
const updates = rows.flatMap((row) => {
  const next = structuredClone(row.data);
  let changed = false;
  if (row.type === "custom_cake" && Array.isArray(next.reference_images)) {
    next.reference_images = next.reference_images.map((image) => {
      const replacement = replacements.get(image);
      if (replacement) changed = true;
      return replacement ?? image;
    });
  }
  if (row.type === "order" && Array.isArray(next.items_snapshot)) {
    next.items_snapshot = next.items_snapshot.map((item) => {
      const replacement = replacements.get(item?.image);
      if (!replacement) return item;
      changed = true;
      return { ...item, image: replacement };
    });
  }
  return changed ? [{ row, data: next }] : [];
});

console.log(`Legacy reference files found: ${references.size}`);
console.log(`Objects in the legacy public folder: ${legacyObjects.length}`);
console.log(`Bakery records to update: ${updates.length}`);
if (dryRun) {
  console.log("Dry run only. After backing up the database and Storage, rerun with --apply to copy files, update references, then remove legacy public copies.");
  process.exit(0);
}

// First copy every object. If a copy fails, database references and public
// originals remain untouched; rerunning is safe because existing private files
// are accepted as completed copies.
for (const path of references.values()) {
  const { data: privateFile, error: privateError } = await client.storage.from("custom-cake-private").download(path);
  if (!privateError && privateFile) continue;

  const { data: file, error: sourceError } = await client.storage.from("bakery").download(path);
  if (sourceError || !file) throw new Error("Could not download a legacy reference file; no public files were deleted.");
  const extension = path.split(".").at(-1)?.toLowerCase();
  const fallbackMime = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : extension === "avif" ? "image/avif" : "image/jpeg";
  const contentType = ["image/png", "image/webp", "image/jpeg", "image/avif"].includes(file.type) ? file.type : fallbackMime;
  const { error: uploadError } = await client.storage.from("custom-cake-private").upload(path, file, {
    contentType,
    upsert: false,
  });
  if (uploadError) throw new Error("Could not copy a reference file; no public files were deleted.");
}

// Compare updated_at to avoid silently overwriting admin edits made during the run.
for (const { row, data } of updates) {
  const { data: changedRows, error } = await client
    .from("bakery")
    .update({ data })
    .eq("id", row.id)
    .eq("type", row.type)
    .eq("updated_at", row.updated_at)
    .select("id");
  if (error || changedRows?.length !== 1) {
    throw new Error("A record changed during migration. Public originals were retained; rerun after reviewing the updated records.");
  }
}

// Verify no scanned record still references a public copy before deleting it.
const [verifiedCakes, verifiedOrders] = await Promise.all([readRows("custom_cake"), readRows("order")]);
const remaining = [...verifiedCakes, ...verifiedOrders].some((row) => {
  const values = row.type === "custom_cake"
    ? row.data?.reference_images ?? []
    : (row.data?.items_snapshot ?? []).map((item) => item?.image).filter(Boolean);
  return values.some((value) => legacyPath(value) !== null);
});
if (remaining) throw new Error("Public references remain in scanned records. Original files were retained.");

const sourcePaths = [...new Set(legacyObjects)];
for (let index = 0; index < sourcePaths.length; index += 100) {
  const { error } = await client.storage.from("bakery").remove(sourcePaths.slice(index, index + 100));
  if (error) throw new Error("Database references are private, but a legacy public object could not be removed. Review Storage cleanup.");
}

console.log(`Migrated ${sourcePaths.length} private reference files and verified ${updates.length} record updates.`);
