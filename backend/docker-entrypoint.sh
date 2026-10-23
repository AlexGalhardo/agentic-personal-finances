#!/bin/sh
# Generates the Prisma Client and applies migrations when the container
# starts: the client is provider-specific (sqlite vs postgresql), and the same
# image serves both depending on DATABASE_PROVIDER (see prisma7.config.ts).
set -e

bunx prisma7 migrate deploy
bunx prisma7 generate

exec bun run src/server.ts
