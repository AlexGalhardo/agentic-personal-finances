import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "../components/page-layout";

export const Route = createFileRoute("/politica-de-privacidade")({
	head: () => ({
		meta: [{ title: "Privacy policy — Money" }, { name: "description", content: "Money privacy policy." }],
	}),
	component: PrivacyPage,
});

function PrivacyPage() {
	return (
		<PageLayout>
			<section className="mx-auto max-w-3xl px-4 py-16">
				<h1 className="text-3xl font-bold">Privacy policy</h1>
				<p className="mt-2 text-sm text-(--color-fg-muted)">Last updated: September 2026.</p>

				<div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-(--color-fg-muted)">
					<div>
						<h2 className="text-base font-semibold text-(--color-fg)">1. Data we collect</h2>
						<p className="mt-2">
							We collect your name, email, and the financial transactions you enter manually. We do not
							access external bank accounts.
						</p>
					</div>

					<div>
						<h2 className="text-base font-semibold text-(--color-fg)">2. Encryption</h2>
						<p className="mt-2">
							Each transaction description and amount is encrypted (AES-256-GCM) before storage and is
							decrypted only for you when authenticated.
						</p>
					</div>

					<div>
						<h2 className="text-base font-semibold text-(--color-fg)">3. Sharing</h2>
						<p className="mt-2">
							We do not sell or share your data with third parties except processors essential to the
							service (e.g. AbacatePay for PIX payments, Resend for transactional email).
						</p>
					</div>

					<div>
						<h2 className="text-base font-semibold text-(--color-fg)">4. Your rights</h2>
						<p className="mt-2">
							You can update your data anytime under &quot;My account&quot; and request full account
							deletion when no active plan applies.
						</p>
					</div>

					<div>
						<h2 className="text-base font-semibold text-(--color-fg)">5. Contact</h2>
						<p className="mt-2">Privacy questions can be sent through our contact page.</p>
					</div>
				</div>
			</section>
		</PageLayout>
	);
}
