import { defineRailway, github, postgres, project, service, volume } from "railway/iac";

export default defineRailway(() => {
	const agenticPersonalFinances = github("AlexGalhardo/agentic-personal-finances", {
		branch: "main",
		checkSuites: false,
	});

	const Postgres = postgres("Postgres", { region: "us-east4-eqdc4a" });
	Postgres.networking = { privateNetworkEndpoint: "postgres" };
	const postgresVolume = volume("postgres-volume", {
		alerts: { usage: { "100": {}, "80": {}, "95": {} } },
		allowOnlineResize: true,
		region: "us-east4-eqdc4a",
		sizeMB: 5000,
	});
	const frontend = service("frontend", {
		source: agenticPersonalFinances,
		build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "infra/Dockerfile" },
		replicas: { "us-east4-eqdc4a": 1 },
		domains: ["finances.vukem.dev"],
	});
	const backend = service("backend", {
		source: agenticPersonalFinances,
		build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "infra/Dockerfile" },
		replicas: { "us-east4-eqdc4a": 1 },
	});
	const bot = service("bot", {
		source: agenticPersonalFinances,
		build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "infra/Dockerfile" },
		replicas: { "us-east4-eqdc4a": 1 },
	});

	return project("agentic-personal-finances", {
		variables: { managed: false },
		resources: [frontend, backend, bot, Postgres, postgresVolume],
	});
});
