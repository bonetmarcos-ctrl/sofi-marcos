import { createInitialState } from "@sofi-marqui/domain";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export class JsonStateRepository {
  constructor(filePath) {
    this.filePath = path.resolve(process.cwd(), filePath);
    this.writeQueue = Promise.resolve();
  }

  async read() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      const initialState = createInitialState();
      await this.write(initialState);
      return initialState;
    }
  }

  async write(state) {
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(path.dirname(this.filePath), { recursive: true });
      await writeFile(this.filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    });

    return this.writeQueue;
  }
}