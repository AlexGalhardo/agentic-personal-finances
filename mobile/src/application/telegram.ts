import { api } from "@/adapters/http/api";

export async function unlinkTelegramAccount() {
	const { error } = await api.telegram.link.delete();
	if (error) throw error;
}
