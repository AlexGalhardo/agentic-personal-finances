import { expect, test } from "@playwright/test";

test("shows a 404 page with a countdown and auto-redirects to the homepage", async ({ page }) => {
	await page.goto("/essa-rota-nao-existe");

	await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
	await expect(page.getByText(/redirected to the home page in 5 seconds/)).toBeVisible();
	await expect(page.getByText(/redirected to the home page in \d seconds?/)).toBeVisible();

	await expect(page).toHaveURL("/", { timeout: 8000 });
});

test("lets the visitor skip the countdown via the button", async ({ page }) => {
	await page.goto("/outra-rota-inexistente");

	await page.getByRole("link", { name: "Go to the home page now" }).click();
	await expect(page).toHaveURL("/");
});
