import { err, ok, type Result } from "./result";

export const ACCOUNT_EXPORT_FORMAT = "agentic-personal-finances";
export const ACCOUNT_EXPORT_VERSION = 1;
export const MAX_EXPORT_TRANSACTIONS = 50_000;

export type ExportedTransaction = {
	description: string;
	/** Integer cents, always positive; the sign comes from `type`. */
	amount: number;
	category: string;
	type: "income" | "expense";
	/** ISO 8601 */
	date: string;
};

export type AccountExport = {
	format: typeof ACCOUNT_EXPORT_FORMAT;
	version: typeof ACCOUNT_EXPORT_VERSION;
	exportedAt: string;
	account: { name: string | null; email: string | null };
	transactions: ExportedTransaction[];
};

export function buildAccountExport(
	account: { name?: string | null; email?: string | null },
	transactions: ExportedTransaction[],
	now: Date = new Date(),
): AccountExport {
	return {
		format: ACCOUNT_EXPORT_FORMAT,
		version: ACCOUNT_EXPORT_VERSION,
		exportedAt: now.toISOString(),
		account: { name: account.name ?? null, email: account.email ?? null },
		transactions: transactions.map(({ description, amount, category, type, date }) => ({
			description,
			amount,
			category,
			type,
			date,
		})),
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTransaction(raw: unknown, index: number): Result<ExportedTransaction, string> {
	const at = `transactions[${index}]`;
	if (!isRecord(raw)) return err(`${at} is not an object`);
	const { description, amount, category, type, date } = raw;
	if (typeof description !== "string" || description.trim() === "") return err(`${at}.description is required`);
	if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
		return err(`${at}.amount must be a positive integer number of cents`);
	}
	if (typeof category !== "string" || category === "") return err(`${at}.category is required`);
	if (type !== "income" && type !== "expense") return err(`${at}.type must be "income" or "expense"`);
	if (typeof date !== "string" || Number.isNaN(Date.parse(date))) return err(`${at}.date must be an ISO 8601 date`);
	return ok({ description, amount, category, type, date: new Date(date).toISOString() });
}

export function parseAccountExport(raw: unknown): Result<AccountExport, string> {
	if (!isRecord(raw) || raw.format !== ACCOUNT_EXPORT_FORMAT) {
		return err("This is not an Agentic Personal Finances export file");
	}
	if (raw.version !== ACCOUNT_EXPORT_VERSION) return err(`Unsupported export version: ${String(raw.version)}`);
	if (!Array.isArray(raw.transactions)) return err("transactions must be a list");
	if (raw.transactions.length > MAX_EXPORT_TRANSACTIONS) {
		return err(`Too many transactions (max ${MAX_EXPORT_TRANSACTIONS})`);
	}

	const transactions: ExportedTransaction[] = [];
	for (const [index, item] of raw.transactions.entries()) {
		const parsed = parseTransaction(item, index);
		if (!parsed.ok) return parsed;
		transactions.push(parsed.value);
	}

	const account = isRecord(raw.account) ? raw.account : {};
	return ok({
		format: ACCOUNT_EXPORT_FORMAT,
		version: ACCOUNT_EXPORT_VERSION,
		exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : new Date().toISOString(),
		account: {
			name: typeof account.name === "string" ? account.name : null,
			email: typeof account.email === "string" ? account.email : null,
		},
		transactions,
	});
}
