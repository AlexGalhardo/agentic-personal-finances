import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/application/users";

export const ME_QUERY_KEY = ["me"] as const;

export function useMeQuery() {
	return useQuery({
		queryKey: ME_QUERY_KEY,
		queryFn: getCurrentUser,
	});
}

export function useRefreshMe(): () => Promise<void> {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
}
