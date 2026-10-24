import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join } from "node:path";

// Fixed first choice keeps the origin (and so the session cookie) stable
// between launches; a random port is only the fallback when it is taken.
const PREFERRED_PORT = 18787;
const READY_TIMEOUT_MS = 30_000;

export type EmbeddedServer = { url: URL; stop: () => void };

export function embeddedBinaryPath(resourcesPath: string): string | null {
	const name = process.platform === "win32" ? "agentic-personal-finances.exe" : "agentic-personal-finances";
	const path = join(resourcesPath, "standalone", name);
	return existsSync(path) ? path : null;
}

function listen(port: number): Promise<number> {
	return new Promise((resolve, reject) => {
		const probe = createServer();
		probe.once("error", reject);
		probe.listen(port, "127.0.0.1", () => {
			const address = probe.address();
			const bound = typeof address === "object" && address ? address.port : port;
			probe.close(() => resolve(bound));
		});
	});
}

async function pickPort(): Promise<number> {
	try {
		return await listen(PREFERRED_PORT);
	} catch {
		return listen(0);
	}
}

async function waitUntilHealthy(url: URL, child: ChildProcess): Promise<void> {
	const deadline = Date.now() + READY_TIMEOUT_MS;
	while (Date.now() < deadline) {
		if (child.exitCode !== null) throw new Error(`embedded server exited with code ${child.exitCode}`);
		try {
			const response = await fetch(new URL("/health", url));
			// Anything else squatting on the port would not answer as the standalone server.
			const body: unknown = response.ok ? await response.json() : null;
			if (typeof body === "object" && body !== null && "mode" in body && body.mode === "standalone") return;
		} catch {
			// not listening yet
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`embedded server not ready after ${READY_TIMEOUT_MS} ms`);
}

// The standalone binary keeps its SQLite file and secrets in
// `<cwd>/.standalone-data`, so cwd is the per-user data directory; the
// frontend assets and template DB are found beside the binary.
export async function startEmbeddedServer(binary: string, userDataDir: string): Promise<EmbeddedServer> {
	mkdirSync(userDataDir, { recursive: true });
	const port = await pickPort();
	const url = new URL(`http://127.0.0.1:${port}`);
	const child = spawn(binary, [], {
		cwd: userDataDir,
		env: {
			...process.env,
			PORT: String(port),
			HOST: "127.0.0.1",
			STANDALONE_URL: url.origin,
			NODE_PATH: join(dirname(binary), ".standalone", "native-modules"),
		},
		stdio: "inherit",
		windowsHide: true,
	});
	await waitUntilHealthy(url, child).catch((error: unknown) => {
		child.kill();
		throw error;
	});
	return { url, stop: () => child.kill() };
}
