import type { AppFailure } from "../../failures";
import type { Result } from "../../result";
import type { PaymentDeps } from "./payment-deps";

export function expireOverduePlans(deps: PaymentDeps): Promise<Result<number, AppFailure>> {
	return deps.store.expireOverduePlans(deps.clock.now());
}
