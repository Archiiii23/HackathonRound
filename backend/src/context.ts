import { AsyncLocalStorage } from "node:async_hooks";

export interface CfEnv {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  AI_BASE_URL?: string;
  ALLOWED_ORIGINS?: string;
  SESSION_COOKIE_DOMAIN?: string;
}

export interface RequestContext {
  env: CfEnv;
  request: Request;
  executionCtx: ExecutionContext;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(ctx: RequestContext, fn: () => Promise<T> | T): Promise<T> | T {
  return storage.run(ctx, fn);
}

export function getRequestContext(): RequestContext {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error(
      "Request context unavailable. This function must run inside the Worker request handler.",
    );
  }
  return ctx;
}

export function getEnv(): CfEnv {
  return getRequestContext().env;
}
