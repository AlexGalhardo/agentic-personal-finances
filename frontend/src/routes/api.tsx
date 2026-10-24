import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import ClipboardJS from "clipboard";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { PageLayout } from "../components/page-layout";
import { Toast, useToast } from "../components/toast";
import { authClient } from "../lib/auth-client";
import { requireAuth } from "../lib/require-auth";

export const Route = createFileRoute("/api")({
	head: () => ({ meta: [{ title: "API — Money" }] }),
	beforeLoad: requireAuth,
	component: ApiPage,
});

// Scalar renders with Vue and touches `window`, so it is loaded only in the
// browser (never during SSR) and code-split out of every other page.
const ApiReference = lazy(() => import("../components/api-reference"));

function useIsClient(): boolean {
	const [isClient, setIsClient] = useState(false);
	useEffect(() => setIsClient(true), []);
	return isClient;
}

function ApiPage() {
	const queryClient = useQueryClient();
	const isClient = useIsClient();
	const [createdKey, setCreatedKey] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const copyButtonsRef = useRef<HTMLDivElement>(null);
	const { message: toastMessage, showToast } = useToast();

	const keysQuery = useQuery({
		queryKey: ["api-keys"],
		queryFn: async () => {
			const { data, error } = await authClient.apiKey.list();
			if (error) throw error;
			return data.apiKeys;
		},
	});

	useEffect(() => {
		const clipboard = new ClipboardJS("[data-clipboard-text]", {
			container: copyButtonsRef.current ?? undefined,
		});
		clipboard.on("success", () => showToast("Copiado!"));
		return () => clipboard.destroy();
	}, [showToast]);

	async function handleCreateKey(): Promise<void> {
		setCreating(true);
		const { data, error } = await authClient.apiKey.create({
			name: `Key generated on ${new Date().toLocaleDateString("en-US")}`,
		});
		setCreating(false);
		if (error || !data) return;
		setCreatedKey(data.key);
		await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
	}

	async function handleDeleteKey(keyId: string): Promise<void> {
		await authClient.apiKey.delete({ keyId });
		await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
	}

	return (
		<PageLayout>
			<section className="mx-auto max-w-2xl px-4 pt-16" ref={copyButtonsRef}>
				<h1 className="text-3xl font-bold">API for developers</h1>
				<p className="mt-2 text-sm text-(--color-fg-muted)">
					Access your transactions programmatically with an API token — full CRUD, same account, same data you
					see in the dashboard.
				</p>

				<div className="mt-8 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
					<h2 className="text-lg font-semibold">Your token</h2>
					<p className="mt-2 text-sm text-(--color-fg-muted)">
						Generate a token and send it in the <code>x-api-key: &lt;token&gt;</code> header on every
						request. A newly generated token is already filled in the reference below so you can try the
						routes.
					</p>

					{createdKey && (
						<div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3">
							<p className="text-xs font-medium text-emerald-700">
								Copy it now — for security, this token will not be shown again.
							</p>
							<div className="mt-2 flex items-center gap-2">
								<code className="flex-1 overflow-x-auto text-xs">{createdKey}</code>
								<button
									type="button"
									data-clipboard-text={createdKey}
									className="shrink-0 rounded-lg border border-(--color-border) px-3 py-1.5 text-xs font-medium hover:bg-brand-500/10"
								>
									Copy
								</button>
							</div>
						</div>
					)}

					<button
						type="button"
						onClick={handleCreateKey}
						disabled={creating}
						className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brand-400 disabled:opacity-60"
					>
						{creating ? "Generating..." : "Generate new token"}
					</button>

					{keysQuery.data && keysQuery.data.length > 0 && (
						<ul className="mt-5 flex flex-col gap-2 border-t border-(--color-border) pt-4">
							{keysQuery.data.map((key) => (
								<li key={key.id} className="flex items-center justify-between text-sm">
									<span>
										{key.name ?? "Unnamed"} ·{" "}
										<code className="text-(--color-fg-muted)">{key.start}…</code>
									</span>
									<button
										type="button"
										onClick={() => handleDeleteKey(key.id)}
										className="rounded-lg border border-red-500/40 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-500/10"
									>
										Revoke
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				<h2 className="mt-12 text-lg font-semibold">API reference</h2>
			</section>

			<div className="mx-auto mt-4 max-w-7xl px-4 pb-16" data-testid="api-reference">
				{isClient ? (
					<Suspense fallback={<p className="text-sm text-(--color-fg-muted)">Loading reference…</p>}>
						<ApiReference token={createdKey} />
					</Suspense>
				) : null}
			</div>

			<Toast message={toastMessage} />
		</PageLayout>
	);
}
