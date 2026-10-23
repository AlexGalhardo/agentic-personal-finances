import { useEffect, useState } from "react";
import { Modal } from "./modal";

const COOLDOWN_SECONDS = 10;

export function DeleteAccountSection({
	hasActivePlan,
	onConfirm,
}: {
	hasActivePlan: boolean;
	onConfirm: () => Promise<void>;
}) {
	const [modalOpen, setModalOpen] = useState(false);
	const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!modalOpen || hasActivePlan || secondsLeft <= 0) return;
		const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
		return () => clearTimeout(timer);
	}, [modalOpen, hasActivePlan, secondsLeft]);

	function openModal(): void {
		setSecondsLeft(COOLDOWN_SECONDS);
		setError(null);
		setModalOpen(true);
	}

	async function handleConfirm(): Promise<void> {
		setDeleting(true);
		setError(null);
		try {
			await onConfirm();
			setModalOpen(false);
		} catch (confirmError) {
			setError(confirmError instanceof Error ? confirmError.message : "Could not delete your account");
		} finally {
			setDeleting(false);
		}
	}

	return (
		<div className="mt-6 rounded-2xl border border-red-500/30 bg-(--color-surface) p-6">
			<h2 className="text-lg font-semibold text-red-500">Delete account</h2>
			<p className="mt-2 text-sm text-(--color-fg-muted)">
				This removes all your data. You cannot delete the account while a plan is active.
			</p>

			<button
				type="button"
				onClick={openModal}
				className="mt-4 rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10"
			>
				Delete my account
			</button>

			{modalOpen && (
				<Modal title="Delete account" onClose={() => setModalOpen(false)}>
					{hasActivePlan ? (
						<p className="text-sm text-(--color-fg-muted)">
							You have an active plan. Cancel or wait for the plan to expire before deleting your account.
						</p>
					) : (
						<div className="flex flex-col gap-4">
							<p className="text-sm text-(--color-fg-muted)">
								Your account will be scheduled for deletion. You have <strong>30 days</strong> to sign
								in again and cancel — just sign in normally. After that deadline, the account and all
								data are deleted <strong>permanently</strong>, with no way to recover them.
							</p>

							{error && <p className="text-sm text-red-500">{error}</p>}

							<button
								type="button"
								onClick={handleConfirm}
								disabled={secondsLeft > 0 || deleting}
								className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
							>
								{deleting
									? "Deleting..."
									: secondsLeft > 0
										? `${secondsLeft} seconds to confirm account deletion`
										: "Confirm account deletion"}
							</button>
						</div>
					)}
				</Modal>
			)}
		</div>
	);
}
