import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthCard, FormField, inputClassName } from "../components/auth-card";
import { GoogleButton } from "../components/google-button";
import { PasswordInput } from "../components/password-input";
import { TwoFactorModal } from "../components/two-factor-modal";
import { authClient, signIn } from "../lib/auth-client";
import { translateAuthError } from "../lib/auth-errors";
import { redirectIfAuthenticated } from "../lib/redirect-if-authenticated";

export const Route = createFileRoute("/entrar")({
	head: () => ({ meta: [{ title: "Sign in — Money" }] }),
	beforeLoad: redirectIfAuthenticated,
	component: LoginPage,
});

const loginSchema = z.object({
	email: z.email("Invalid email"),
	password: z.string().min(1, "Enter your password"),
});

function LoginPage() {
	const navigate = useNavigate();
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [password, setPassword] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
	const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
	const [twoFactorMethods, setTwoFactorMethods] = useState<string[] | null>(null);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setFormError(null);

		const formData = new FormData(event.currentTarget);
		const result = loginSchema.safeParse({
			email: formData.get("email"),
			password,
		});

		if (!result.success) {
			const fieldErrors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const key = issue.path[0];
				if (typeof key === "string") fieldErrors[key] = issue.message;
			}
			setErrors(fieldErrors);
			return;
		}

		setErrors({});
		setLoading(true);
		const { data, error } = await signIn.email(result.data);
		setLoading(false);

		if (error) {
			if (error.code === "EMAIL_NOT_VERIFIED") {
				setUnverifiedEmail(result.data.email);
				return;
			}
			setFormError(translateAuthError(error, "Incorrect email and/or password"));
			return;
		}

		if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
			const methods = (data as { twoFactorMethods?: string[] }).twoFactorMethods;
			setTwoFactorMethods(methods ?? []);
			return;
		}

		await navigate({ to: "/dashboard" });
	}

	async function handleResendVerification(): Promise<void> {
		if (!unverifiedEmail) return;
		setResendState("sending");
		await authClient.sendVerificationEmail({ email: unverifiedEmail, callbackURL: "/entrar" });
		setResendState("sent");
	}

	if (unverifiedEmail) {
		return (
			<AuthCard title="Confirm your email" subtitle="You must confirm your email before signing in.">
				<p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">
					We have not confirmed yet <strong>{unverifiedEmail}</strong>. Check your inbox or resend the
					confirmation link.
				</p>

				{resendState === "sent" ? (
					<p role="status" className="mt-4 rounded-lg bg-brand-500/10 px-4 py-3 text-sm text-brand-600">
						Confirmation link resent.
					</p>
				) : (
					<button
						type="button"
						onClick={handleResendVerification}
						disabled={resendState === "sending"}
						className="mt-4 font-medium text-brand-600 hover:underline disabled:opacity-60"
					>
						{resendState === "sending" ? "Resending..." : "Resend confirmation link"}
					</button>
				)}

				<p className="mt-4 text-center text-sm text-(--color-fg-muted)">
					<button
						type="button"
						onClick={() => setUnverifiedEmail(null)}
						className="font-medium text-brand-600 hover:underline"
					>
						Back
					</button>
				</p>
			</AuthCard>
		);
	}

	return (
		<AuthCard title="Sign in" subtitle="Sign in to view your financial dashboard." centerHeader>
			<div className="flex flex-col gap-4">
				<GoogleButton label="Sign in with Google" />

				<div className="flex items-center gap-3 text-xs text-(--color-fg-muted)">
					<span className="h-px flex-1 bg-(--color-border)" />
					or
					<span className="h-px flex-1 bg-(--color-border)" />
				</div>

				{formError && (
					<p role="alert" className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">
						{formError}
					</p>
				)}

				<form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
					<FormField label="Email" id="email" error={errors.email}>
						<input
							id="email"
							name="email"
							type="email"
							className={inputClassName}
							aria-invalid={Boolean(errors.email)}
						/>
					</FormField>

					<FormField label="Password" id="password" error={errors.password}>
						<PasswordInput id="password" name="password" value={password} onChange={setPassword} />
					</FormField>

					<Link to="/esqueci-senha" className="text-right text-sm text-brand-600 hover:underline">
						Forgot my password
					</Link>

					<button
						type="submit"
						disabled={loading}
						className="rounded-lg bg-brand-500 px-4 py-2.5 font-semibold text-black hover:bg-brand-400 disabled:opacity-60"
					>
						{loading ? "Signing in..." : "Sign in"}
					</button>
				</form>

				<p className="text-center text-sm text-(--color-fg-muted)">
					Don't have an account?{" "}
					<Link to="/criar-conta" className="font-medium text-brand-600 hover:underline">
						Create account
					</Link>
				</p>
			</div>

			{twoFactorMethods && (
				<TwoFactorModal
					methods={twoFactorMethods}
					onVerified={() => navigate({ to: "/dashboard" })}
					onClose={() => setTwoFactorMethods(null)}
				/>
			)}
		</AuthCard>
	);
}
