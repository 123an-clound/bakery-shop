import path from "node:path";
import { test, expect } from "@playwright/test";
import { deleteBakeryRowsByType, createTestAdminClient } from "./helpers/supabase-admin";

const TEST_PHONE = "0987654311";
const createdIds: number[] = [];

test.afterAll(async () => {
  await deleteBakeryRowsByType("custom_cake", createdIds);
});

// mục 13 scenario 8: submit the custom cake wizard with an uploaded reference image.
test("custom cake request can be submitted with an uploaded reference image", async ({ page }) => {
  await page.goto("/dat-banh-theo-yeu-cau");

  // Step 1 — size & layers
  await page.locator("#cake-size").fill("20cm, 2 tầng");
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  // Step 2 — sponge/cream/flavor
  await page.locator("#cake-sponge").fill("Bông lan vani");
  await page.locator("#cake-cream").fill("Kem tươi");
  await page.locator("#cake-flavor").fill("Dâu tây");
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  // Step 3 — message + reference image upload
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(__dirname, "fixtures", "test-cake-reference.png"));
  await expect(page.locator("img[alt='']").first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  // Step 4 — need-at date is prefilled with a valid default; just continue.
  await page.getByRole("button", { name: "Tiếp tục" }).click();

  // Step 5 — contact info
  await page.locator("#cake-customer-name").fill("E2E Custom Cake Tester");
  await page.locator("#cake-phone").fill(TEST_PHONE);
  await page.getByRole("button", { name: "Gửi yêu cầu" }).click();

  await expect(page.getByText("Đã gửi yêu cầu thành công!")).toBeVisible();

  const supabase = createTestAdminClient();
  const { data } = await supabase.from("bakery").select("id").eq("type", "custom_cake").eq("data->>phone", TEST_PHONE);
  createdIds.push(...(data ?? []).map((r) => r.id));
  expect(createdIds.length).toBeGreaterThan(0);
});
