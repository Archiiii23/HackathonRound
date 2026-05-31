import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });
import { buildApp } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "8787", 10);
const app = buildApp();

app.listen(port, () => {
  console.log(`DevCollab API listening on http://localhost:${port}`);
});
