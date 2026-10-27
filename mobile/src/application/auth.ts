import { getDb } from "@/adapters/sqlite/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export type LocalAccount = { name: string; email: string; biometricEnabled: boolean };

type AccountRow = {
	name: string;
	email: string;
	password_hash: string;
	password_salt: string;
	password_iterations: number;
	biometric_enabled: number;
};

async function readRow(): Promise<AccountRow | null> {
	const db = await getDb();
	return db.getFirstAsync<AccountRow>("SELECT * FROM account WHERE id = 1");
}

function toAccount(row: AccountRow): LocalAccount {
	return { name: row.name, email: row.email, biometricEnabled: row.biometric_enabled === 1 };
}

export async function getAccount(): Promise<LocalAccount | null> {
	const row = await readRow();
	return row ? toAccount(row) : null;
}

export async function createAccount(input: { name: string; email: string; password: string }): Promise<LocalAccount> {
	if (await readRow()) throw new Error("An account already exists on this device.");
	const password = await hashPassword(input.password);
	const db = await getDb();
	const name = input.name.trim();
	const email = input.email.trim().toLowerCase();
	await db.runAsync(
		`INSERT INTO account (id, name, email, password_hash, password_salt, password_iterations, created_at)
		VALUES (1, ?, ?, ?, ?, ?, ?)`,
		[name, email, password.hash, password.salt, password.iterations, new Date().toISOString()],
	);
	return { name, email, biometricEnabled: false };
}

/** Returns the account when the credentials match, otherwise null. */
export async function verifyCredentials(email: string, password: string): Promise<LocalAccount | null> {
	const row = await readRow();
	if (!row) return null;
	const passwordOk = await verifyPassword(password, {
		hash: row.password_hash,
		salt: row.password_salt,
		iterations: row.password_iterations,
	});
	return passwordOk && row.email === email.trim().toLowerCase() ? toAccount(row) : null;
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
	const db = await getDb();
	await db.runAsync("UPDATE account SET biometric_enabled = ? WHERE id = 1", [enabled ? 1 : 0]);
}
