import type { QueryClient, QueryKey } from "@tanstack/react-query";

/** Prefetch route data without crashing the router if the API is temporarily down. */
export async function safeEnsureQueryData<T>(
  queryClient: QueryClient,
  options: {
    queryKey: QueryKey;
    queryFn: () => Promise<T>;
    fallback: T;
  },
): Promise<T> {
  try {
    return await queryClient.ensureQueryData({
      queryKey: options.queryKey,
      queryFn: options.queryFn,
    });
  } catch {
    queryClient.setQueryData(options.queryKey, options.fallback);
    return options.fallback;
  }
}
