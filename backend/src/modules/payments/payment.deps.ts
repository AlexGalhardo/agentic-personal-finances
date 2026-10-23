import type { PaymentDeps } from "@agentic-personal-finances/core";
import { createAbacatePayGateway } from "../../adapters/abacatepay/payment-gateway";
import { createPrismaPaymentStore } from "../../adapters/prisma/payment-store";
import { systemClock } from "../../adapters/prisma/system-clock";
import { env } from "../../config/env";

export const paymentPorts: PaymentDeps = {
	gateway: createAbacatePayGateway(),
	store: createPrismaPaymentStore(),
	clock: systemClock,
	get pixTestMode() {
		return env.ABACATEPAY_PIX_TEST_MODE;
	},
};
