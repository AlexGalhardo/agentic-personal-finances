// Same better-auth error-code map as the frontend (frontend/src/lib/auth-errors.ts),
// duplicated on purpose (see docs/code-conventions.md, sync points).
// `error.body.code` is stable across versions; `error.body.message` isn't and
// must not reach the chat untranslated.
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
	VERIFICATION_EMAIL_NOT_ENABLED: "Email verification is not enabled",
	EMAIL_ALREADY_VERIFIED: "This email is already verified",
	VALIDATION_ERROR: "Invalid data",
	MISSING_FIELD: "Required field missing",
};

/**
 * Translates a better-auth error code (from `APIError.body.code`) to English,
 * falling back to the caller's message.
 */
export function translateAuthError(code: string | null | undefined, fallback: string): string {
	if (code && code in AUTH_ERROR_MESSAGES) return AUTH_ERROR_MESSAGES[code] as string;
	return fallback;
}
