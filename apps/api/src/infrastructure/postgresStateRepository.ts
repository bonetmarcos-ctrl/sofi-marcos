import { createEmptyState, createInitialState } from "@sofi-marqui/domain";
import pg from "pg";
import type { AppState, StateRepository } from "../application/types.js";

const DEFAULT_OWNER = "default";

export class PostgresStateRepository implements StateRepository {
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
      create table if not exists app_state (
        id text primary key,
        data jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);
  }

  async read(ownerId = DEFAULT_OWNER): Promise<AppState> {
    await this.ready;
    const result = await this.pool.query("select data from app_state where id = $1", [ownerId]);

    if (result.rowCount > 0) {
      return result.rows[0].data;
    }

    const initialState = ownerId === DEFAULT_OWNER ? createInitialState() : createEmptyState();
    await this.write(initialState, ownerId);
    return initialState;
  }

  async write(state: AppState, ownerId = DEFAULT_OWNER) {
    await this.ready;
    await this.pool.query(
      `
        insert into app_state (id, data, updated_at)
        values ($1, $2::jsonb, now())
        on conflict (id)
        do update set data = excluded.data, updated_at = now()
      `,
      [ownerId, JSON.stringify(state)],
    );
  }

  async close() {
    await this.pool.end();
  }
}