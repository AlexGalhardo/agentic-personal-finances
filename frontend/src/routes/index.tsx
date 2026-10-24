import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Send, ShieldCheck, Smartphone } from "lucide-react";
import { MoneyShowcase } from "../components/money-showcase";
import { SiteFooter } from "../components/site-footer";
import { redirectIfAuthenticated } from "../lib/redirect-if-authenticated";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "Money — Your finances, on the web and Telegram" },
			{
				name: "description",
				content: "Track income and expenses on the web, on your phone or in Telegram — all in one place.",
			},
		],
	}),
	beforeLoad: redirectIfAuthenticated,
	component: Home,
});

const HIGHLIGHTS = [
	{ icon: Send, text: "Log expenses from Telegram" },
	{ icon: Smartphone, text: "Web, mobile and desktop" },
	{ icon: ShieldCheck, text: "Encrypted transactions" },
];

function Home() {
	return (
		<div className="dark relative flex h-dvh w-dvw flex-col overflow-hidden bg-(--color-bg) text-(--color-fg)">
			<div className="pointer-events-none absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />

			<header className="relative px-6 py-5 sm:px-10">
				<div className="mx-auto flex w-full max-w-7xl items-center justify-between">
					<span className="flex items-center gap-2 text-lg font-bold tracking-tight">
						<img src="/favicon.svg" alt="" aria-hidden="true" className="size-5" />
						Money
					</span>
					<Link
						to="/login"
						className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-black hover:bg-brand-400"
					>
						Login
					</Link>
				</div>
			</header>

			<main className="relative mx-auto grid min-h-0 w-full max-w-7xl flex-1 items-center gap-8 overflow-hidden px-6 sm:px-10 lg:grid-cols-2 lg:gap-16">
				<div className="text-center lg:text-left">
					<h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
						<span className="block">Make every</span>
						<span className="block bg-gradient-to-r from-brand-300 via-brand-500 to-brand-700 bg-clip-text text-transparent">
							dollar count.
						</span>
					</h1>
					<p className="mx-auto mt-5 max-w-lg text-base text-(--color-fg-muted) sm:text-lg lg:mx-0">
						Track income and expenses on the web, on your phone or straight from Telegram. Simple, private
						and always in sync.
					</p>
					<Link
						to="/signup"
						className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-semibold text-black shadow-lg shadow-brand-500/30 hover:bg-brand-400"
					>
						Get started free
						<ArrowRight className="size-4" aria-hidden="true" />
					</Link>
					<ul className="mt-8 hidden flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-(--color-fg-muted) sm:flex lg:justify-start">
						{HIGHLIGHTS.map(({ icon: Icon, text }) => (
							<li key={text} className="flex items-center gap-2">
								<Icon className="size-4 text-brand-600" aria-hidden="true" />
								{text}
							</li>
						))}
					</ul>
				</div>

				<div className="hidden min-h-0 lg:block">
					<MoneyShowcase />
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
