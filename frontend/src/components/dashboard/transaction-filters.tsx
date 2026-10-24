import type { TransactionCategory } from "../../lib/categories";
import { categoryOptions, formatCurrencyCents } from "../../lib/categories";
import { CategorySelect } from "../category-select";

export type TransactionFilterValues = {
	search: string;
	category: TransactionCategory | "";
	from: string;
	to: string;
};

type Props = {
	values: TransactionFilterValues;
	onChange: (values: TransactionFilterValues) => void;
	searchSummary: { count: number; income: number; expense: number } | null;
};

const fieldClassName =
	"rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-1.5 text-sm outline-none focus:border-brand-500";

export function TransactionFilters({ values, onChange, searchSummary }: Props) {
	const update = (patch: Partial<TransactionFilterValues>) => onChange({ ...values, ...patch });

	return (
		<>
			<div className="mt-4 flex flex-col gap-1">
				<label htmlFor="search" className="text-xs font-medium text-(--color-fg-muted)">
					Search by name
				</label>
				<input
					id="search"
					type="text"
					value={values.search}
					onChange={(event) => update({ search: event.target.value })}
					placeholder="Type at least 3 characters..."
					className={`w-full ${fieldClassName}`}
				/>
			</div>

			{searchSummary && (
				<div className="mt-3 flex w-full items-center justify-between gap-4 rounded-lg border border-(--color-border) bg-(--color-bg-subtle) px-3 py-2 text-sm">
					<span className="text-(--color-fg-muted)">
						{searchSummary.count} result{searchSummary.count === 1 ? "" : "s"} for "{values.search.trim()}"
					</span>
					<span className="flex gap-4 tabular-nums">
						<span className="text-emerald-600">+ {formatCurrencyCents(searchSummary.income)}</span>
						<span className="text-red-500">− {formatCurrencyCents(searchSummary.expense)}</span>
					</span>
				</div>
			)}

			<div className="mt-3 flex flex-wrap items-end justify-between gap-3">
				<div className="flex flex-col gap-1">
					<label htmlFor="category-filter" className="text-xs font-medium text-(--color-fg-muted)">
						Category
					</label>
					<CategorySelect
						id="category-filter"
						value={values.category}
						options={categoryOptions}
						placeholder="All"
						onChange={(category) => update({ category })}
					/>
				</div>

				<div className="flex flex-col gap-1">
					<label htmlFor="from" className="text-xs font-medium text-(--color-fg-muted)">
						From
					</label>
					<input
						id="from"
						type="date"
						value={values.from}
						onChange={(event) => update({ from: event.target.value })}
						className={fieldClassName}
					/>
				</div>

				<div className="flex flex-col gap-1">
					<label htmlFor="to" className="text-xs font-medium text-(--color-fg-muted)">
						Until
					</label>
					<input
						id="to"
						type="date"
						value={values.to}
						onChange={(event) => update({ to: event.target.value })}
						className={fieldClassName}
					/>
				</div>
			</div>
		</>
	);
}
