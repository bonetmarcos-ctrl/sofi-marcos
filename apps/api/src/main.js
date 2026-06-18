import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { JsonStateRepository } from "./infrastructure/jsonStateRepository.js";

const repository = new JsonStateRepository(env.dataFile);
const app = createApp({ repository });

app.listen(env.port, () => {
  console.log(`Sofi Marqui API listening on http://localhost:${env.port}`);
});