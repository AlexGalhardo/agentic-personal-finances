import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { importAccountJson } from "@/application/transactions";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/theme";

type ImportResult = { created: number; skippedDuplicates: number };

export default function ImportBackupScreen() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<ImportResult | null>(null);

	async function handlePickFile(): Promise<void> {
		setError(null);
		const picked = await DocumentPicker.getDocumentAsync({ type: ["application/json", "*/*"] });
		const asset = picked.assets?.[0];
		if (picked.canceled || !asset) return;

		setLoading(true);
		try {
			setResult(await importAccountJson(await new File(asset.uri).text()));
			await queryClient.invalidateQueries({ queryKey: ["transactions"] });
			await queryClient.invalidateQueries({ queryKey: ["transactions-statistics"] });
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not import the file");
		} finally {
			setLoading(false);
		}
	}

	if (result) {
		return (
			<Screen contentClassName="items-center justify-center gap-6">
				<View className="size-14 items-center justify-center rounded-full bg-raised">
					<Feather name="check" size={24} color={colors.income} />
				</View>
				<Text className="text-center text-title text-fg">
					{result.created} {result.created === 1 ? "transaction" : "transactions"} imported
				</Text>
				{result.skippedDuplicates > 0 ? (
					<Text className="text-center text-subhead text-muted">
						{result.skippedDuplicates} already existed and {result.skippedDuplicates === 1 ? "was" : "were"}{" "}
						skipped.
					</Text>
				) : null}
				<Button label="Done" onPress={() => router.back()} className="self-stretch" />
			</Screen>
		);
	}

	return (
		<Screen scroll edges={["left", "right", "bottom"]} contentClassName="gap-6">
			<View className="items-center gap-3 rounded-card bg-surface px-5 py-8">
				<View className="size-12 items-center justify-center rounded-full bg-raised">
					<Feather name="file-text" size={20} color={colors.muted} />
				</View>
				<Text className="text-headline text-fg">Backup file (.json)</Text>
				<Text className="text-center text-subhead text-muted">
					Choose a backup exported from this app on mobile, web or desktop. Transactions already on this
					device are kept.
				</Text>
			</View>
			<Notice kind="error" message={error} />
			{loading ? (
				<LoadingState />
			) : (
				<Button
					label="Choose file"
					icon={<Feather name="upload" size={16} color={colors["on-primary"]} />}
					onPress={handlePickFile}
				/>
			)}
		</Screen>
	);
}
