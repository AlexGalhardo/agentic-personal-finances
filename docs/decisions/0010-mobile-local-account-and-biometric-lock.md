# 0010. Mobile: on-device account and biometric lock

- Status: Accepted
- Date: 2026-10-27

## Context

The mobile app is offline-first (local `expo-sqlite`, no API), so anyone who picks up an unlocked phone could open the finances. A server account is not an option: the app must keep working with no network and no backend.

## Decision

The SQLite database holds one local `account` row (name, email, PBKDF2-SHA256 hash with a random salt and the iteration count, `biometric_enabled`). A first launch without an account shows sign-up; otherwise the app starts locked and shows sign-in. `Stack.Protected` guards the routes by auth status, and the app locks again after 60 s in the background. **Settings > Biometric unlock** uses `expo-local-authentication` (fingerprint / face; Android falls back to the device PIN or pattern) and always requires a successful prompt to be switched on. Hashing uses pure-JS `@noble/hashes` so it works in Expo Go and in the Gradle build without a native module.

## Consequences

The account is an access gate, not encryption: the SQLite file itself is not encrypted, so someone with a rooted device or a file-system dump can still read it. There is no password recovery; the JSON backup does not carry the account, so after a reinstall the user creates a new account and imports the backup.
