import { expect, test } from "@playwright/test";

const toggleName = /switch to (light|dark) theme/i;

test("signed-out pages are always dark and offer no theme toggle", async ({ page }) => {
	await page.addInitScript(() => window.localStorage.setItem("theme", "light"));

	for (const path of ["/", "/login", "/signup", "/contact", "/terms", "/privacy"]) {
		await page.goto(path);
		await page.waitForLoadState("networkidle");
		await expect(page.locator("html")).toHaveClass(/dark/);
		await expect(page.getByRole("button", { name: toggleName })).toHaveCount(0);
	}
});

test("a logged-in user can switch the theme and it persists across reload", async ({ page }) => {
	await page.goto("/login");
	await page.waitForLoadState("networkidle");
	await page.getByLabel("Email").fill("admin@gmail.com");
	await page.getByLabel("Password", { exact: true }).fill("adminBR@123");
	await page.getByRole("button", { name: "Sign in", exact: true }).click();
	await page.waitForURL(/\/dashboard/);

	const html = page.locator("html");
	await page.getByRole("button", { name: "Admin" }).click();
	const initiallyDark = await html.evaluate((el) => el.classList.contains("dark"));

	await page.getByRole("menu").getByRole("button", { name: toggleName }).click();
	await expect(html).toHaveClass(initiallyDark ? /^(?!.*dark).*$/ : /dark/);

	await page.reload();
	await expect(html).toHaveClass(initiallyDark ? /^(?!.*dark).*$/ : /dark/);
});
