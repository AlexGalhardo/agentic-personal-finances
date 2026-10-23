import { defineConfig as definePostgresConfig, prisma7Schema } from "@prisma/orm-postgres/config";
import { defineConfig as defineSqliteConfig } from "@prisma/orm-sqlite/config";
import { definePrismaConfig } from "prisma/config";

try {
	process.loadEnvFile(".env");
} catch {
	// env already set (CI, containers)
}

const provider = process.env.DATABASE_PROVIDER === "postgresql" ? "postgresql" : "sqlite";
const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const schemaPath = `prisma/schema.${provider}.prisma`;

// Prisma ORM 8 side-by-side config (CLI `prisma`). Runtime still uses the
// Prisma 7 client from `prisma7 generate` until routes migrate to ORM 8.
export default definePrismaConfig({
	orm:
		provider === "postgresql"
			? definePostgresConfig({
					contract: prisma7Schema(schemaPath),
					output: "prisma/generated/prisma8-postgres",
					db: {
						connection: databaseUrl,
					},
				})
			: defineSqliteConfig({
					contract: prisma7Schema(schemaPath),
					output: "prisma/generated/prisma8-sqlite",
					db: {
						connection: databaseUrl,
					},
				}),
});
