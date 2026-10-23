import { z } from "zod";

export const completeTelegramLinkSchema = z.object({
	token: z.string().trim().min(1, "Invalid token").max(128),
});

export type CompleteTelegramLinkInput = z.infer<typeof completeTelegramLinkSchema>;
