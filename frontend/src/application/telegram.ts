import { api } from "#/adapters/http/api";

export async function linkTelegramAccount(token: string) {
	const { data, error } = await api.telegram.link.post({ token });
	if (error || !data) throw error ?? new Error("Could not link o Telegram");
	return data;
}

export async function unlinkTelegramAccount() {
	const { error } = await api.telegram.link.delete();
	if (error) throw error;
}
