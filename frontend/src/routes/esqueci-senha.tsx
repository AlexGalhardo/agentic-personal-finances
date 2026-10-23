import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthCard, FormField, inputClassName } from "../components/auth-card";
import { requestPasswordReset } from "../lib/auth-client";
import { redirectIfAuthenticated } from "../lib/redirect-if-authenticated";

export const Route = createFileRoute("/esqueci-senha")({
	head: () => ({ meta: [{ title: "Recover password — Money" }] }),
	beforeLoad: redirectIfAuthenticated,
	component: ForgetPasswordPage,
});

const schema = z.object({ email: z.email("Invalid email") });

function ForgetPasswordPage() {
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		setError(null);

		const formData = new FormData(event.currentTarget);
		const result = schema.safeParse({ email: formData.get("email") });

		if (!result.success) {
			setError(result.error.issues[0]?.message ?? "Invalid email");
			return;
		}

		setLoading(true);
		await requestPasswordReset({ email: result.data.email, redirectTo: "/resetar-senha" });
		setLoading(false);
		setSent(true);
	}

	return (
		<AuthCard title="Recover password" subtitle="We will send a reset link to your email.">
			{sent ? (
				<p role="status" className="rounded-lg bg-brand-500/10 px-4 py-3 text-sm text-brand-600">
					If this email is registered, you will receive a link to reset your password.
				</p>
			) : (
				<form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
					{error && (
						<p role="alert" className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">
							{error}
						</p>
					)}

					<FormField label="E-mail" id="email">
						<input id="email" name="email" type="email" className={inputClassName} />
					</FormField>

					<button
						type="submit"
						disabled={loading}
						className="rounded-lg bg-brand-500 px-4 py-2.5 font-semibold text-black hover:bg-brand-400 disabled:opacity-60"
					>
						{loading ? "Sending..." : "Send recovery link"}
					</button>
				</form>
			)}
		</AuthCard>
	);
}
