import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "../components/page-layout";

export const Route = createFileRoute("/terms")({
	head: () => ({
		meta: [{ title: "Terms of use — Money" }, { name: "description", content: "Money terms of use." }],
	}),
	component: TermsPage,
});

function TermsPage() {
	return (
		<PageLayout>
			<section className="mx-auto max-w-3xl px-4 py-16">
				<h1 className="text-3xl font-bold">Terms of use</h1>
				<p className="mt-2 text-sm text-(--color-fg-muted)">Last updated: September 2026.</p>

				<div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-(--color-fg-muted)">
					<p>
						By creating an account and using Money, you agree to these terms. If you do not agree, do not
						use the service.
					</p>

					<div>
						<h2 className="text-base font-semibold text-(--color-fg)">1. Use of the service</h2>
						<p className="mt-2">
							Money is a personal finance tool. You are responsible for the accuracy of the data you enter
							and for keeping your account credentials secure.
						</p>
					</div>

					<div>
						<h2 className="text-base font-semibold text-(--color-fg)">2. Subscription and payment</h2>
						<p className="mt-2">
							Annual plans are charged as shown at checkout. Cancellations follow the policy described in
							your account area.
						</p>
					</div>

					<div>
						<h2 className="text-base font-semibold text-(--color-fg)">3. Account and deletion</h2>
						<p className="mt-2">
							You may delete your account at any time when no active plan is in effect. Deletion is
							permanent and removes your data as described in our Privacy Policy.
						</p>
					</div>

					<div>
						<h2 className="text-base font-semibold text-(--color-fg)">4. Limitation of liability</h2>
						<p className="mt-2">
							Money is provided &quot;as is&quot;. We are not liable for financial decisions made based on
							service data.
						</p>
					</div>

					<div>
						<h2 className="text-base font-semibold text-(--color-fg)">5. Changes</h2>
						<p className="mt-2">
							We may update these terms periodically. Material changes will be communicated by email.
						</p>
					</div>
				</div>
			</section>
		</PageLayout>
	);
}
