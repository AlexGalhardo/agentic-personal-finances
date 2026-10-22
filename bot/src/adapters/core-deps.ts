import { createPrismaPlanQuotaReader } from "@agent-money-boilerplate/backend/src/adapters/prisma/plan-quota-reader";
import { systemClock } from "@agent-money-boilerplate/backend/src/adapters/prisma/system-clock";
import { createPrismaTransactionRepository } from "@agent-money-boilerplate/backend/src/adapters/prisma/transaction-repository";
import type {
	CreateTransactionDeps,
	DeleteTransactionDeps,
	ListTransactionsDeps,
} from "@agentic-personal-finances/core";

export const transactionPorts = {
	transactions: createPrismaTransactionRepository(),
	plans: createPrismaPlanQuotaReader(),
	clock: systemClock,
} satisfies CreateTransactionDeps & ListTransactionsDeps & DeleteTransactionDeps;
