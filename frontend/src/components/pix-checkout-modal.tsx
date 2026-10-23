import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getPixPaymentStatus, simulatePixPayment } from "#/application/payments";
import { Modal } from "./modal";

const CLOSE_COOLDOWN_SECONDS = 60;
const POLL_INTERVAL_MS = 3000;
const TEST_MODE_PAYMENT_DELAY_MS = 10_000;
const POST_PAYMENT_REDIRECT_SECONDS = 10;

type Charge = { id: string; brCode: string; brCodeBase64: string; expiresAt: string };

export function PixCheckoutModal({
	charge,
	testModeEnabled,
	onClose,
	onPaid,
}: {
	charge: Charge;
	testModeEnabled: boolean;
	onClose: () => void;
	onPaid: (planExpiresAt: string) => void;
}) {
	const navigate = useNavigate();
	const [status, setStatus] = useState<"pending" | "paid" | "expired">("pending");
	const [paidMonths, setPaidMonths] = useState(0);
	const [redirectCooldown, setRedirectCooldown] = useState(POST_PAYMENT_REDIRECT_SECONDS);
	const [closeCooldown, setCloseCooldown] = useState(CLOSE_COOLDOWN_SECONDS);
	const [simulating, setSimulating] = useState(false);
	const [simulateMessage, setSimulateMessage] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const paidRef = useRef(false);

	const secondsLeft = Math.max(0, Math.floor((new Date(charge.expiresAt).getTime() - Date.now()) / 1000));
	const [remainingSeconds, setRemainingSeconds] = useState(secondsLeft);

	useEffect(() => {
		if (closeCooldown <= 0) return;
		const timer = setTimeout(() => setCloseCooldown((current) => current - 1), 1000);
		return () => clearTimeout(timer);
	}, [closeCooldown]);

	useEffect(() => {
		if (remainingSeconds <= 0 || status !== "pending") return;
		const timer = setTimeout(() => setRemainingSeconds((current) => Math.max(0, current - 1)), 1000);
		return () => clearTimeout(timer);
	}, [remainingSeconds, status]);

	useEffect(() => {
		if (status !== "pending") return;

		const interval = setInterval(async () => {
			const pixStatus = await getPixPaymentStatus(charge.id);
			if (!pixStatus) return;

			if (pixStatus.status === "paid" && !paidRef.current) {
				paidRef.current = true;
				setPaidMonths(pixStatus.months);
				setStatus("paid");
				onPaid(pixStatus.planExpiresAt ?? "");
			} else if (pixStatus.status === "expired") {
				setStatus("expired");
			}
		}, POLL_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [charge.id, status, onPaid]);

	// Locks closing during the countdown so the user always sees the
	// confirmation before being sent to the dashboard.
	useEffect(() => {
		if (status !== "paid") return;
		if (redirectCooldown <= 0) {
			navigate({ to: "/dashboard" });
			return;
		}
		const timer = setTimeout(() => setRedirectCooldown((current) => current - 1), 1000);
		return () => clearTimeout(timer);
	}, [status, redirectCooldown, navigate]);

	async function handleSimulate(): Promise<void> {
		setSimulating(true);
		setSimulateMessage("This PIX will be paid in 10 seconds...");

		try {
			await simulatePixPayment(charge.id);
		} catch {
			setSimulateMessage("Could not simulate payment");
			setSimulating(false);
			return;
		}

		setTimeout(async () => {
			const pixStatus = await getPixPaymentStatus(charge.id);
			if (pixStatus?.status === "paid") {
				paidRef.current = true;
				setPaidMonths(pixStatus.months);
				setStatus("paid");
				onPaid(pixStatus.planExpiresAt ?? "");
			}
			setSimulating(false);
		}, TEST_MODE_PAYMENT_DELAY_MS);
	}

	async function handleCopy(): Promise<void> {
		await navigator.clipboard.writeText(charge.brCode);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	const canClose = status === "expired" || (status === "pending" && closeCooldown <= 0);

	function handleClose(): void {
		if (!canClose) return;
		onClose();
	}

	const minutes = Math.floor(remainingSeconds / 60);
	const seconds = remainingSeconds % 60;
	const qrSrc = charge.brCodeBase64.startsWith("data:")
		? charge.brCodeBase64
		: `data:image/png;base64,${charge.brCodeBase64}`;

	return (
		<Modal title="PIX payment" onClose={handleClose}>
			{status === "paid" ? (
				<div className="flex flex-col items-center gap-2 text-center">
					<p className="text-sm text-brand-600" role="status">
						PIX paid successfully! You subscribed to {paidMonths} {paidMonths === 1 ? "month" : "months"} of
						the PRO plan!
					</p>
					<p className="text-xs text-(--color-fg-muted)">
						Redirecting to the dashboard in {redirectCooldown} second{redirectCooldown === 1 ? "" : "s"}
						...
					</p>
				</div>
			) : status === "expired" ? (
				<p className="text-sm text-red-500" role="status">
					This PIX expired. Close this window and generate a new code.
				</p>
			) : (
				<div className="flex flex-col items-center gap-4">
					<p className="text-center text-sm text-(--color-fg-muted)" role="status">
						You have {minutes}:{seconds.toString().padStart(2, "0")} to pay this PIX. Waiting for payment...
					</p>

					<img src={qrSrc} alt="PIX QR code" className="size-56 rounded-lg border border-(--color-border)" />

					<div className="w-full">
						<p className="text-xs font-medium text-(--color-fg-muted)">PIX copy and paste</p>
						<div className="mt-1 flex items-center gap-2">
							<code className="flex-1 truncate rounded-lg border border-(--color-border) bg-(--color-bg-subtle) px-3 py-2 text-xs">
								{charge.brCode}
							</code>
							<button
								type="button"
								onClick={handleCopy}
								className="shrink-0 rounded-lg border border-(--color-border) px-3 py-2 text-xs font-medium hover:bg-brand-500/10"
							>
								{copied ? "Copied!" : "Copy"}
							</button>
						</div>
					</div>

					{testModeEnabled && (
						<div className="w-full border-t border-(--color-border) pt-3">
							<button
								type="button"
								onClick={handleSimulate}
								disabled={simulating}
								className="w-full rounded-lg border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-500/10 disabled:opacity-60"
							>
								Pay PIX (test mode)
							</button>
							{simulateMessage && (
								<p className="mt-2 text-center text-xs text-(--color-fg-muted)">{simulateMessage}</p>
							)}
						</div>
					)}
				</div>
			)}

			<button
				type="button"
				onClick={handleClose}
				disabled={!canClose}
				className="mt-6 w-full rounded-lg border border-(--color-border) px-4 py-2 text-sm font-semibold disabled:opacity-40"
			>
				{status === "pending" && closeCooldown > 0
					? `You can close this tab in ${closeCooldown} seconds...`
					: status === "paid"
						? "Redirecting..."
						: "Close"}
			</button>
		</Modal>
	);
}
