import { api } from "@/adapters/http/api";

export type SubscriptionPlanId = "monthly" | "annual";

export type PixCharge = {
	id: string;
	brCode: string;
	brCodeBase64: string;
	expiresAt: string;
};

export type PixStatus =
	| { status: "pending" }
	| { status: "expired" }
	| { status: "paid"; months: number; planExpiresAt?: string };

export async function createPixCheckout(plan: SubscriptionPlanId) {
	const { data, error } = await api.payments.pix.checkout.post({ plan });
	if (error || !data || !("id" in data)) {
		throw error ?? new Error("Não foi possível gerar o PIX");
	}
	return {
		id: data.id,
		brCode: data.brCode,
		brCodeBase64: data.brCodeBase64,
		expiresAt: data.expiresAt,
	} satisfies PixCharge;
}

export async function getPixPaymentStatus(chargeId: string): Promise<PixStatus | null> {
	const { data } = await api.payments.pix({ id: chargeId }).status.get();
	if (!data || !("status" in data)) return null;
	if (data.status === "paid") {
		return { status: "paid", months: data.months, planExpiresAt: data.planExpiresAt ?? undefined };
	}
	if (data.status === "expired") return { status: "expired" };
	return { status: "pending" };
}
