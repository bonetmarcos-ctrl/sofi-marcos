import { createEmptyState, createInitialState } from "@sofi-marqui/domain";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AppState, StateRepository } from "../application/types.js";

type StoredState = AppState | { version: 2; users: Record<string, AppState> };

const DEFAULT_OWNER = "default";

const hasUserStates = (payload: StoredState): payload is { version: 2; users: Record<string, AppState> } =>
  Boolean(payload && typeof payload === "object" && "users" in payload);

const parseStoredState = (raw: string): StoredState => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const sanitized = raw.trimEnd().replace(/(?:\\n)+$/, "");
    if (sanitized !== raw) return JSON.parse(sanitized);
    throw error;
  }
};

export class JsonStateRepository implements StateRepository {
  private readonly filePath: string;
  private writeQueue: Promise<void>;

  constructor(filePath: string) {
    this.filePath = path.resolve(process.cwd(), filePath);
    this.writeQueue = Promise.resolve();
  }

  async read(ownerId = DEFAULT_OWNER): Promise<AppState> {
    const stored = await this.readStoredState();

    if (!hasUserStates(stored)) {
      if (ownerId !== DEFAULT_OWNER) {
        const initialState = createEmptyState();
        await this.write(initialState, ownerId);
        return initialState;
      }

      return stored;
    }

    if (!stored.users[ownerId]) {
      const initialState = ownerId === DEFAULT_OWNER ? createInitialState() : createEmptyState();
      await this.write(initialState, ownerId);
      return initialState;
    }

    return stored.users[ownerId];
  }

  async write(state: AppState, ownerId = DEFAULT_OWNER) {
    this.writeQueue = this.writeQueue.then(async () => {
      const stored = await this.readStoredState();
      const next = ownerId === DEFAULT_OWNER && !hasUserStates(stored)
        ? state
        : {
            version: 2 as const,
            users: {
              ...(hasUserStates(stored) ? stored.users : { [DEFAULT_OWNER]: stored }),
              [ownerId]: state,
            },
          };

      await mkdir(path.dirname(this.filePath), { recursive: true });
      await writeFile(this.filePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    });

    return this.writeQueue;
  }

  private async readStoredState(): Promise<StoredState> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return parseStoredState(raw);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const initialState = createInitialState();
      await mkdir(path.dirname(this.filePath), { recursive: true });
      await writeFile(this.filePath, `${JSON.stringify(initialState, null, 2)}\n`, "utf8");
      return initialState;
    }
  }
}