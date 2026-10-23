import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { linkTelegramAccount } from "#/application/telegram";
import { AuthCard } from "../components/auth-card";
import { GoogleButton } from "../components/google-button";
import { apiErrorMessage } from "../lib/api-error";
import { useSession } from "../lib/auth-client";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/telegram-vincular")({
	head: () => ({ meta: [{ title: "Link Telegram — Money" }] }),
	validateSearch: searchSchema,
	component: TelegramLinkPage,
});

/**
 * Browser half of the bot's "log in through the browser" flow: the bot can't
 * run OAuth inside the chat, so it sends the user here with a single-use
 * token (see backend/src/modules/telegram). Once there is an authenticated
 * session, the page redeems the token and links the chat.
 */
function TelegramLinkPage() {
	const { token } = Route.useSearch();
	const { data: session, isPending } = useSession();
	const attempted = useRef(false);

	const linkMutation = useMutation({
		mutationFn: linkTelegramAccount,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: linkMutation is left out on purpose — it must fire once when token and session become available, not on every re-render.
	useEffect(() => {
		if (!token || !session || attempted.current) return;
		attempted.current = true;
		linkMutation.mutate(token);
	}, [token, session]);

	if (!token) {
		return (
			<AuthCard title="Invalid link" subtitle="Return to the Telegram bot and generate a new sign-in link.">
				<p role="alert" className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">
					No link token was provided.
				</p>
			</AuthCard>
		);
	}

	if (isPending) {
		return (
			<AuthCard title="Link Telegram" subtitle="Checking your session...">
				<p className="text-sm text-(--color-fg-muted)">Aguarde um instante.</p>
			</AuthCard>
		);
	}

	if (!session) {
		return (
			<AuthCard title="Sign in to link Telegram" subtitle="Sign in to finish linking the bot." centerHeader>
				<GoogleButton
					label="Entrar com Google"
					callbackURL={`/telegram-vincular?token=${encodeURIComponent(token)}`}
				/>
			</AuthCard>
		);
	}

	if (linkMutation.isSuccess) {
		return (
			<AuthCard title="Telegram linked!" subtitle="You can return to Telegram and continue there.">
				<p role="status" className="rounded-lg bg-brand-500/10 px-4 py-3 text-sm text-brand-600">
					✅ Your account was linked to the bot chat successfully.
				</p>
			</AuthCard>
		);
	}

	if (linkMutation.isError) {
		return (
			<AuthCard title="Could not link" subtitle="Volte ao bot do Telegram e gere um novo link.">
				<p role="alert" className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">
					{apiErrorMessage(linkMutation.error, "Invalid link ou expirado")}
				</p>
			</AuthCard>
		);
	}

	return (
		<AuthCard title="Link Telegram" subtitle="Finishing link with the bot...">
			<p className="text-sm text-(--color-fg-muted)">Aguarde um instante.</p>
		</AuthCard>
	);
}
