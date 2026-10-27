import { cors } from "@elysia/cors";
import { openapi } from "@elysia/openapi";
import { Elysia, NotFound, ParseError, ValidationError } from "elysia";
import { z } from "zod";
import { env } from "./config/env";
import { authPlugin } from "./lib/auth.plugin";
import { AppError } from "./lib/errors";
import { telegramLogger } from "./lib/telegram-logger";
import { cronRoutes, paymentRoutes, paymentWebhookRoutes } from "./modules/payments/payment.routes";
import { telegramRoutes } from "./modules/telegram/telegram.routes";
import { transactionRoutes } from "./modules/transactions/transaction.routes";
import { transactionImportRoutes } from "./modules/transactions/transaction-import.routes";
import { userRoutes } from "./modules/users/user.routes";

// Public developer API only (transactions, authenticated with `x-api-key`).
// Spec at /openapi/json (frontend Scalar on /api). `@elysia/openapi` 2.0.0-rc.0
// skips the JSON route when `provider: null`, so keep a provider so `/openapi/json`
// is registered (UI at /openapi is unused in prod).
const openapiPlugin = openapi({
	provider: "scalar",
	path: "/openapi",
	specPath: "/openapi/json",
	mapJsonSchema: { zod: z.toJSONSchema },
	exclude: { paths: [/^\/(?!transactions)/] },
	documentation: {
		info: {
			title: "Agent Money API",
			version: "0.2.0",
			description:
				"Access your transactions programmatically. Generate a token on /api and send it in the `x-api-key` header on every request.",
		},
		components: {
			securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "x-api-key" } },
		},
		security: [{ apiKey: [] }],
	},
});

/** The HTTP app without a listening socket — imported by tests and `server.ts`. */
export const app = new Elysia()
	.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
	.use(openapiPlugin)
	.onError(({ error, status }) => {
		if (error instanceof AppError) {
			return status(error.status, { success: false, message: error.message });
		}
	})
	.onError(ValidationError, ({ error, status }) =>
		status(400, {
			success: false,
			message: "Invalid request data",
			errors: error.errors.map((issue: { summary?: string; message?: string }) => issue.summary ?? issue.message),
		}),
	)
	.onError(NotFound, ({ status }) => status(404, { success: false, message: "Route not found" }))
	.onError(ParseError, ({ status }) => status(400, { success: false, message: "Invalid request body" }))
	.onError(({ error, status }) => {
		console.error(error);
		void telegramLogger.error(error instanceof Error ? error : new Error(String(error)), {});
		return status(500, { success: false, message: "Internal server error" });
	})
	.get("/", () => ({ success: true, message: "Agentic Personal Finances API" }))
	.get("/config", () => ({
		success: true,
		config: {
			enableConfirmEmail: env.ENABLE_CONFIRM_EMAIL,
			enable2FA: env.ENABLE_2FA,
			enablePaywall: env.ENABLE_PAYWALL,
			enableAbacatepay: env.ENABLE_ABACATEPAY,
			abacatepayPixTestMode: env.ABACATEPAY_PIX_TEST_MODE,
		},
	}))
	.use(authPlugin)
	.use(transactionRoutes)
	.use(transactionImportRoutes)
	.use(userRoutes)
	.use(telegramRoutes)
	.use(paymentRoutes)
	.use(paymentWebhookRoutes)
	.use(cronRoutes);

export type App = typeof app;
