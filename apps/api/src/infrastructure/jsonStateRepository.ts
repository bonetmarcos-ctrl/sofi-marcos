import { createInitialState } from "@sofi-marqui/domain";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AppState, StateRepository } from "../application/types.js";

export class JsonStateRepository implements StateRepository {
  private readonly filePath: string;
  private writeQueue: Promise<void>;

  constructor(filePath: string) {
    this.filePath = path.resolve(process.cwd(), filePath);
    this.writeQueue = Promise.resolve();
  }

  async read(): Promise<AppState> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const initialState = createInitialState();
      await this.write(initialState);
      return initialState;
    }
  }

  async write(state: AppState) {
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(path.dirname(this.filePath), { recursive: true });
      await writeFile(this.filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    });

    return this.writeQueue;
  }
}