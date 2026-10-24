import { api } from "#/adapters/http/api";

export async function getCurrentUser() {
	const { data, error } = await api.users.me.get();
	if (error || !data || !("user" in data)) {
		throw error ?? new Error("Failed to load account data");
	}
	return data.user;
}

export async function deleteCurrentUserAccount() {
	const { error } = await api.users.me.delete();
	if (error) throw error;
}
