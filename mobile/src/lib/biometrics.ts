import * as LocalAuthentication from "expo-local-authentication";

/** True when the device has a fingerprint/face sensor with at least one enrollment. */
export async function isBiometricAvailable(): Promise<boolean> {
	const [hasHardware, enrolled] = await Promise.all([
		LocalAuthentication.hasHardwareAsync(),
		LocalAuthentication.isEnrolledAsync(),
	]);
	return hasHardware && enrolled;
}

/**
 * Shows the system prompt (fingerprint / face). Android also offers the
 * device PIN, pattern or password as a fallback, so the user is never stuck.
 */
export async function authenticateWithDevice(promptMessage: string): Promise<boolean> {
	const result = await LocalAuthentication.authenticateAsync({
		promptMessage,
		cancelLabel: "Cancel",
		disableDeviceFallback: false,
	});
	return result.success;
}
