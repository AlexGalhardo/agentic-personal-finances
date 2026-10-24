import { expect, test } from "@playwright/test";

test("landing page shows the hero and links to institutional pages", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("heading", { name: /dollar count/i })).toBeVisible();
	await expect(page.getByRole("link", { name: "Login" })).toBeVisible();

	await page.getByRole("link", { name: "Terms of use" }).click();
	await expect(page).toHaveURL(/\/termos-de-uso/);
	await expect(page.getByRole("heading", { name: "Terms of use" })).toBeVisible();

	await page.goto("/politica-de-privacidade");
	await expect(page.getByRole("heading", { name: "Privacy policy" })).toBeVisible();

	await page.goto("/contato");
	await expect(page.getByRole("heading", { name: "Contact us" })).toBeVisible();
});

test("contact form validates required fields before submitting", async ({ page }) => {
	await page.goto("/contato");
	await page.waitForLoadState("networkidle");

	await page.getByRole("button", { name: "Send message" }).click();

	await expect(page.getByText("Enter your name")).toBeVisible();
	await expect(page.getByText("Invalid email")).toBeVisible();
	await expect(page.locator("#subject-error")).toHaveText("Select a subject");
});

test("contact form shows a live character counter capped at 512 and submits successfully", async ({ page }) => {
	await page.goto("/contato");
	await page.waitForLoadState("networkidle");

	await expect(page.getByText("0/512")).toBeVisible();

	await page.getByLabel("Name").fill("Visitor");
	await page.getByLabel("Email").fill("visitor@example.com");
	await page.getByLabel("Subject").selectOption("bugs");
	await page.getByLabel("Message").fill("I hit a technical issue while trying to export my transactions.");

	await expect(page.getByText(/^\d+\/512$/)).toBeVisible();
	await expect(page.getByText("0/512")).not.toBeVisible();

	await page.getByRole("button", { name: "Send message" }).click();
	await expect(page.getByRole("status")).toHaveText(/Message sent successfully/);
});

test("pre-fills and disables name/email for a logged-in user", async ({ page }) => {
	await page.goto("/entrar");
	await page.waitForLoadState("networkidle");
	await page.getByLabel("Email").fill("admin@gmail.com");
	await page.getByLabel("Password", { exact: true }).fill("adminBR@123");
	await page.getByRole("button", { name: "Sign in", exact: true }).click();
	await page.waitForURL(/\/dashboard/);

	await page.goto("/contato");
	await expect(page.getByLabel("Name")).toHaveValue("Admin");
	await expect(page.getByLabel("Name")).toHaveAttribute("readonly", "");
	await expect(page.getByLabel("Email")).toHaveValue("admin@gmail.com");
	await expect(page.getByLabel("Email")).toHaveAttribute("readonly", "");
});
