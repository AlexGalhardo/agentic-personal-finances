import { PLAN_DEFINITIONS, type PlanId, planIds } from "@agentic-personal-finances/core";
import { z } from "zod";

export { PLAN_DEFINITIONS, type PlanId, planIds };

export const createPixCheckoutSchema = z.object({
	plan: z.enum(planIds),
});

export const pixChargeIdParamSchema = z.object({
	id: z.uuid(),
});

export const webhookQuerySchema = z.object({
	webhookSecret: z.string().optional(),
});

export const webhookEventSchema = z.object({
	event: z.string().min(1).max(100),
	data: z.object({ id: z.string().min(1).max(200) }).loose(),
});

export type CreatePixCheckoutInput = z.infer<typeof createPixCheckoutSchema>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;
