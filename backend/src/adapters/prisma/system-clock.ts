import type { Clock } from "@agentic-personal-finances/core";

export const systemClock: Clock = {
	now: () => new Date(),
};
