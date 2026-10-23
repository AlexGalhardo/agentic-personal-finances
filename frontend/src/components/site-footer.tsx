import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "./theme-toggle";

export function SiteFooter() {
	return (
		<footer className="border-t border-(--color-border) py-8 text-xs text-(--color-fg-muted) sm:text-sm">
			<div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
				<p className="whitespace-nowrap">© {new Date().getFullYear()} Money. All rights reserved.</p>
				<nav className="flex items-center gap-2 sm:gap-4">
					<Link to="/contato" className="whitespace-nowrap hover:text-(--color-fg)">
						Contact
					</Link>
					<Link to="/termos-de-uso" className="whitespace-nowrap hover:text-(--color-fg)">
						Terms of use
					</Link>
					<Link to="/politica-de-privacidade" className="whitespace-nowrap hover:text-(--color-fg)">
						Privacy policy
					</Link>
					<ThemeToggle />
				</nav>
			</div>
		</footer>
	);
}
