import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  admin: false,
  ref: "custom-cake/3e1df6c6-916e-4e6a-a38e-296877cfa426.webp",
  downloadCalls: [] as string[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/require-admin", () => ({ isAdminAuthenticated: async () => state.admin }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                data: {
                  customer_name: "Test customer",
                  phone: "0900000000",
                  size: "M",
                  layers: 1,
                  sponge: "Vanilla",
                  cream: "Whipped cream",
                  flavor: "Strawberry",
                  need_at: "2026-10-03T12:00:00.000Z",
                  reference_images: [state.ref],
                },
              },
              error: null,
            }),
          }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        download: async (path: string) => {
          state.downloadCalls.push(path);
          return { data: new Blob(["fake-webp"], { type: "image/webp" }), error: null };
        },
      }),
    },
  }),
}));

import { GET } from "@/app/api/admin/custom-cakes/[id]/images/[index]/route";

const params = { params: Promise.resolve({ id: "42", index: "0" }) };

beforeEach(() => {
  state.admin = false;
  state.ref = "custom-cake/3e1df6c6-916e-4e6a-a38e-296877cfa426.webp";
  state.downloadCalls.length = 0;
});

it("does not reveal a reference image to an unauthenticated requester", async () => {
  const response = await GET(new Request("https://local.test"), params);
  expect(response.status).toBe(401);
  expect(state.downloadCalls).toHaveLength(0);
});

it("streams private images only after admin authentication and disables caching", async () => {
  state.admin = true;
  const response = await GET(new Request("https://local.test"), params);
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/webp");
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(state.downloadCalls).toEqual([state.ref]);
});

it("rejects malformed storage paths and indexes", async () => {
  state.admin = true;
  state.ref = "https://attacker.example/image.webp";
  const badPath = await GET(new Request("https://local.test"), params);
  const badIndex = await GET(new Request("https://local.test"), {
    params: Promise.resolve({ id: "42", index: "99" }),
  });
  expect(badPath.status).toBe(404);
  expect(badIndex.status).toBe(404);
  expect(state.downloadCalls).toHaveLength(0);
});
