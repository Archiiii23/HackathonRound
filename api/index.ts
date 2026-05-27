import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildApp } from "../server/app.js";

export const config = { api: { bodyParser: false } };

const app = buildApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // The frontend hits `/api/*` but Express routes are defined without that
  // prefix (e.g. `/auth/login`, `/projects`). Strip the `/api` segment so the
  // router matches.
  if (typeof req.url === "string") {
    req.url = req.url.replace(/^\/api(?=\/|$)/, "") || "/";
  }
  return app(req as never, res as never);
}
