import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { JsonStateRepository } from "./infrastructure/jsonStateRepository.js";
import { JsonUserRepository } from "./infrastructure/jsonUserRepository.js";
import { PostgresStateRepository } from "./infrastructure/postgresStateRepository.js";
import { PostgresUserRepository } from "./infrastructure/postgresUserRepository.js";

const repository = env.databaseUrl
  ? new PostgresStateRepository(env.databaseUrl)
  : new JsonStateRepository(env.dataFile);
const userRepository = env.databaseUrl
  ? new PostgresUserRepository(env.databaseUrl)
  : new JsonUserRepository(env.usersFile);
const app = createApp({ repository, userRepository });

app.listen(env.port, () => {
  const persistence = env.databaseUrl ? "PostgreSQL" : "JSON file";
  console.log(`Sofi Marqui API listening on http://localhost:${env.port} using ${persistence}`);
});