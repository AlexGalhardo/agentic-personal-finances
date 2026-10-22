import { api } from "#/adapters/http/api";

export async function getAppConfig() {
	const { data, error } = await api.config.get();
	if (error || !data || !("config" in data)) {
		throw error ?? new Error("Falha ao carregar configuração");
	}
	return data.config;
}
