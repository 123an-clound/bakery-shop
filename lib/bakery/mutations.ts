import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesUpdate } from "@/lib/supabase/database.types";

import { bakeryDataSchemas } from "./schemas";
import type { BakeryRow, BakeryType } from "./types";

/**
 * All writes go through here, using the service-role client (RLS has no write
 * policies at all — see migration 0001). `data` is always Zod-validated against
 * the schema for `type` before it touches the database.
 */

export interface CreateBakeryRowInput {
  type: BakeryType;
  data: unknown;
  slug?: string | null;
  parentId?: number | null;
  status?: string;
  sortOrder?: number;
}

export async function createBakeryRow(input: CreateBakeryRowInput): Promise<BakeryRow> {
  const parsedData = bakeryDataSchemas[input.type].parse(input.data);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bakery")
    .insert({
      type: input.type,
      data: parsedData as unknown as Json,
      slug: input.slug ?? null,
      parent_id: input.parentId ?? null,
      status: input.status ?? "active",
      sort_order: input.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as BakeryRow;
}

export interface UpdateBakeryRowInput {
  data?: unknown;
  slug?: string | null;
  parentId?: number | null;
  status?: string;
  sortOrder?: number;
}

export async function updateBakeryRow(
  id: number,
  type: BakeryType,
  patch: UpdateBakeryRowInput,
): Promise<BakeryRow> {
  const supabase = createAdminClient();

  const update: TablesUpdate<"bakery"> = {};
  if (patch.data !== undefined) {
    update.data = bakeryDataSchemas[type].parse(patch.data) as unknown as Json;
  }
  if (patch.slug !== undefined) update.slug = patch.slug;
  if (patch.parentId !== undefined) update.parent_id = patch.parentId;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;

  const { data, error } = await supabase
    .from("bakery")
    .update(update)
    .eq("id", id)
    .eq("type", type)
    .select()
    .single();

  if (error) throw error;
  return data as BakeryRow;
}

export async function deleteBakeryRow(id: number, type: BakeryType): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("bakery").delete().eq("id", id).eq("type", type);
  if (error) throw error;
}
