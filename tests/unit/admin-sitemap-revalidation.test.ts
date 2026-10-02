import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createBakeryRow: vi.fn(),
  updateBakeryRow: vi.fn(),
  deleteBakeryRow: vi.fn(),
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
  isProductSlugTaken: vi.fn(),
  isCategorySlugTaken: vi.fn(),
  isPostSlugTaken: vi.fn(),
  getAdminPageBySlug: vi.fn(),
}));

vi.mock("next/cache", () => ({ updateTag: mocks.updateTag, revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/bakery/mutations", () => ({
  createBakeryRow: mocks.createBakeryRow,
  updateBakeryRow: mocks.updateBakeryRow,
  deleteBakeryRow: mocks.deleteBakeryRow,
}));
vi.mock("@/lib/bakery/admin/products", () => ({ isProductSlugTaken: mocks.isProductSlugTaken }));
vi.mock("@/lib/bakery/admin/categories", () => ({ isCategorySlugTaken: mocks.isCategorySlugTaken }));
vi.mock("@/lib/bakery/admin/posts", () => ({ isPostSlugTaken: mocks.isPostSlugTaken }));
vi.mock("@/lib/bakery/admin/pages", () => ({ getAdminPageBySlug: mocks.getAdminPageBySlug }));

import { createCategory } from "@/lib/actions/admin/categories";
import { createPost, updateStaticPage } from "@/lib/actions/admin/posts";
import { createProduct } from "@/lib/actions/admin/products";
import { pageDataSchema, postDataSchema, productDataSchema } from "@/lib/bakery/schemas";

const newProduct = () => productDataSchema.parse({ name: { vi: "Bánh mới" }, price: 100000 });
const newPost = () => postDataSchema.parse({ title: { vi: "Bài mới" }, content: { vi: "Nội dung" } });
const newPage = () => pageDataSchema.parse({ title: { vi: "Giới thiệu" }, content: { vi: "Nội dung" } });

describe("admin sitemap cache invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createBakeryRow.mockResolvedValue({ id: 1 });
    mocks.isProductSlugTaken.mockResolvedValue(false);
    mocks.isCategorySlugTaken.mockResolvedValue(false);
    mocks.isPostSlugTaken.mockResolvedValue(false);
    mocks.getAdminPageBySlug.mockResolvedValue(null);
  });

  it.each([
    ["product", () => createProduct({ data: newProduct(), categoryId: null, status: "active" })],
    ["category", () => createCategory({ data: { name: { vi: "Bánh kem" } }, status: "active" })],
    ["post", () => createPost({ data: newPost(), status: "active" })],
    ["static page", () => updateStaticPage("gioi-thieu", newPage())],
  ])("refreshes the sitemap after saving a public %s", async (_type, save) => {
    const result = await save();

    expect(result.ok).toBe(true);
    expect(mocks.createBakeryRow).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("does not revalidate the sitemap when persistence fails", async () => {
    mocks.createBakeryRow.mockRejectedValueOnce(new Error("write failed"));

    await expect(createProduct({
      data: newProduct(),
      categoryId: null,
      status: "active",
    })).rejects.toThrow("write failed");

    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
