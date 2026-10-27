/** @type {import('jest').Config} */
module.exports = {
	preset: "jest-expo",
	setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
	transformIgnorePatterns: [
		"node_modules/(?!(.pnpm|bun/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@noble/hashes))",
	],
	testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.test.{ts,tsx}", "!src/app/**"],
};
