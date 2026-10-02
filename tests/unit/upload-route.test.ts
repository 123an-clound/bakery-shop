import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  admin: true,
  uploads: [] as Array<{ bucket: string; path: string }>,
  publicUrlCalls: [] as string[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/security/rate-limit", () => ({
  consumeRateLimit: async () => ({ allowed: true, retryAfterSeconds: 900 }),
  requestClientKey: () => "test-client",
}));
vi.mock("@/lib/auth/require-admin", () => ({ isAdminAuthenticated: async () => state.admin }));
vi.mock("@/lib/utils/file-validation", () => ({
  validateImageUpload: async () => ({ ok: true, image: { ext: "webp", mime: "image/webp" } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string) => {
          state.uploads.push({ bucket, path });
          return { error: null };
        },
        getPublicUrl: (path: string) => {
          state.publicUrlCalls.push(path);
          return { data: { publicUrl: `https://storage.test/${bucket}/${path}` } };
        },
      }),
    },
  }),
}));

import { POST } from "@/app/api/upload/route";

function request(folder?: string) {
  const body = new FormData();
  body.set("file", new Blob(["test-image"], { type: "image/webp" }), "reference.webp");
  if (folder) body.set("folder", folder);
  return new Request("https://local.test/api/upload", { method: "POST", body });
}

beforeEach(() => {
  state.admin = true;
  state.uploads.length = 0;
  state.publicUrlCalls.length = 0;
});

it("uploads guest cake references into the private bucket and returns only an object key", async () => {
  const response = await POST(request());
  const body = await response.json();
  expect(response.status).toBe(201);
  expect(body.key).toMatch(/^custom-cake\/[0-9a-f-]{36}\.webp$/i);
  expect(body.url).toBeUndefined();
  const upload = state.uploads[0];
  expect(upload).toBeDefined();
  if (!upload) throw new Error("expected storage upload");
  expect(upload.bucket).toBe("custom-cake-private");
  expect(state.publicUrlCalls).toHaveLength(0);
});

it("keeps admin product media public and rejects unauthenticated admin-folder uploads", async () => {
  const publicResponse = await POST(request("products"));
  const publicBody = await publicResponse.json();
  const upload = state.uploads[0];
  expect(upload).toBeDefined();
  if (!upload) throw new Error("expected storage upload");
  expect(publicResponse.status).toBe(201);
  expect(publicBody.url).toBe("https://storage.test/bakery/products/" + upload.path.split("/").at(-1));
  expect(upload.bucket).toBe("bakery");

  state.admin = false;
  const denied = await POST(request("products"));
  expect(denied.status).toBe(401);
  expect(state.uploads).toHaveLength(1);
});
