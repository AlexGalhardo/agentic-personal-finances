import { api } from "#/adapters/http/api";

export async function getAppConfig() {
	const { data, error } = await api.config.get();
	if (error || !data || !("config" in data)) {
		throw error ?? new Error("Failed to load configuration");
	}
	return data.config;
}
