import { parseAccountExport } from "@agentic-personal-finances/core";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { confirmTransactionImport, previewTransactionImport } from "#/application/transactions";
import { apiErrorMessage } from "../lib/api-error";
import type { TransactionCategory } from "../lib/categories";
import { categoryLabels, categoryOptions, formatCurrencyCents } from "../lib/categories";
import { inputClassName } from "./auth-card";
import { Modal } from "./modal";

type PreviewRow = {
	rowNumber: number;
	createdAt: string;
	description: string;
	amount: number;
	type: "income" | "expense";
	category: TransactionCategory;
	needsReview: boolean;
};

type PreviewSummary = { total: number; needsReview: number; income: number; expense: number };

export function ImportTransactionsModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [rows, setRows] = useState<PreviewRow[] | null>(null);
	const [summary, setSummary] = useState<PreviewSummary | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<{ created: number; skippedDuplicates: number } | null>(null);

	const previewMutation = useMutation({
		mutationFn: async (csv: string) => {
			try {
				return await previewTransactionImport(csv);
			} catch (reqError) {
				throw new Error(apiErrorMessage(reqError, "Could not read the CSV file"));
			}
		},
		onSuccess: (data) => {
			setRows(data.rows as PreviewRow[]);
			setSummary(data.summary);
			setError(null);
		},
		onError: (err: unknown) => {
			setError(err instanceof Error ? err.message : "Could not read the CSV file");
			setRows(null);
			setSummary(null);
		},
	});

	const confirmMutation = useMutation({
		mutationFn: async () => {
			if (!rows) return;
			try {
				return await confirmTransactionImport(
					rows.map((row) => ({
						description: row.description,
						amount: row.amount,
						category: row.category,
						type: row.type,
						createdAt: row.createdAt,
					})),
				);
			} catch (reqError) {
				throw new Error(apiErrorMessage(reqError, "Could not import transactions"));
			}
		},
		onSuccess: (data) => {
			if (!data) return;
			setResult(data);
			onImported();
		},
		onError: (err: unknown) => {
			setError(err instanceof Error ? err.message : "Could not import transactions");
		},
	});

	// A JSON backup (exported from web, desktop or mobile) is already
	// categorized, so it skips the CSV preview and goes straight to review.
	function loadBackup(text: string): void {
		let raw: unknown;
		try {
			raw = JSON.parse(text);
		} catch {
			setError("The selected file is not valid JSON");
			return;
		}
		const parsed = parseAccountExport(raw);
		if (!parsed.ok) {
			setError(parsed.error);
			return;
		}
		const imported = parsed.value.transactions.map((transaction, index) => ({
			rowNumber: index + 1,
			createdAt: transaction.date,
			description: transaction.description,
			amount: transaction.amount,
			type: transaction.type,
			category: (categoryOptions as string[]).includes(transaction.category)
				? (transaction.category as TransactionCategory)
				: "other",
			needsReview: false,
		}));
		setError(null);
		setRows(imported);
		setSummary({
			total: imported.length,
			needsReview: 0,
			income: imported.filter((row) => row.type === "income").length,
			expense: imported.filter((row) => row.type === "expense").length,
		});
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
		const file = event.target.files?.[0];
		if (!file) return;
		setFileName(file.name);
		setResult(null);

		const isJson = file.name.toLowerCase().endsWith(".json");
		const reader = new FileReader();
		reader.onload = () => {
			const text = typeof reader.result === "string" ? reader.result : "";
			if (isJson) loadBackup(text);
			else previewMutation.mutate(text);
		};
		reader.onerror = () => setError("Could not read the selected file");
		reader.readAsText(file, "utf-8");
	}

	function updateRowCategory(rowNumber: number, category: TransactionCategory): void {
		setRows((current) =>
			current ? current.map((row) => (row.rowNumber === rowNumber ? { ...row, category } : row)) : current,
		);
	}

	const needsReviewRows = rows?.filter((row) => row.needsReview) ?? [];

	return (
		<Modal title="Import transactions" onClose={onClose} maxWidth="max-w-4xl">
			<div className="flex flex-col gap-4">
				{!rows && !result && (
					<>
						<p className="text-sm text-(--color-fg-muted)">
							Select a .json backup exported from this app (web, desktop or mobile), or the .csv file
							exported from your Nubank statement (columns Data, Valor, Identificador, Descrição).
							Negative CSV amounts become expenses and positive amounts become income.
						</p>
						<input
							ref={fileInputRef}
							type="file"
							accept=".json,application/json,.csv,text/csv"
							onChange={handleFileChange}
							className="sr-only"
						/>
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="flex w-fit items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-brand-400"
						>
							Choose file (.json or Nubank .csv)
						</button>
						{fileName && !previewMutation.isPending && !rows && (
							<p className="text-sm text-(--color-fg-muted)">Selected file: {fileName}</p>
						)}
						{fileName && previewMutation.isPending && (
							<p className="text-sm text-(--color-fg-muted)">Reading {fileName}...</p>
						)}
					</>
				)}

				{error && <p className="text-sm text-red-500">{error}</p>}

				{rows && summary && !result && (
					<>
						<div className="grid grid-cols-2 gap-2 rounded-lg border border-(--color-border) p-3 text-sm sm:grid-cols-4">
							<Stat label="Total" value={summary.total} />
							<Stat label="Income" value={summary.income} />
							<Stat label="Expenses" value={summary.expense} />
							<Stat
								label="Review category"
								value={summary.needsReview}
								highlight={summary.needsReview > 0}
							/>
						</div>

						{needsReviewRows.length > 0 && (
							<p className="text-sm text-amber-500">
								Could not automatically categorize {needsReviewRows.length}{" "}
								{needsReviewRows.length === 1 ? "transaction" : "transactions"}. Review and choose the
								correct category below before confirming.
							</p>
						)}

						<div className="max-h-80 overflow-y-auto rounded-lg border border-(--color-border)">
							<table className="w-full text-left text-sm">
								<thead className="sticky top-0 border-b border-(--color-border) bg-(--color-surface) text-(--color-fg-muted)">
									<tr>
										<th className="px-3 py-2 font-medium">Description</th>
										<th className="px-3 py-2 font-medium">Date</th>
										<th className="px-3 py-2 text-right font-medium">Amount</th>
										<th className="px-3 py-2 font-medium">Category</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row) => (
										<tr
											key={row.rowNumber}
											className={`border-b border-(--color-border) last:border-0 ${row.needsReview ? "bg-amber-500/5" : ""}`}
										>
											<td className="max-w-64 truncate px-3 py-2" title={row.description}>
												{row.description}
											</td>
											<td className="px-3 py-2 whitespace-nowrap text-(--color-fg-muted)">
												{new Date(row.createdAt).toLocaleDateString("pt-BR")}
											</td>
											<td
												className={`px-3 py-2 text-right whitespace-nowrap tabular-nums ${row.type === "income" ? "text-emerald-600" : "text-red-500"}`}
											>
												{row.type === "income" ? "+" : "-"}
												{formatCurrencyCents(row.amount)}
											</td>
											<td className="px-3 py-2">
												{row.needsReview ? (
													<select
														value={row.category}
														onChange={(event) =>
															updateRowCategory(
																row.rowNumber,
																event.target.value as TransactionCategory,
															)
														}
														className={`${inputClassName} py-1 text-xs`}
													>
														{categoryOptions.map((option) => (
															<option key={option} value={option}>
																{categoryLabels[option]}
															</option>
														))}
													</select>
												) : (
													<span className="text-xs">{categoryLabels[row.category]}</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => confirmMutation.mutate()}
								disabled={confirmMutation.isPending}
								className="rounded-lg bg-brand-500 px-4 py-2.5 font-semibold text-black hover:bg-brand-400 disabled:opacity-60"
							>
								{confirmMutation.isPending ? "Importing..." : `Confirm import (${rows.length})`}
							</button>
							<button
								type="button"
								onClick={() => {
									setRows(null);
									setSummary(null);
									setFileName(null);
									if (fileInputRef.current) fileInputRef.current.value = "";
								}}
								className="rounded-lg border border-(--color-border) px-4 py-2.5 text-sm font-semibold"
							>
								Choose another file
							</button>
						</div>
					</>
				)}

				{result && (
					<div className="flex flex-col gap-3">
						<p className="text-sm">
							{result.created} {result.created === 1 ? "transaction imported" : "transactions imported"}{" "}
							successfully.
							{result.skippedDuplicates > 0 &&
								` ${result.skippedDuplicates} ${result.skippedDuplicates === 1 ? "duplicate" : "duplicates"} ${result.skippedDuplicates === 1 ? "was" : "were"} skipped.`}
						</p>
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg bg-brand-500 px-4 py-2.5 font-semibold text-black hover:bg-brand-400"
						>
							Close
						</button>
					</div>
				)}
			</div>
		</Modal>
	);
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
	return (
		<div>
			<p className="text-xs text-(--color-fg-muted)">{label}</p>
			<p className={`text-lg font-semibold ${highlight ? "text-amber-500" : ""}`}>{value}</p>
		</div>
	);
}
