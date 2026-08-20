import { test, expect } from "@playwright/test";

// mục 13 scenario 9: 6 wrong admin passwords in a row get rate-limited.
// Runs last (file name sorts after 01-04) since it deliberately burns this
// server process's login rate-limit budget for the rest of the run.
test("6 wrong admin login attempts in a row get rate-limited", async ({ request }) => {
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    const res = await request.post("/api/admin/login", {
      data: { password: `wrong-password-${i}` },
      headers: { "Content-Type": "application/json" },
    });
    statuses.push(res.status());
  }

  expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
  expect(statuses[5]).toBe(429);
});
