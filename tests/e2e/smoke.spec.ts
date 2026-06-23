import { expect, test } from "@playwright/test";

test("public landing renders simulator boundary and demo entry", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /credit decisions, explained in motion/i })).toBeVisible();
  await expect(page.getByText(/educational simulator and portfolio project/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /launch demo/i })).toBeVisible();
});

test("demo entry creates a session and opens the analyzer", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /start demo/i }).click();
  await expect(page).toHaveURL(/\/analyzer$/);
  await expect(page.getByRole("heading", { name: /model a transparent scenario/i })).toBeVisible();
});

test("seeded account signs in and opens its dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("analyst@credora.local");
  await page.getByLabel("Password").fill("CredoraDemo!2026");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /a measured view of every what-if/i })).toBeVisible();
});
