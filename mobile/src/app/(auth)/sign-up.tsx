import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Screen } from "@/components/ui/screen";
import { TextField } from "@/components/ui/text-field";
import { useAuth } from "@/lib/auth-context";
import { validateSignUp } from "@/lib/password";
import { colors } from "@/theme";

export default function SignUpScreen() {
	const { signUp } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [errors, setErrors] = useState<ReturnType<typeof validateSignUp>>({});
	const [failure, setFailure] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(): Promise<void> {
		setFailure(null);
		const found = validateSignUp({ name, email, password, confirm });
		setErrors(found);
		if (Object.keys(found).length > 0) return;

		setLoading(true);
		try {
			await signUp({ name, email, password });
		} catch (reason) {
			setFailure(reason instanceof Error ? reason.message : "Could not create the account.");
			setLoading(false);
		}
	}

	return (
		<Screen scroll contentClassName="gap-6">
			<View className="items-center gap-3 pt-6">
				<View className="size-14 items-center justify-center rounded-full bg-raised">
					<Feather name="user-plus" size={24} color={colors.brand} />
				</View>
				<Text className="text-title text-fg">Create your account</Text>
				<Text className="text-center text-subhead text-muted">
					The account lives only on this device and protects your data. Nothing is sent anywhere.
				</Text>
			</View>
			<View className="gap-4">
				<TextField label="Name" value={name} onChangeText={setName} error={errors.name} autoComplete="name" />
				<TextField
					label="Email"
					value={email}
					onChangeText={setEmail}
					error={errors.email}
					autoCapitalize="none"
					autoComplete="email"
					keyboardType="email-address"
				/>
				<TextField
					label="Password"
					value={password}
					onChangeText={setPassword}
					error={errors.password}
					secureTextEntry
					autoCapitalize="none"
				/>
				<TextField
					label="Confirm password"
					value={confirm}
					onChangeText={setConfirm}
					error={errors.confirm}
					secureTextEntry
					autoCapitalize="none"
					onSubmitEditing={onSubmit}
				/>
			</View>
			<Notice kind="error" message={failure} />
			<Button label="Create account" onPress={onSubmit} loading={loading} />
			<Text className="text-center text-footnote text-subtle">
				There is no password recovery: if you forget it, export a backup first or reinstall the app.
			</Text>
		</Screen>
	);
}
