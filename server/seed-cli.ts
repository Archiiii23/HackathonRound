import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import { connectDb } from "./db.js";
import { ensureDemoUser, ensureWorkspaceMembers, seedIfEmpty } from "./seed.js";

(async () => {
  await connectDb();
  const a = await seedIfEmpty();
  const b = await ensureDemoUser();
  const c = await ensureWorkspaceMembers();
  console.log("Seed:", a);
  console.log("Demo user:", b);
  console.log("Workspace members:", c);
  process.exit(0);
})().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
