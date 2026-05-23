import { AsyncLocalStorage } from "node:async_hooks";

const store = new AsyncLocalStorage<{ request: Request }>();

export function runWithIncomingRequest<T>(request: Request, fn: () => Promise<T> | T) {
  return store.run({ request }, fn);
}

export function getIncomingRequest(): Request | null {
  return store.getStore()?.request ?? null;
}
