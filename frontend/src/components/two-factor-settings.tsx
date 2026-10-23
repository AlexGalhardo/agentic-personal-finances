import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { translateAuthError } from "../lib/auth-errors";
import { FormField, inputClassName } from "./auth-card";

type SetupData = { totpURI: string; backupCodes: string[]; qrDataUrl: string };

export function TwoFactorSettings({ enabled }: { enabled: boolean }) {
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [setup, setSetup] = useState<SetupData | null>(null);
	const [code, setCode] = useState("");
	const [confirmed, setConfirmed] = useState(false);

	async function handleEnable(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError(null);
		setLoading(true);

		const { data, error: enableError } = await authClient.twoFactor.enable({ password, method: "totp" });
		setLoading(false);

		if (enableError || !data || data.method !== "totp") {
			setError(translateAuthError(enableError, "Could not enable 2FA"));
			return;
		}

		const QRCode = await import("qrcode");
		const qrDataUrl = await QRCode.toDataURL(data.totpURI);
		setSetup({ totpURI: data.totpURI, backupCodes: data.backupCodes ?? [], qrDataUrl });
		setPassword("");
	}

	async function handleVerify(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError(null);

		if (code.length !== 6) {
			setError("Enter the 6-digit code");
			return;
		}

		setLoading(true);
		const { error: verifyError } = await authClient.twoFactor.verifyTotp({ code });
		setLoading(false);

		if (verifyError) {
			setError(translateAuthError(verifyError, "Invalid code"));
			return;
		}

		setConfirmed(true);
		setSetup(null);
	}

	async function handleDisable(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError(null);
		setLoading(true);

		const { error: disableError } = await authClient.twoFactor.disable({ password });
		setLoading(false);

		if (disableError) {
			setError(translateAuthError(disableError, "Could not disable 2FA"));
			return;
		}

		setPassword("");
		setConfirmed(false);
	}

	if (confirmed || (enabled && !setup)) {
		return (
			<div>
				<p className="text-sm text-brand-600">Two-factor authentication is enabled for your account.</p>
				<form onSubmit={handleDisable} className="mt-4 flex flex-col gap-3">
					{error && <p className="text-sm text-red-500">{error}</p>}
					<FormField label="Confirm your password to disable" id="disable-password">
						<input
							id="disable-password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							className={inputClassName}
						/>
					</FormField>
					<button
						type="submit"
						disabled={loading}
						className="self-start rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10 disabled:opacity-60"
					>
						{loading ? "Disabling..." : "Disable 2FA"}
					</button>
				</form>
			</div>
		);
	}

	if (setup) {
		return (
			<div>
				<p className="text-sm text-(--color-fg-muted)">
					Scan the QR code in your authenticator app (Google Authenticator, Authy, etc.) and confirm with the
					generated code.
				</p>
				<img src={setup.qrDataUrl} alt="QR code to set up authenticator" className="mt-4 size-48" />

				{setup.backupCodes.length > 0 && (
					<div className="mt-4 rounded-lg border border-(--color-border) bg-(--color-bg-subtle) p-3">
						<p className="text-xs font-medium text-(--color-fg-muted)">
							Backup codes — store in a safe place:
						</p>
						<p className="mt-1 break-all font-mono text-xs">{setup.backupCodes.join(" · ")}</p>
					</div>
				)}

				<form onSubmit={handleVerify} className="mt-4 flex flex-col gap-3">
					{error && <p className="text-sm text-red-500">{error}</p>}
					<FormField label="6-digit code" id="verify-code">
						<input
							id="verify-code"
							type="text"
							inputMode="numeric"
							maxLength={6}
							value={code}
							onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
							className={inputClassName}
						/>
					</FormField>
					<button
						type="submit"
						disabled={loading}
						className="self-start rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brand-400 disabled:opacity-60"
					>
						{loading ? "Confirming..." : "Confirm activation"}
					</button>
				</form>
			</div>
		);
	}

	return (
		<div>
			<p className="text-sm text-(--color-fg-muted)">Add an extra layer of security with an authenticator app.</p>
			<form onSubmit={handleEnable} className="mt-4 flex flex-col gap-3">
				{error && <p className="text-sm text-red-500">{error}</p>}
				<FormField label="Confirm your password" id="enable-password">
					<input
						id="enable-password"
						type="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className={inputClassName}
					/>
				</FormField>
				<button
					type="submit"
					disabled={loading}
					className="self-start rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brand-400 disabled:opacity-60"
				>
					{loading ? "Enabling..." : "Enable 2FA"}
				</button>
			</form>
		</div>
	);
}
