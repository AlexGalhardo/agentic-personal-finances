import { useQuery } from "@tanstack/react-query";
import { getAppConfig } from "#/application/config";

export function useAppConfig() {
	return useQuery({
		queryKey: ["app-config"],
		queryFn: getAppConfig,
		staleTime: Number.POSITIVE_INFINITY,
	});
}
