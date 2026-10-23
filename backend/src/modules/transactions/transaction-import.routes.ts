import { Elysia } from "elysia";
import { authPlugin } from "../../lib/auth.plugin";
import { importConfirmRequestSchema, importPreviewRequestSchema } from "./transaction-import.schema";
import { transactionImportService } from "./transaction-import.service";

export const transactionImportRoutes = new Elysia({ prefix: "/transactions/import", tags: ["Import"] })
	.use(authPlugin)
	.guard({ auth: true })
	.post(
		"/preview",
		{
			body: importPreviewRequestSchema,
			detail: {
				summary: "Preview Nubank statement",
				description:
					"Accepts Nubank CSV content (up to 5 MB) and returns rows classified by category without persisting anything.",
			},
		},
		({ body }) => ({ success: true, ...transactionImportService.preview(body.csv) }),
	)
	.post(
		"/confirm",
		{
			body: importConfirmRequestSchema,
			detail: {
				summary: "Confirm import",
				description:
					"Persists rows (up to 5000). Duplicates (same description, amount, and day) are skipped; on the free plan only up to the remaining limit is imported.",
			},
		},
		async ({ user, body }) => ({
			success: true,
			...(await transactionImportService.confirm(user.id, body.transactions)),
		}),
	);
