import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";

const BARS = [38, 55, 44, 70, 52, 86, 64, 100].map((height, index) => ({ id: `bar-${index}`, height }));

const ROWS = [
	{ label: "Salary", amount: "+ $4,200.00", income: true },
	{ label: "Groceries", amount: "− $86.40", income: false },
	{ label: "Freelance", amount: "+ $640.00", income: true },
];

export function MoneyShowcase() {
	return (
		<div className="relative mx-auto w-full max-w-md" aria-hidden="true">
			<div className="money-anim absolute -inset-8 rounded-full bg-brand-500/25 blur-3xl [animation:money-glow_5s_ease-in-out_infinite]" />

			<div className="relative rounded-3xl border border-brand-500/30 bg-(--color-surface) p-6 shadow-2xl shadow-brand-500/20">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-xs uppercase tracking-wider text-(--color-fg-muted)">Total balance</p>
						<p className="mt-1 text-4xl font-extrabold tracking-tight">$12,480.60</p>
					</div>
					<span className="flex items-center gap-1 rounded-full bg-brand-500/15 px-2.5 py-1 text-xs font-semibold text-brand-600">
						<TrendingUp className="size-3.5" />
						+12.4%
					</span>
				</div>

				<div className="mt-6 flex h-28 items-end gap-2">
					{BARS.map(({ id, height }, index) => (
						<div
							key={id}
							className="money-anim w-full origin-bottom rounded-md bg-gradient-to-t from-brand-700 to-brand-400 [animation:money-rise_1.2s_cubic-bezier(0.2,0.8,0.2,1)_backwards]"
							style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }}
						/>
					))}
				</div>

				<ul className="mt-6 flex flex-col gap-3">
					{ROWS.map((row) => (
						<li key={row.label} className="flex items-center justify-between text-sm">
							<span className="flex items-center gap-3">
								<span
									className={`flex size-8 items-center justify-center rounded-full ${row.income ? "bg-brand-500/15 text-brand-600" : "bg-red-500/10 text-red-500"}`}
								>
									{row.income ? (
										<ArrowDownLeft className="size-4" />
									) : (
										<ArrowUpRight className="size-4" />
									)}
								</span>
								{row.label}
							</span>
							<span className={`font-semibold ${row.income ? "text-brand-600" : ""}`}>{row.amount}</span>
						</li>
					))}
				</ul>
			</div>

			<span className="money-anim absolute -right-3 -top-5 flex size-14 items-center justify-center rounded-full bg-brand-500 text-2xl font-extrabold text-black shadow-lg [--tilt:12deg] [animation:money-float_4s_ease-in-out_infinite]">
				$
			</span>
			<span className="money-anim absolute -bottom-4 -left-4 flex size-11 items-center justify-center rounded-full bg-brand-300 text-lg font-extrabold text-black shadow-lg [--tilt:-10deg] [animation:money-float_5s_ease-in-out_-1.5s_infinite]">
				$
			</span>
		</div>
	);
}
