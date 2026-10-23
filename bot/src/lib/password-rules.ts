// Same password-strength rules as the frontend
// (frontend/src/components/password-strength-input.tsx), duplicated on purpose
// (see docs/code-conventions.md, sync points).
export const PASSWORD_RULES: { label: string; test: (value: string) => boolean }[] = [
	{ label: "Between 8 and 32 characters", test: (value) => value.length >= 8 && value.length <= 32 },
	{ label: "One lowercase letter (a-z)", test: (value) => /[a-z]/.test(value) },
	{ label: "One uppercase letter (A-Z)", test: (value) => /[A-Z]/.test(value) },
	{ label: "One digit (0-9)", test: (value) => /\d/.test(value) },
	{ label: "One special character (e.g. !@#$%)", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export function isStrongPassword(value: string): boolean {
	return PASSWORD_RULES.every((rule) => rule.test(value));
}

/** Labels of the rules the password doesn't meet yet. */
export function failingPasswordRules(value: string): string[] {
	return PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.label);
}
