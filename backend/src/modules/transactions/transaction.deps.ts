import type { CreateTransactionDeps } from "@agentic-personal-finances/core";
import { unwrapOrThrow } from "../../adapters/http/map-result";
import { createPrismaPlanQuotaReader } from "../../adapters/prisma/plan-quota-reader";
import { systemClock } from "../../adapters/prisma/system-clock";
import { createPrismaTransactionRepository } from "../../adapters/prisma/transaction-repository";

export const transactionPorts = {
	transactions: createPrismaTransactionRepository(),
	plans: createPrismaPlanQuotaReader(),
	clock: systemClock,
} satisfies CreateTransactionDeps;

export { unwrapOrThrow };
