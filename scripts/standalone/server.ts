// Single-process local binary: API (Elysia) + web (TanStack Start SSR/static)
// + SQLite. Built with `bun run build:standalone` → repo-root executable.
//
// The SSR entry is a static relative import so `bun build --compile` bundles
// its dependency graph into the binary (dynamic `join()` imports leave
// `@tanstack/*` unresolved at runtime).
import { existsSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { z } from "zod";
import { PROXIED_API_PATHS } from "../../frontend/proxy-paths";
import { assetRoot, bootstrapStandaloneEnv } from "./env";

type SsrHandler = { fetch: (request: Request) => Promise<Response> };

const { port, dataDir, dbFingerprint } = bootstrapStandaloneEnv();

function resolveClientDir(): string {
	const candidates = [
		join(process.cwd(), ".standalone", "frontend", "client"),
		join(dirname(process.execPath), ".standalone", "frontend", "client"),
		join(assetRoot, "frontend", "client"),
	];
	for (const root of candidates) {
		if (existsSync(root)) return root;
	}
	throw new Error(`Frontend client assets not found. Tried: ${candidates.join(", ")}`);
}

const clientDir = resolveClientDir();

// Env must be set before these modules parse `Bun.env`.
const { app } = await import("../../backend/src/app");
const { default: ssrHandler } = (await import("./assets/frontend/server/server.js")) as {
	default: SsrHandler;
};

const CONTENT_SECURITY_POLICY = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline'",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"font-src 'self' https://fonts.gstatic.com",
	"img-src 'self' data: blob:",
	"connect-src 'self'",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	"frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
	"Content-Security-Policy": CONTENT_SECURITY_POLICY,
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const healthResponseSchema = z.object({
	ok: z.literal(true),
	mode: z.literal("standalone"),
	db: z.string().length(8),
});

function withSecurityHeaders(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		if (!headers.has(name)) headers.set(name, value);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

function isApiPath(pathname: string): boolean {
	return (
		PROXIED_API_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
		pathname.startsWith("/webhook") ||
		pathname.startsWith("/cron")
	);
}

async function handle(request: Request): Promise<Response> {
	const { pathname } = new URL(request.url);

	if (pathname === "/health") {
		const body = healthResponseSchema.parse({
			ok: true,
			mode: "standalone",
			db: dbFingerprint,
		});
		return Response.json(body);
	}

	if (isApiPath(pathname)) {
		return app.fetch(request);
	}

	if (extname(pathname)) {
		const relative = normalize(pathname.slice(1));
		if (!relative.startsWith("..")) {
			const file = Bun.file(join(clientDir, relative));
			if (await file.exists()) {
				return new Response(file);
			}
		}
	}

	return ssrHandler.fetch(request);
}

Bun.serve({
	port,
	async fetch(request) {
		try {
			return withSecurityHeaders(await handle(request));
		} catch (error) {
			console.error(error);
			return withSecurityHeaders(new Response("Internal Server Error", { status: 500 }));
		}
	},
});

console.log(`Agentic Personal Finances (standalone) on http://localhost:${port}`);
console.log(`SQLite data directory: ${dataDir}`);
console.log(`Frontend client assets: ${clientDir}`);
