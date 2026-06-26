import { normalizeAppName } from "@sofi-marqui/domain";
import type { UserAccount, UserRepository } from "../application/types.js";

export class MemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, UserAccount>();

  constructor(initialUsers: UserAccount[] = []) {
    for (const user of initialUsers) {
      this.users.set(user.username, this.normalizeUser(user));
    }
  }

  async findByUsername(username: string) {
    const user = this.users.get(username);
    return user ? structuredClone(this.normalizeUser(user)) : null;
  }

  async create(user: UserAccount) {
    const normalizedUser = this.normalizeUser(user);

    if (this.users.has(normalizedUser.username)) {
      throw new Error("User already exists");
    }

    this.users.set(normalizedUser.username, structuredClone(normalizedUser));
    return structuredClone(normalizedUser);
  }

  private normalizeUser(user: UserAccount): UserAccount {
    return { ...user, appName: normalizeAppName(user.appName) };
  }
}