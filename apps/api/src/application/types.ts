export type CollectionName = "eventos" | "viajes" | "bloqueos" | "proyectos" | "palancas" | "deudas" | "suministros";
export type AppState = Record<CollectionName, unknown[]>;
export type CollectionItem = Record<string, unknown> & { id?: string | number };

export interface StateRepository {
  read(): Promise<AppState>;
  write(state: AppState): Promise<void>;
}

export type HttpError = Error & {
  statusCode?: number;
  details?: unknown;
};