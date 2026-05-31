/** Wrap a queryFn so React Query / suspense never throws to the router error boundary. */
export function safeQueryFn<T>(fn: () => Promise<T>, fallback: T): () => Promise<T> {
  return async () => {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  };
}
