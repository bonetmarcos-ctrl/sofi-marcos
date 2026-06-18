import pg from "pg";
import type { UserAccount, UserRepository } from "../application/types.js";

export class PostgresUserRepository implements UserRepository {
  private readonly pool: pg.Pool;
  private readonly ready: Promise<void>;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
    });
    this.ready = this.ensureSchema();
  }

  async ensureSchema() {
    await this.pool.query(`
      create table if not exists app_users (
        username text primary key,
        password_hash text not null,
        created_at timestamptz not null default now()
      )
    `);
  }

  async findByUsername(username: string) {
    await this.ready;
    const result = await this.pool.query("select username, password_hash, created_at from app_users where username = $1", [username]);
    if (result.rowCount === 0) return null;

    const row = result.rows[0];
    return {
      username: row.username,
      passwordHash: row.password_hash,
      createdAt: row.created_at.toISOString(),
    };
  }

  async create(user: UserAccount) {
    await this.ready;
    await this.pool.query(
      "insert into app_users (username, password_hash, created_at) values ($1, $2, $3)",
      [user.username, user.passwordHash, user.createdAt],
    );
    return user;
  }

  async close() {
    await this.pool.end();
  }
}