import type { AppFailure } from "../../failures";
import type { PaymentLogRecord } from "../../ports/payment-store";
import type { Result } from "../../result";
import type { PaymentDeps } from "./payment-deps";

export function listPaymentHistory(deps: PaymentDeps, userId: string): Promise<Result<PaymentLogRecord[], AppFailure>> {
	return deps.store.listLogs(userId);
}
