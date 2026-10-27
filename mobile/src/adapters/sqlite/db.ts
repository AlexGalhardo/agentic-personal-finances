import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

const DATABASE_NAME = "finances.db";

// Bump by appending a statement: user_version records how many ran.
const MIGRATIONS = [
	`CREATE TABLE transactions (
		id TEXT PRIMARY KEY NOT NULL,
		description TEXT NOT NULL,
		amount INTEGER NOT NULL,
		category TEXT NOT NULL,
		type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
		date TEXT NOT NULL,
		created_at TEXT NOT NULL,
		updated_at TEXT
	);
	CREATE INDEX transactions_date_idx ON transactions (date);`,
	// One local account per device: it only gates access to this database.
	`CREATE TABLE account (
		id INTEGER PRIMARY KEY CHECK (id = 1),
		name TEXT NOT NULL,
		email TEXT NOT NULL,
		password_hash TEXT NOT NULL,
		password_salt TEXT NOT NULL,
		password_iterations INTEGER NOT NULL,
		biometric_enabled INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL
	);`,
];

async function migrate(db: SQLiteDatabase): Promise<void> {
	const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
	const applied = row?.user_version ?? 0;
	for (let version = applied; version < MIGRATIONS.length; version++) {
		await db.withExclusiveTransactionAsync(async (tx) => {
			await tx.execAsync(MIGRATIONS[version] as string);
		});
		await db.execAsync(`PRAGMA user_version = ${version + 1}`);
	}
}

let opening: Promise<SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLiteDatabase> {
	opening ??= openDatabaseAsync(DATABASE_NAME).then(async (db) => {
		await migrate(db);
		return db;
	});
	return opening;
}
