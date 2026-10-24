export {
	ACCOUNT_EXPORT_FORMAT,
	ACCOUNT_EXPORT_VERSION,
	type AccountExport,
	buildAccountExport,
	type ExportedTransaction,
	MAX_EXPORT_TRANSACTIONS,
	parseAccountExport,
} from "./account-backup";
export {
	ACCOUNT_DELETION_GRACE_DAYS,
	TELEGRAM_LINK_TOKEN_TTL_MS,
} from "./constants/identity";
export type { AppFailure, AppFailureCode } from "./failures";
export { failure } from "./failures";
export { FREE_TRANSACTION_LIMIT, hasActivePlan, type PlanFields, transactionAllowance } from "./plan";
export {
	computePlanExpiry,
	isPaidRemoteStatus,
	isPlanId,
	PIX_CHECKOUT_EXPIRES_SECONDS,
	PLAN_DEFINITIONS,
	type PlanId,
	planIds,
	planMonths,
} from "./plans/catalog";
export type {
	ChargeRecord,
	Clock,
	ConsumedLinkToken,
	CreatePixChargeInput,
	ListQuery,
	NewTransaction,
	PaymentGateway,
	PaymentLogInput,
	PaymentLogRecord,
	PaymentStore,
	PendingChargeInput,
	PixChargeRemote,
	PlanQuota,
	PlanQuotaReader,
	TelegramLinkTokenStore,
	TransactionRecord,
	TransactionRepository,
	TransactionType,
	UserPlanSnapshot,
	UserProfile,
	UserProfilePatch,
	UserProfileStore,
} from "./ports";
export type { Err, Ok, Result } from "./result";
export { err, isErr, isOk, map, mapErr, ok } from "./result";
export {
	getUserProfile,
	type IdentityDeps,
	purgePendingAccountDeletions,
	requestAccountDeletion,
	updateUserProfile,
} from "./use-cases/identity";
export {
	type CreatePixCheckoutResult,
	createPixCheckout,
	expireOverduePlans,
	getPixCheckoutStatus,
	getPlanStatus,
	handlePaymentWebhook,
	listPaymentHistory,
	type PaymentDeps,
	type PaymentWebhookPayload,
	type PixCheckoutStatusResult,
	type PlanStatusResult,
	simulatePixCheckout,
} from "./use-cases/payments";
export {
	type CreateTelegramLinkTokenResult,
	completeTelegramLink,
	createTelegramLinkToken,
	linkTelegramChat,
	resolveUserIdByChat,
	type TelegramDeps,
	unlinkTelegramChat,
	unlinkTelegramForUser,
} from "./use-cases/telegram";
export {
	type CreateTransactionDeps,
	type CreateTransactionInput,
	createTransaction,
	type DeleteTransactionDeps,
	deleteTransaction,
	type GetTransactionDeps,
	getTransaction,
	type ListTransactionsDeps,
	type ListTransactionsInput,
	type ListTransactionsResult,
	listTransactions,
	type UpdateTransactionDeps,
	type UpdateTransactionInput,
	updateTransaction,
} from "./use-cases/transactions";
export { CORE_VERSION } from "./version";
