import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { getRandomBytes } from "expo-crypto";

export const PBKDF2_ITERATIONS = 60_000;
export const MIN_PASSWORD_LENGTH = 8;

export type PasswordHash = { hash: string; salt: string; iterations: number };

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
	return pbkdf2Async(sha256, new TextEncoder().encode(password), salt, { c: iterations, dkLen: 32 });
}

export async function hashPassword(password: string): Promise<PasswordHash> {
	const salt = getRandomBytes(16);
	const hash = await derive(password, salt, PBKDF2_ITERATIONS);
	return { hash: bytesToHex(hash), salt: bytesToHex(salt), iterations: PBKDF2_ITERATIONS };
}

export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
	const expected = hexToBytes(stored.hash);
	const actual = await derive(password, hexToBytes(stored.salt), stored.iterations);
	let diff = expected.length ^ actual.length;
	for (let i = 0; i < expected.length; i++) diff |= (expected[i] ?? 0) ^ (actual[i] ?? 0);
	return diff === 0;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignUp(input: { name: string; email: string; password: string; confirm: string }) {
	const errors: { name?: string; email?: string; password?: string; confirm?: string } = {};
	if (input.name.trim().length < 2) errors.name = "Enter your name.";
	if (!EMAIL_PATTERN.test(input.email.trim())) errors.email = "Enter a valid email.";
	if (input.password.length < MIN_PASSWORD_LENGTH) {
		errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
	}
	if (input.confirm !== input.password) errors.confirm = "Passwords do not match.";
	return errors;
}
