import { test, expect } from "@playwright/test";

test.describe("Authentication pages", () => {
  test("landing page navigates to login", async ({ page }) => {
    await page.goto("/");

    const loginLink = page.locator('a[href="/login"]').first();

    await expect(loginLink).toBeVisible();

    await loginLink.click();

    await expect(page).toHaveURL(/\/login$/);

    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();

    await expect(
      page.getByRole("textbox", { name: "Email address" }),
    ).toBeVisible();

    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();

    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("registration page renders correctly", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByLabel("Full name")).toBeVisible();

    await expect(page.getByLabel("Email address")).toBeVisible();

    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();

    await expect(page.getByLabel("Confirm password")).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
  });
});
