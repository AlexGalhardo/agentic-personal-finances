#!/usr/bin/env bash
# All-in-one local app: API + web dashboard + SQLite in a single process, no
# Docker, no Postgres. Linux, macOS, or Windows 11 from a Git Bash / WSL2
# terminal.
#
# Usage:
#   ./setups/setup-standalone.sh            # build and run on http://localhost:8787
#   ./setups/setup-standalone.sh build      # build only
#   ./setups/setup-standalone.sh desktop    # build and package the desktop app (installer in desktop/release/)
#
# Data (SQLite file + generated secrets) lives in ./.standalone-data.

set -e
cd "$(dirname "$0")/.."
source scripts/common.sh

require_bun

echo "==> Installing dependencies (bun install)"
bun install

echo "==> Building the standalone binary (bun run build)"
bun run build

BIN="./agentic-personal-finances"
[ -f "$BIN.exe" ] && BIN="$BIN.exe"

case "${1:-run}" in
build)
	echo "Built $BIN (keep it next to .standalone/)."
	;;
desktop)
	echo "==> Packaging the desktop app (embeds the binary above)"
	bun run desktop:dist
	echo "Installer/app in desktop/release/."
	;;
*)
	echo "==> Starting on http://localhost:8787 (Ctrl+C stops)"
	exec "$BIN"
	;;
esac
