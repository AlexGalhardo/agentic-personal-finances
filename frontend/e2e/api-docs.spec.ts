import { expect, test } from "@playwright/test";

test("the /api page renders the Scalar reference from the backend's OpenAPI spec", async ({ page }) => {
	await page.goto("/entrar");
	await page.waitForLoadState("networkidle");
	await page.getByLabel("Email").fill("admin@gmail.com");
	await page.getByLabel("Password", { exact: true }).fill("adminBR@123");
	await page.getByRole("button", { name: "Sign in", exact: true }).click();
	await expect(page).toHaveURL(/\/dashboard/);

	await page.goto("/api");
	const reference = page.getByTestId("api-reference");
	await expect(reference.getByText("Agent Money API")).toBeVisible({ timeout: 15_000 });
	await expect(reference.getByText("Create transaction").first()).toBeVisible();
	await expect(reference.getByText("x-api-key").first()).toBeVisible();
});
