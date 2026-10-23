// Maps better-auth's native error codes (core + twoFactor plugin, see
// node_modules/better-auth's BASE_ERROR_CODES and TWO_FACTOR_ERROR_CODES) to
// English. `error.code` is stable across versions; `error.message` isn't
// and must not reach the screen untranslated.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
	USER_NOT_FOUND: "User not found",
	FAILED_TO_CREATE_USER: "Could not create user",
	FAILED_TO_CREATE_SESSION: "Could not create session",
	FAILED_TO_UPDATE_USER: "Could not update user",
	FAILED_TO_GET_SESSION: "Could not get session",
	INVALID_PASSWORD: "Incorrect password",
	INVALID_EMAIL: "Invalid email",
	INVALID_EMAIL_OR_PASSWORD: "Incorrect email and/or password",
	INVALID_USER: "Invalid user",
	SOCIAL_ACCOUNT_ALREADY_LINKED: "This social account is already linked to another user",
	PROVIDER_NOT_FOUND: "Sign-in provider not found",
	INVALID_TOKEN: "Invalid token",
	TOKEN_EXPIRED: "Token expired",
	ID_TOKEN_NOT_SUPPORTED: "This token type is not supported",
	FAILED_TO_GET_USER_INFO: "Could not load user info",
	USER_EMAIL_NOT_FOUND: "User email not found",
	EMAIL_NOT_VERIFIED: "Email not verified yet",
	PASSWORD_TOO_SHORT: "Password too short",
	PASSWORD_TOO_LONG: "Password too long",
	USER_ALREADY_EXISTS: "An account with this email already exists",
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists — use another email",
	EMAIL_CAN_NOT_BE_UPDATED: "Email cannot be changed",
	CHANGE_EMAIL_DISABLED: "Email change is disabled",
	CREDENTIAL_ACCOUNT_NOT_FOUND: "Password account not found",
	SESSION_EXPIRED: "Session expired — sign in again to continue",
	FAILED_TO_UNLINK_LAST_ACCOUNT: "You cannot unlink your only sign-in method",
	ACCOUNT_NOT_FOUND: "Account not found",
	USER_ALREADY_HAS_PASSWORD: "Your account already has a password — enter it to continue",
	CROSS_SITE_NAVIGATION_LOGIN_BLOCKED: "Sign-in blocked for security — try again",
	VERIFICATION_EMAIL_NOT_ENABLED: "Email verification is not enabled",
	EMAIL_ALREADY_VERIFIED: "This email is already verified",
	EMAIL_MISMATCH: "Email does not match",
	SESSION_NOT_FRESH: "Confirm your identity again to continue",
	LINKED_ACCOUNT_ALREADY_EXISTS: "This account is already linked",
	INVALID_ORIGIN: "Invalid request origin",
	INVALID_CALLBACK_URL: "Invalid return URL",
	INVALID_REDIRECT_URL: "Invalid redirect URL",
	INVALID_ERROR_CALLBACK_URL: "Invalid error return URL",
	INVALID_NEW_USER_CALLBACK_URL: "Invalid new-user return URL",
	MISSING_OR_NULL_ORIGIN: "Missing request origin",
	CALLBACK_URL_REQUIRED: "Return URL is required",
	FAILED_TO_CREATE_VERIFICATION: "Could not create verification",
	FIELD_NOT_ALLOWED: "Field not allowed",
	ASYNC_VALIDATION_NOT_SUPPORTED: "Async validation not supported",
	VALIDATION_ERROR: "Invalid data",
	MISSING_FIELD: "Required field missing",
	METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED: "Method not allowed",
	BODY_MUST_BE_AN_OBJECT: "Invalid request",
	PASSWORD_ALREADY_SET: "Your account already has a password",

	// plugin twoFactor
	OTP_NOT_ENABLED: "Email code is not enabled",
	OTP_NOT_CONFIGURED: "Email code is not available",
	OTP_HAS_EXPIRED: "Code expired — request a new one",
	TOTP_NOT_ENABLED: "Authenticator (TOTP) is not enabled",
	TOTP_ALREADY_ENABLED: "Authenticator (TOTP) is already enabled",
	TOTP_NOT_CONFIGURED: "Authenticator (TOTP) is not available",
	TWO_FACTOR_NOT_ENABLED: "Two-factor authentication is not enabled",
	BACKUP_CODES_NOT_ENABLED: "Backup codes are not enabled",
	INVALID_BACKUP_CODE: "Invalid backup code",
	INVALID_CODE: "Invalid code",
	TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: "Too many attempts — request a new code",
	ACCOUNT_TEMPORARILY_LOCKED: "Too many incorrect attempts — your account is temporarily locked. Try again later",
	INVALID_TWO_FACTOR_COOKIE: "Invalid two-factor session — try again",
};

/**
 * Translates a better-auth error by `error.code`, falling back to the
 * caller's message for unmapped codes.
 */
export function translateAuthError(
	error: { code?: string | null; message?: string | null } | null | undefined,
	fallback: string,
): string {
	const code = error?.code;
	if (code && code in AUTH_ERROR_MESSAGES) return AUTH_ERROR_MESSAGES[code] as string;
	return fallback;
}
