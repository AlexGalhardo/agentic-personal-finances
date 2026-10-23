/** Soft-delete grace before cron hard-deletes accounts that requested deletion. */
export const ACCOUNT_DELETION_GRACE_DAYS = 30;

/** Browser link token lifetime (OAuth-safe window, not long-lived). */
export const TELEGRAM_LINK_TOKEN_TTL_MS = 15 * 60 * 1000;
