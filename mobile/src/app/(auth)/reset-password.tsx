import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { AuthShell } from "@/components/auth-shell";
import { PasswordChecklist } from "@/components/password-checklist";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { TextField } from "@/components/ui/text-field";
import { resetPassword } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/auth-errors";
import { isStrongPassword } from "@/lib/password-rules";

const INVALID_LINK = "Invalid link ou expirado. Volte para “Forgot my password” e solicite um novo.";

export default function ResetPasswordScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ token?: string }>();
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const token = params.token ?? "";

	async function onSubmit(): Promise<void> {
		setError(null);

		if (!token) {
			setError(INVALID_LINK);
			return;
		}
		if (!isStrongPassword(password)) {
			setError("Password does not meet the requirements below.");
			return;
		}

		setSubmitting(true);
		const { error: resetError } = await resetPassword({ newPassword: password, token });
		setSubmitting(false);

		if (resetError) {
			setError(translateAuthError(resetError, "Could not reset your password"));
			return;
		}

		setDone(true);
		setTimeout(() => router.replace("/login"), 1200);
	}

	return (
		<AuthShell
			title="New password"
			subtitle="Choose a new password for your account."
			footer={
				<Link href="/login" className="text-subhead font-semibold text-fg">
					Voltar para o login
				</Link>
			}
		>
			{!token ? <Notice kind="error" message={INVALID_LINK} /> : null}
			<TextField
				label="New password"
				value={password}
				onChangeText={setPassword}
				placeholder="Crie uma nova senha forte"
				autoComplete="new-password"
				secureTextEntry
			/>
			<PasswordChecklist password={password} />
			<Notice kind="error" message={token ? error : null} />
			<Notice kind="success" message={done ? "Senha redefinida. Redirecionando…" : null} />
			<Button label="Reset password" onPress={onSubmit} loading={submitting} disabled={!password || !token} />
		</AuthShell>
	);
}
