// Vercel function entry — plain JS so Vercel skips the slow TypeScript
// compilation pass. The actual Express app is bundled into _server.cjs
// during the build step (see `build:api` in package.json).
import server from "./_server.cjs";

export const config = { api: { bodyParser: false } };

const app = server.buildApp();

export default function handler(req, res) {
  // Strip the leading /api so Express routes match (e.g. /auth/login,
  // /projects, etc.).
  if (typeof req.url === "string") {
    req.url = req.url.replace(/^\/api(?=\/|$)/, "") || "/";
  }
  return app(req, res);
}
