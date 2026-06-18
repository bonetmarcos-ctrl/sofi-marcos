import type { UserAccount, UserRepository } from "../application/types.js";

export class MemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, UserAccount>();

  constructor(initialUsers: UserAccount[] = []) {
    for (const user of initialUsers) {
      this.users.set(user.username, structuredClone(user));
    }
  }

  async findByUsername(username: string) {
    const user = this.users.get(username);
    return user ? structuredClone(user) : null;
  }

  async create(user: UserAccount) {
    if (this.users.has(user.username)) {
      throw new Error("User already exists");
    }

    this.users.set(user.username, structuredClone(user));
    return structuredClone(user);
  }
}