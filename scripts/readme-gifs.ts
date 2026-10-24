// Records the GIFs embedded in README.md (docs/assets/gifs/*.gif).
//
//   bun run build                                   # once: builds the standalone binary
//   ./agentic-personal-finances                      # from an empty dir, serves :8787
//   bun scripts/readme-gifs.ts [http://localhost:8787]
//
// Needs Playwright's Chromium (`bunx playwright install chromium`) and ffmpeg
// on PATH. Uses throwaway accounts, so run it against a disposable database.
import { mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Browser, type BrowserContext, chromium, type Page } from "@playwright/test";

const BASE_URL = process.argv[2] ?? "http://localhost:8787";
const OUT_DIR = join(import.meta.dir, "../docs/assets/gifs");
const VIEWPORT = { width: 1280, height: 720 };
const PASSWORD = "MoneyDemo@2026";
const RUN = Date.now();

mkdirSync(OUT_DIR, { recursive: true });
const videoDir = mkdtempSync(join(tmpdir(), "readme-gifs-"));

const pause = (page: Page, ms = 900): Promise<void> => page.waitForTimeout(ms);

async function type(page: Page, label: string, value: string): Promise<void> {
	const field = page.getByLabel(label, { exact: true });
	await field.click();
	await field.pressSequentially(value, { delay: 55 });
}

async function signUp(page: Page, name: string, email: string): Promise<void> {
	await page.goto(`${BASE_URL}/criar-conta`);
	await page.waitForLoadState("networkidle");
	await type(page, "Name", name);
	await type(page, "Email", email);
	await type(page, "Password", PASSWORD);
	await pause(page, 500);
	await page.getByRole("button", { name: "Create account", exact: true }).click();
	await page.waitForURL(/\/dashboard/);
}

const SEED = [
	{ description: "Monthly salary", amount: 520000, category: "salary", type: "income", day: 1 },
	{ description: "Freelance project", amount: 135000, category: "freelancer", type: "income", day: 4 },
	{ description: "Rent", amount: 150000, category: "housing", type: "expense", day: 2 },
	{ description: "Supermarket", amount: 38650, category: "food", type: "expense", day: 5 },
	{ description: "Uber to work", amount: 4290, category: "transport", type: "expense", day: 6 },
	{ description: "Cinema night", amount: 6800, category: "entertainment", type: "expense", day: 8 },
	{ description: "Pharmacy", amount: 5420, category: "health", type: "expense", day: 9 },
];

async function seed(page: Page): Promise<void> {
	const now = new Date();
	for (const item of SEED) {
		const date = new Date(now.getFullYear(), now.getMonth(), item.day, 12).toISOString();
		const response = await page.request.post(`${BASE_URL}/transactions`, {
			data: {
				description: item.description,
				amount: item.amount,
				category: item.category,
				type: item.type,
				date,
			},
		});
		if (!response.ok()) throw new Error(`seeding failed: ${response.status()} ${await response.text()}`);
	}
}

function toGif(webm: string, gif: string): void {
	const filter =
		"fps=12,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4";
	const result = Bun.spawnSync(["ffmpeg", "-y", "-loglevel", "error", "-i", webm, "-vf", filter, "-loop", "0", gif]);
	if (result.exitCode !== 0) throw new Error(`ffmpeg failed for ${gif}: ${result.stderr.toString()}`);
}

async function record(
	browser: Browser,
	name: string,
	script: (page: Page) => Promise<void>,
	storageState?: Awaited<ReturnType<BrowserContext["storageState"]>>,
): Promise<void> {
	const dir = join(videoDir, name);
	const context = await browser.newContext({
		viewport: VIEWPORT,
		recordVideo: { dir, size: VIEWPORT },
		...(storageState ? { storageState } : {}),
	});
	const page = await context.newPage();
	await script(page);
	await pause(page, 1200);
	await context.close();
	const webm = readdirSync(dir).find((file) => file.endsWith(".webm"));
	if (!webm) throw new Error(`no video recorded for ${name}`);
	renameSync(join(dir, webm), join(dir, `${name}.webm`));
	toGif(join(dir, `${name}.webm`), join(OUT_DIR, `${name}.gif`));
	console.log(`recorded ${name}.gif`);
}

const browser = await chromium.launch();
try {
	// Throwaway account with some history, reused by the logged-in recordings.
	const setup = await browser.newContext({ viewport: VIEWPORT });
	const setupPage = await setup.newPage();
	await signUp(setupPage, "Alex Demo", `demo-${RUN}@example.com`);
	await seed(setupPage);
	const session = await setup.storageState();
	await setup.close();

	await record(browser, "signup", async (page) => {
		await page.goto(BASE_URL);
		await page.waitForLoadState("networkidle");
		await pause(page, 2500);
		await page.getByRole("link", { name: "Get started free" }).click();
		await page.waitForLoadState("networkidle");
		await pause(page, 600);
		await type(page, "Name", "Maya Silva");
		await type(page, "Email", `maya-${RUN}@example.com`);
		await type(page, "Password", PASSWORD);
		await pause(page, 600);
		await page.getByRole("button", { name: "Create account", exact: true }).click();
		await page.waitForURL(/\/dashboard/);
		await pause(page, 1500);
	});

	await record(
		browser,
		"transactions",
		async (page) => {
			await page.goto(`${BASE_URL}/dashboard`);
			await page.getByText("Monthly salary").first().waitFor();
			await pause(page, 1800);
			await page.getByRole("button", { name: "Add expense" }).click();
			await pause(page, 500);
			await type(page, "Description", "Coffee with the team");
			await type(page, "Amount", "18.50");
			await pause(page, 500);
			await page.getByRole("button", { name: "Create transaction" }).click();
			await pause(page, 1800);
			await page.getByRole("button", { name: "Add income" }).click();
			await pause(page, 500);
			await type(page, "Description", "Consulting invoice");
			await type(page, "Amount", "900.00");
			await pause(page, 500);
			await page.getByRole("button", { name: "Create transaction" }).click();
			await pause(page, 1800);
			await type(page, "Search by name", "Uber");
			await pause(page, 1800);
		},
		session,
	);

	await record(
		browser,
		"api-docs",
		async (page) => {
			await page.goto(`${BASE_URL}/api`);
			await page.waitForLoadState("networkidle");
			await pause(page, 1800);
			for (let step = 0; step < 4; step++) {
				await page.mouse.wheel(0, 380);
				await pause(page, 900);
			}
		},
		session,
	);

	await record(
		browser,
		"theme",
		async (page) => {
			await page.goto(`${BASE_URL}/dashboard`);
			await page.getByText("Monthly salary").first().waitFor();
			await pause(page, 1500);
			await page.getByRole("button", { name: "Alex Demo" }).click();
			await pause(page, 600);
			const toggle = page.getByRole("menu").getByRole("button", { name: /switch to (dark|light) theme/i });
			await toggle.click();
			await pause(page, 1800);
			await toggle.click();
			await pause(page, 1500);
		},
		session,
	);

	await record(
		browser,
		"backup",
		async (page) => {
			await page.goto(`${BASE_URL}/dashboard`);
			await page.getByText("Monthly salary").first().waitFor();
			await pause(page, 1500);
			const download = page.waitForEvent("download");
			await page.getByRole("button", { name: "Export .json" }).click();
			await download;
			await pause(page, 1500);
			await page.getByRole("button", { name: "Import", exact: true }).click();
			await pause(page, 2500);
		},
		session,
	);
} finally {
	await browser.close();
	try {
		rmSync(videoDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
	} catch {
		// Windows may still hold the last video open; it is a temp dir.
	}
}
