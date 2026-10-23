import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { env } from "#/config/env";

const API_URL = env.VITE_API_URL;

const serverSessionSchema = z
	.object({
		session: z.object({
			id: z.string(),
			userId: z.string(),
			expiresAt: z.string(),
		}),
		user: z.object({
			id: z.string(),
			name: z.string(),
			email: z.string(),
			twoFactorEnabled: z.boolean().nullable().optional(),
		}),
	})
	.nullable();

const serverPlanSchema = z
	.object({
		planStatus: z.string(),
		planExpiresAt: z.string().nullable(),
	})
	.nullable();

const meResponseSchema = z.object({
	user: z
		.object({
			planStatus: z.string(),
			planExpiresAt: z.string().nullable(),
		})
		.optional(),
});

export type ServerSession = z.infer<typeof serverSessionSchema>;
export type ServerPlan = z.infer<typeof serverPlanSchema>;

/**
 * Frontend and API run on separate servers, so during SSR (direct URL
 * navigation) the browser's `authClient.getSession()` can't see the session
 * cookie — the incoming request's `Cookie` header is forwarded to the API's
 * session endpoint instead.
 */
export const getServerSession = createServerFn({ method: "GET" }).handler(async (): Promise<ServerSession> => {
	const request = getRequest();
	const cookie = request.headers.get("cookie");

	const response = await fetch(`${API_URL}/auth/get-session`, {
		headers: cookie ? { cookie } : {},
	});

	if (!response.ok) return null;
	const parsed = serverSessionSchema.safeParse(await response.json());
	return parsed.success ? parsed.data : null;
});

/** Same cookie forwarding as `getServerSession`, for the plan fields
 * (not native to better-auth) exposed by `/users/me`. */
export const getServerPlan = createServerFn({ method: "GET" }).handler(async (): Promise<ServerPlan> => {
	const request = getRequest();
	const cookie = request.headers.get("cookie");

	const response = await fetch(`${API_URL}/users/me`, {
		headers: cookie ? { cookie } : {},
	});

	if (!response.ok) return null;
	const parsed = meResponseSchema.safeParse(await response.json());
	if (!parsed.success || !parsed.data.user) return null;
	return serverPlanSchema.parse({
		planStatus: parsed.data.user.planStatus,
		planExpiresAt: parsed.data.user.planExpiresAt,
	});
});
