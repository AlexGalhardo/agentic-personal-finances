export type AppFailureCode =
	| "invalid_input"
	| "not_found"
	| "plan_limit"
	| "unauthorized"
	| "forbidden"
	| "conflict"
	| "failed";

export type AppFailure = {
	readonly code: AppFailureCode;
	readonly message: string;
	readonly details?: Readonly<Record<string, unknown>>;
};

export const failure = (
	code: AppFailureCode,
	message: string,
	details?: Readonly<Record<string, unknown>>,
): AppFailure => (details === undefined ? { code, message } : { code, message, details });
