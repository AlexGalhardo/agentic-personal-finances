import { Elysia } from "elysia";
import { authPlugin } from "../../lib/auth.plugin";
import { updateProfileSchema } from "./user.schema";
import { userService } from "./user.service";

export const userRoutes = new Elysia({ prefix: "/users" })
	.use(authPlugin)
	.guard({ auth: true })
	.get("/me", async ({ user }) => ({ success: true, user: await userService.getProfile(user.id) }))
	.put("/me", { body: updateProfileSchema }, async ({ user, body }) => ({
		success: true,
		user: await userService.updateProfile(user.id, body),
	}))
	.delete("/me", async ({ user }) => {
		const { deletionRequestedAt } = await userService.requestDeletion(user.id);
		return { success: true, deletionRequestedAt: deletionRequestedAt.toISOString() };
	});
