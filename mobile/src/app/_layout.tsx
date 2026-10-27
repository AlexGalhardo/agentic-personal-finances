import "@/global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { queryClient } from "@/query/client";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync();

function Routes() {
	const { status } = useAuth();

	useEffect(() => {
		if (status !== "loading") SplashScreen.hideAsync();
	}, [status]);

	if (status === "loading") return null;

	return (
		<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
			<Stack.Protected guard={status === "no-account"}>
				<Stack.Screen name="(auth)/sign-up" />
			</Stack.Protected>
			<Stack.Protected guard={status === "locked"}>
				<Stack.Screen name="(auth)/unlock" />
			</Stack.Protected>
			<Stack.Protected guard={status === "unlocked"}>
				<Stack.Screen name="index" />
				<Stack.Screen name="(app)" />
			</Stack.Protected>
		</Stack>
	);
}

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
			<SafeAreaProvider>
				<QueryClientProvider client={queryClient}>
					<AuthProvider>
						<StatusBar style="light" />
						<Routes />
					</AuthProvider>
				</QueryClientProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
