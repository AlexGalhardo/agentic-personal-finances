// Mesmas regras de força de senha do frontend e do bot (ver
// frontend/src/components/password-strength-input.tsx e
// bot/src/lib/password-rules.ts) — duplicadas de propósito, mesmo padrão de
// categoryLabels (ver CLAUDE.md).
export const PASSWORD_RULES: { key: string; label: string; test: (value: string) => boolean }[] = [
	{ key: "length", label: "Between 8 and 32 characters", test: (value) => value.length >= 8 && value.length <= 32 },
	{ key: "lowercase", label: "One lowercase letter (a-z)", test: (value) => /[a-z]/.test(value) },
	{ key: "uppercase", label: "One uppercase letter (A-Z)", test: (value) => /[A-Z]/.test(value) },
	{ key: "number", label: "One digit (0-9)", test: (value) => /\d/.test(value) },
	{ key: "special", label: "One special character (e.g. !@#$%)", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export function isStrongPassword(value: string): boolean {
	return PASSWORD_RULES.every((rule) => rule.test(value));
}
