import type { AppFailure } from "../failures";
import type { Result } from "../result";

export type TransactionType = "income" | "expense";

export type TransactionRecord = {
	readonly id: string;
	readonly userId: string;
	readonly description: string;
	readonly amount: number;
	readonly category: string;
	readonly type: TransactionType;
	readonly date: Date;
	readonly createdAt: Date;
	readonly updatedAt: Date | null;
};

export type NewTransaction = Omit<TransactionRecord, "id" | "createdAt" | "updatedAt">;

export type ListQuery = {
	readonly type?: TransactionType;
	readonly category?: string;
	readonly from?: Date;
	readonly to?: Date;
	readonly search?: string;
	readonly limit?: number;
	readonly offset?: number;
};

export type TransactionRepository = {
	create(input: NewTransaction): Promise<Result<TransactionRecord, AppFailure>>;
	findById(userId: string, id: string): Promise<Result<TransactionRecord, AppFailure>>;
	list(userId: string, query: ListQuery): Promise<Result<readonly TransactionRecord[], AppFailure>>;
	update(userId: string, id: string, patch: Partial<NewTransaction>): Promise<Result<TransactionRecord, AppFailure>>;
	delete(userId: string, id: string): Promise<Result<void, AppFailure>>;
	countForUser(userId: string): Promise<Result<number, AppFailure>>;
};
