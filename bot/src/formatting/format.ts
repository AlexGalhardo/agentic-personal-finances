import type {
	TransactionCategory,
	TransactionType,
} from "@agentic-personal-finances/backend/src/modules/transactions/transaction.schema";

// Same labels as the web dashboard (frontend/src/lib/categories.ts) —
// duplicated on purpose so the bot doesn't depend on the frontend workspace
// (React/TanStack) for a string map. See docs/code-conventions.md, sync points.
export const categoryLabels: Record<TransactionCategory, string> = {
	food: "Food",
	transport: "Transport",
	housing: "Housing",
	health: "Health",
	education: "Education",
	entertainment: "Entertainment",
	shopping: "Shopping",
	salary: "Salary",
	investment: "Investments",
	rental_income: "Rental income",
	extra_income: "Extra income",
	freelancer: "Freelancer",
	gifts: "Gifts",
	prizes: "Prizes",
	transfers: "Transfers",
	credit_card_bill: "Credit card bill",
	insurance: "Insurance",
	other: "Other",
};

export function getCategoryLabel(category: string): string {
	return category in categoryLabels ? categoryLabels[category as TransactionCategory] : category;
}

export function formatCurrencyCents(cents: number): string {
	return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(date: Date | string): string {
	const value = typeof date === "string" ? new Date(date) : date;
	return value.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export type FormattableTransaction = {
	id: string;
	description: string;
	amount: number;
	category: TransactionCategory;
	type: TransactionType;
	createdAt: string;
};

export function formatTransactionLine(transaction: FormattableTransaction): string {
	const sign = transaction.type === "income" ? "+" : "-";
	return `${sign}${formatCurrencyCents(transaction.amount)} · ${getCategoryLabel(transaction.category)} · ${formatDate(transaction.createdAt)}\n${transaction.description}`;
}

export function formatTransactionList(transactions: FormattableTransaction[]): string {
	if (transactions.length === 0) {
		return "No transactions found.";
	}

	return transactions.map((transaction, index) => `${index + 1}. ${formatTransactionLine(transaction)}`).join("\n\n");
}
