import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/login");
	await page.waitForLoadState("networkidle");
	await page.getByLabel("Email").fill("admin@gmail.com");
	await page.getByLabel("Password", { exact: true }).fill("adminBR@123");
	await page.getByRole("button", { name: "Sign in", exact: true }).click();
	await expect(page).toHaveURL(/\/dashboard/);
});

test("dashboard shows the seeded transactions and charts", async ({ page }) => {
	await expect(page.getByText("Expenses by category")).toBeVisible();
	await expect(page.getByText("Income by category")).toBeVisible();
	await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
	await expect(page.getByText(/Page 1 of \d+/)).toBeVisible();
});

test("filters the transaction list by search term", async ({ page }) => {
	const searchInput = page.getByLabel("Search by name");
	await searchInput.fill("Uber");

	await expect(page.getByRole("row", { name: /Uber/ }).first()).toBeVisible();
	await expect(page.locator("tbody")).not.toContainText("Combustível");
});

test("creates, edits and deletes a transaction end to end", async ({ page }) => {
	await page.getByRole("button", { name: "Add expense" }).click();
	await page.getByLabel("Description").fill("Compra E2E Playwright");
	await page.getByLabel("Amount").fill("77.50");
	await page.getByRole("button", { name: "Create transaction" }).click();

	// Among 500 seeded transactions the new one may not land on page 1 by
	// date — search by name to find it regardless of position.
	await page.getByLabel("Search by name").fill("Playwright");

	const row = page.getByRole("row", { name: /COMPRA E2E PLAYWRIGHT/ });
	await expect(row).toBeVisible();
	await expect(row).toContainText("R$ 77,50");

	await row.getByRole("button", { name: "Edit" }).click();
	await page.getByLabel("Amount").fill("99.90");
	await page.getByRole("button", { name: "Save changes" }).click();

	await expect(row).toContainText("R$ 99,90");

	await row.getByRole("button", { name: "Delete" }).click();
	await page.getByRole("button", { name: "Confirm delete" }).click();

	await expect(page.getByRole("row", { name: /COMPRA E2E PLAYWRIGHT/ })).toHaveCount(0);
});

test("adding an income transaction shows it with a green plus sign", async ({ page }) => {
	await page.getByRole("button", { name: "Add income" }).click();
	await page.getByLabel("Description").fill("Bonus E2E Playwright");
	await page.getByLabel("Amount").fill("500.00");
	await page.getByRole("button", { name: "Create transaction" }).click();

	await page.getByLabel("Search by name").fill("Playwright");

	const row = page.getByRole("row", { name: /BONUS E2E PLAYWRIGHT/ });
	await expect(row).toBeVisible();
	await expect(row).toContainText("+");
	await expect(row).toContainText("R$ 500,00");

	await row.getByRole("button", { name: "Delete" }).click();
	await page.getByRole("button", { name: "Confirm delete" }).click();
	await expect(page.getByRole("row", { name: /BONUS E2E PLAYWRIGHT/ })).toHaveCount(0);
});

test("exports the transaction list to xlsx and csv", async ({ page }) => {
	const xlsxDownload = page.waitForEvent("download");
	await page.getByRole("button", { name: "Export .xlsx" }).click();
	expect((await xlsxDownload).suggestedFilename()).toBe("transactions.xlsx");

	const csvDownload = page.waitForEvent("download");
	await page.getByRole("button", { name: "Export .csv" }).click();
	expect((await csvDownload).suggestedFilename()).toBe("transactions.csv");
});
