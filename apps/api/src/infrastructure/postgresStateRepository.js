import { createInitialState } from "@sofi-marqui/domain";
import pg from "pg";

const STATE_ID = "default";

export class PostgresStateRepository {
  constructor(connectionString) {
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

  async read() {
    await this.ready;
    const result = await this.pool.query("select data from app_state where id = $1", [STATE_ID]);

    if (result.rowCount > 0) {
      return result.rows[0].data;
    }

    const initialState = createInitialState();
    await this.write(initialState);
    return initialState;
  }

  async write(state) {
    await this.ready;
    await this.pool.query(
      `
        insert into app_state (id, data, updated_at)
        values ($1, $2::jsonb, now())
        on conflict (id)
        do update set data = excluded.data, updated_at = now()
      `,
      [STATE_ID, JSON.stringify(state)],
    );
  }

  async close() {
    await this.pool.end();
  }
}