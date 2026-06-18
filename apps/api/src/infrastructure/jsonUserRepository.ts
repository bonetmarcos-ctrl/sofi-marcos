import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { UserAccount, UserRepository } from "../application/types.js";

type StoredUsers = {
  version: 1;
  users: UserAccount[];
};

export class JsonUserRepository implements UserRepository {
  private readonly filePath: string;
  private writeQueue: Promise<void>;

  constructor(filePath: string) {
    this.filePath = path.resolve(process.cwd(), filePath);
    this.writeQueue = Promise.resolve();
  }

  async findByUsername(username: string) {
    const stored = await this.readStoredUsers();
    return stored.users.find((user) => user.username === username) || null;
  }

  async create(user: UserAccount) {
    this.writeQueue = this.writeQueue.then(async () => {
      const stored = await this.readStoredUsers();
      if (stored.users.some((currentUser) => currentUser.username === user.username)) {
        throw new Error("User already exists");
      }

      await this.writeStoredUsers({ ...stored, users: [...stored.users, user] });
    });

    await this.writeQueue;
    return user;
  }

  private async readStoredUsers(): Promise<StoredUsers> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return { version: 1, users: [] };
    }
  }

  private async writeStoredUsers(users: StoredUsers) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(users, null, 2)}\n`, "utf8");
  }
}