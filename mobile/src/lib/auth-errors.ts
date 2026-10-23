// Same better-auth error-code map as the frontend and bot (see
// frontend/src/lib/auth-errors.ts and bot/src/lib/auth-errors.ts) — duplicated
// on purpose so mobile does not depend on the frontend workspace for strings.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
	USER_NOT_FOUND: "User not found",
	FAILED_TO_CREATE_USER: "Could not create user",
	FAILED_TO_CREATE_SESSION: "Could not create session",
	INVALID_PASSWORD: "Incorrect password",
	INVALID_EMAIL: "Invalid email",
	INVALID_EMAIL_OR_PASSWORD: "Incorrect email and/or password",
	INVALID_USER: "Invalid user",
	INVALID_TOKEN: "Invalid token",
	TOKEN_EXPIRED: "Token expired",
	USER_EMAIL_NOT_FOUND: "User email not found",
	EMAIL_NOT_VERIFIED: "Email not verified yet",
	PASSWORD_TOO_SHORT: "Password too short",
	PASSWORD_TOO_LONG: "Password too long",
	USER_ALREADY_EXISTS: "An account with this email already exists",
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists — use another email",
	CREDENTIAL_ACCOUNT_NOT_FOUND: "Password account not found",
	SESSION_EXPIRED: "Session expired — sign in again to continue",
	ACCOUNT_NOT_FOUND: "Account not found",
	EMAIL_ALREADY_VERIFIED: "This email is already verified",
	VALIDATION_ERROR: "Invalid data",
	MISSING_FIELD: "Required field missing",
	INVALID_CODE: "Invalid code",
	OTP_HAS_EXPIRED: "Code expired — request a new one",
	TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: "Too many attempts — request a new code",
	ACCOUNT_TEMPORARILY_LOCKED: "Too many incorrect attempts — your account is temporarily locked. Try again later",
};

/**
 * Translates a better-auth error by `error.code` (stable across versions —
 * `error.message` is always English). Unmapped codes use the caller's fallback.
 */
export function translateAuthError(
	error: { code?: string | null; message?: string | null } | null | undefined,
	fallback: string,
): string {
	const code = error?.code;
	if (code && code in AUTH_ERROR_MESSAGES) return AUTH_ERROR_MESSAGES[code] as string;
	return fallback;
}
