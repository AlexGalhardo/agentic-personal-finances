import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

export function AuthCard({
	title,
	subtitle,
	centerHeader,
	children,
}: {
	title: string;
	subtitle?: string;
	centerHeader?: boolean;
	children: ReactNode;
}) {
	return (
		<div className="relative flex min-h-screen flex-col">
			<section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
				<Link
					to="/"
					className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold tracking-tight hover:text-brand-600"
				>
					<img src="/favicon.svg" alt="" aria-hidden="true" className="size-6" />
					Money
				</Link>
				<div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-8">
					<h1 className={`text-2xl font-bold ${centerHeader ? "text-center" : ""}`}>{title}</h1>
					{subtitle && (
						<p className={`mt-1 text-sm text-(--color-fg-muted) ${centerHeader ? "text-center" : ""}`}>
							{subtitle}
						</p>
					)}
					<div className="mt-6">{children}</div>
				</div>
			</section>
			<footer className="flex items-center justify-center px-4 py-5">
				<ThemeToggle />
			</footer>
		</div>
	);
}

export function FormField({
	label,
	id,
	error,
	children,
}: {
	label: string;
	id: string;
	error?: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-sm font-medium">
				{label}
			</label>
			{children}
			{error && (
				<p id={`${id}-error`} className="text-sm text-red-500">
					{error}
				</p>
			)}
		</div>
	);
}

export const inputClassName =
	"rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 outline-none focus:border-brand-500";
