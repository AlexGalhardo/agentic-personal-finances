import type { Clock } from "../../ports/clock";
import type { PaymentGateway } from "../../ports/payment-gateway";
import type { PaymentStore } from "../../ports/payment-store";

export type PaymentDeps = {
	readonly gateway: PaymentGateway;
	readonly store: PaymentStore;
	readonly clock: Clock;
	readonly pixTestMode: boolean;
};
