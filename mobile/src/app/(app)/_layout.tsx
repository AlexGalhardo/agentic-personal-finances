import { Stack } from "expo-router";

import { colors } from "@/theme";

export default function AppLayout() {
	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: colors.canvas },
				headerTintColor: colors.fg,
				headerTitleStyle: { fontWeight: "600" },
				headerShadowVisible: false,
				headerBackButtonDisplayMode: "minimal",
				contentStyle: { backgroundColor: colors.canvas },
			}}
		>
			<Stack.Screen name="dashboard" options={{ headerShown: false }} />
			<Stack.Screen name="search" options={{ title: "Search" }} />
			<Stack.Screen name="profile" options={{ title: "Settings" }} />
			<Stack.Screen name="import-backup" options={{ title: "Import backup", presentation: "modal" }} />
			<Stack.Screen name="transaction/[id]" options={{ presentation: "modal" }} />
		</Stack>
	);
}
