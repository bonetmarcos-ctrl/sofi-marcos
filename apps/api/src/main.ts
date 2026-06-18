import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { JsonStateRepository } from "./infrastructure/jsonStateRepository.js";
import { PostgresStateRepository } from "./infrastructure/postgresStateRepository.js";

const repository = env.databaseUrl
  ? new PostgresStateRepository(env.databaseUrl)
  : new JsonStateRepository(env.dataFile);
const app = createApp({ repository });

app.listen(env.port, () => {
  const persistence = env.databaseUrl ? "PostgreSQL" : "JSON file";
  console.log(`Sofi Marqui API listening on http://localhost:${env.port} using ${persistence}`);
});