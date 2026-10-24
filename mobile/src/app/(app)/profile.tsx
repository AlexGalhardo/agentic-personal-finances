import { useQueryClient } from "@tanstack/react-query";
import { Directory } from "expo-file-system";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { deleteAllTransactions, exportAccountJson } from "@/application/transactions";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Notice } from "@/components/ui/notice";
import { Row, Section } from "@/components/ui/section";

type Feedback = { kind: "error" | "success"; message: string } | null;

export default function SettingsScreen() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [feedback, setFeedback] = useState<Feedback>(null);

	async function onExport(): Promise<void> {
		setFeedback(null);
		try {
			const folder = await Directory.pickDirectoryAsync();
			const name = `agentic-finances-backup-${new Date().toISOString().slice(0, 10)}.json`;
			folder.createFile(name, "application/json").write(await exportAccountJson());
			setFeedback({ kind: "success", message: `Saved ${name}.` });
		} catch (reason) {
			// Dismissing the folder picker also rejects; that is not worth an error banner.
			const message = reason instanceof Error ? reason.message : "";
			if (!/cancel/i.test(message)) setFeedback({ kind: "error", message: "Could not save the backup file." });
		}
	}

	function onDeleteAll(): void {
		Alert.alert("Delete all data", "Every transaction on this device will be removed. This cannot be undone.", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					await deleteAllTransactions();
					await queryClient.invalidateQueries({ queryKey: ["transactions"] });
					await queryClient.invalidateQueries({ queryKey: ["transactions-statistics"] });
					setFeedback({ kind: "success", message: "All transactions deleted." });
				},
			},
		]);
	}

	return (
		<SafeAreaView edges={["left", "right"]} className="flex-1 bg-canvas">
			<ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-4">
				<Section
					title="Backup"
					footer="Your data lives only on this device. Export it to move it to the web or desktop app."
				>
					<Row label="Export all data (.json)" icon="download" onPress={onExport} />
					<Row
						label="Import backup (.json)"
						icon="upload"
						onPress={() => router.push("/import-backup")}
						last
					/>
				</Section>
				<Notice kind={feedback?.kind ?? "error"} message={feedback?.message} />

				<Section footer="Removes every transaction stored on this device.">
					<Row label="Delete all data" icon="trash-2" onPress={onDeleteAll} destructive last />
				</Section>
			</ScrollView>
			<BottomNav active="profile" />
		</SafeAreaView>
	);
}
