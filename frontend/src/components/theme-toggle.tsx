import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

// Signed-out pages are always dark; only logged-in pages honor the theme
// the user picked (kept in localStorage).
export const PUBLIC_PATHS = [
	"/",
	"/login",
	"/signup",
	"/forgot-password",
	"/reset-password",
	"/contact",
	"/terms",
	"/privacy",
	"/telegram-link",
] as const;

export function isPublicPath(pathname: string): boolean {
	return (PUBLIC_PATHS as readonly string[]).includes(pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname);
}

function preferredTheme(): Theme {
	return getStoredTheme() ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

/** Keeps <html class="dark"> in line with the current route on client-side navigation. */
export function ThemeGuard(): null {
	const pathname = useRouterState({ select: (state) => state.location.pathname });

	useEffect(() => {
		const dark = isPublicPath(pathname) || preferredTheme() === "dark";
		document.documentElement.classList.toggle("dark", dark);
		window.dispatchEvent(new CustomEvent("themechange", { detail: dark ? "dark" : "light" }));
	}, [pathname]);

	return null;
}

function getStoredTheme(): Theme | null {
	if (typeof window === "undefined") return null;
	const stored = window.localStorage.getItem("theme");
	return stored === "light" || stored === "dark" ? stored : null;
}

function applyTheme(theme: Theme): void {
	document.documentElement.classList.toggle("dark", theme === "dark");
	window.localStorage.setItem("theme", theme);
	window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
}

export function useIsDarkTheme(): boolean {
	const [isDark, setIsDark] = useState(false);

	useEffect(() => {
		setIsDark(document.documentElement.classList.contains("dark"));

		function handleThemeChange(event: Event): void {
			setIsDark((event as CustomEvent<Theme>).detail === "dark");
		}

		window.addEventListener("themechange", handleThemeChange);
		return () => window.removeEventListener("themechange", handleThemeChange);
	}, []);

	return isDark;
}

export function ThemeToggle() {
	const [theme, setTheme] = useState<Theme>("dark");

	useEffect(() => {
		setTheme(preferredTheme());
	}, []);

	function toggle(): void {
		const next: Theme = theme === "dark" ? "light" : "dark";
		setTheme(next);
		applyTheme(next);
	}

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
			className="inline-flex size-9 items-center justify-center rounded-lg border border-(--color-border) text-(--color-fg) transition-colors hover:bg-brand-500/10"
		>
			{theme === "dark" ? "☀️" : "🌙"}
		</button>
	);
}

export const themeInitScript = `(function(){try{var pub=${JSON.stringify(PUBLIC_PATHS)};var p=location.pathname.replace(/\\/$/,"")||"/";var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(pub.indexOf(p)>-1||t==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;
