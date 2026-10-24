import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { unlinkTelegramAccount } from "#/application/telegram";
import { apiErrorMessage } from "../lib/api-error";
import { queryKeys } from "../lib/queries";

/**
 * Linking happens only from the bot (logging in there, or through the
 * single-use browser link it sends) — this page never accepts a chat ID, so
 * nobody can attach someone else's Telegram chat to their account.
 */
export function TelegramLinkSection({ telegramChatId }: { telegramChatId: string | null }) {
	const queryClient = useQueryClient();
	const [error, setError] = useState<string | null>(null);
	const [unlinking, setUnlinking] = useState(false);

	async function handleUnlink(): Promise<void> {
		setError(null);
		setUnlinking(true);
		try {
			await unlinkTelegramAccount();
		} catch (requestError) {
			setError(apiErrorMessage(requestError, "Could not unlink Telegram"));
			setUnlinking(false);
			return;
		}
		setUnlinking(false);
		await queryClient.invalidateQueries({ queryKey: queryKeys.me });
	}

	return (
		<div className="mt-6 rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
			<h2 className="text-lg font-semibold">Telegram bot</h2>

			{telegramChatId ? (
				<>
					<p className="mt-2 text-sm text-(--color-fg-muted)">
						Your account is linked to a Telegram chat. Transactions from the bot appear in this account.
					</p>
					{error && <p className="mt-3 text-sm text-red-500">{error}</p>}
					<button
						type="button"
						onClick={handleUnlink}
						disabled={unlinking}
						className="mt-4 rounded-lg border border-(--color-border) px-4 py-2 text-sm font-semibold hover:bg-(--color-bg-subtle) disabled:opacity-60"
					>
						{unlinking ? "Unlinking..." : "Unlink Telegram"}
					</button>
				</>
			) : (
				<p className="mt-2 text-sm text-(--color-fg-muted)">
					No chat linked. Open the bot on Telegram and sign in with your email and password — or choose “Sign
					in through the browser” to use Google.
				</p>
			)}
		</div>
	);
}
