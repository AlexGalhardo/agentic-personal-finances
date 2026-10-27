import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Screen } from "@/components/ui/screen";
import { TextField } from "@/components/ui/text-field";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/theme";

export default function UnlockScreen() {
	const { account, signIn, unlockWithBiometrics } = useAuth();
	const [email, setEmail] = useState(account?.email ?? "");
	const [password, setPassword] = useState("");
	const [failure, setFailure] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const prompted = useRef(false);
	const biometric = account?.biometricEnabled ?? false;

	async function onBiometric(): Promise<void> {
		setFailure(null);
		if (!(await unlockWithBiometrics())) setFailure("Biometric check did not succeed. Use your password instead.");
	}

	useEffect(() => {
		if (!biometric || prompted.current) return;
		prompted.current = true;
		unlockWithBiometrics();
	}, [biometric, unlockWithBiometrics]);

	async function onSubmit(): Promise<void> {
		setFailure(null);
		setLoading(true);
		try {
			if (!(await signIn(email, password))) {
				setFailure("Wrong email or password.");
				setLoading(false);
			}
		} catch {
			setFailure("Could not check your credentials.");
			setLoading(false);
		}
	}

	return (
		<Screen scroll contentClassName="justify-center gap-6">
			<View className="items-center gap-3">
				<View className="size-14 items-center justify-center rounded-full bg-raised">
					<Feather name="lock" size={24} color={colors.brand} />
				</View>
				<Text className="text-title text-fg">{account ? `Welcome back, ${account.name}` : "Welcome back"}</Text>
				<Text className="text-center text-subhead text-muted">Sign in to open your finances.</Text>
			</View>
			<View className="gap-4">
				<TextField
					label="Email"
					value={email}
					onChangeText={setEmail}
					autoCapitalize="none"
					autoComplete="email"
					keyboardType="email-address"
				/>
				<TextField
					label="Password"
					value={password}
					onChangeText={setPassword}
					secureTextEntry
					autoCapitalize="none"
					onSubmitEditing={onSubmit}
				/>
			</View>
			<Notice kind="error" message={failure} />
			<Button label="Sign in" onPress={onSubmit} loading={loading} />
			{biometric ? (
				<Button
					label="Use fingerprint or face"
					variant="secondary"
					icon={<Feather name="unlock" size={16} color={colors.fg} />}
					onPress={onBiometric}
				/>
			) : null}
		</Screen>
	);
}
