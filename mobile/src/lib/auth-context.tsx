import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import {
	createAccount,
	getAccount,
	type LocalAccount,
	setBiometricEnabled as persistBiometricEnabled,
	verifyCredentials,
} from "@/application/auth";
import { authenticateWithDevice } from "@/lib/biometrics";

// File and folder pickers push the app to the background for a moment; only
// lock after a real absence.
const RELOCK_AFTER_MS = 60_000;

type Status = "loading" | "no-account" | "locked" | "unlocked";

type AuthContextValue = {
	status: Status;
	account: LocalAccount | null;
	signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
	signIn: (email: string, password: string) => Promise<boolean>;
	unlockWithBiometrics: () => Promise<boolean>;
	setBiometricEnabled: (enabled: boolean) => Promise<boolean>;
	lock: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<Status>("loading");
	const [account, setAccount] = useState<LocalAccount | null>(null);
	const backgroundedAt = useRef<number | null>(null);

	useEffect(() => {
		getAccount().then((stored) => {
			setAccount(stored);
			setStatus(stored ? "locked" : "no-account");
		});
	}, []);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "background") {
				backgroundedAt.current = Date.now();
				return;
			}
			const left = backgroundedAt.current;
			backgroundedAt.current = null;
			if (state === "active" && left !== null && Date.now() - left > RELOCK_AFTER_MS) {
				setStatus((current) => (current === "unlocked" ? "locked" : current));
			}
		});
		return () => subscription.remove();
	}, []);

	const signUp = useCallback(async (input: { name: string; email: string; password: string }) => {
		setAccount(await createAccount(input));
		setStatus("unlocked");
	}, []);

	const signIn = useCallback(async (email: string, password: string) => {
		const verified = await verifyCredentials(email, password);
		if (!verified) return false;
		setAccount(verified);
		setStatus("unlocked");
		return true;
	}, []);

	const unlockWithBiometrics = useCallback(async () => {
		const ok = await authenticateWithDevice("Unlock Money");
		if (ok) setStatus("unlocked");
		return ok;
	}, []);

	const setBiometricEnabled = useCallback(async (enabled: boolean) => {
		if (enabled && !(await authenticateWithDevice("Confirm to enable biometric unlock"))) return false;
		await persistBiometricEnabled(enabled);
		setAccount((current) => (current ? { ...current, biometricEnabled: enabled } : current));
		return true;
	}, []);

	const lock = useCallback(() => setStatus("locked"), []);

	const value = useMemo(
		() => ({ status, account, signUp, signIn, unlockWithBiometrics, setBiometricEnabled, lock }),
		[status, account, signUp, signIn, unlockWithBiometrics, setBiometricEnabled, lock],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const value = useContext(AuthContext);
	if (!value) throw new Error("useAuth must be used inside AuthProvider");
	return value;
}
