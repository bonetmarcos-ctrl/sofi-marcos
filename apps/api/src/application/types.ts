export type CollectionName = "eventos" | "viajes" | "bloqueos" | "proyectos" | "palancas" | "deudas" | "suministros" | "gastosVariables" | "comprasSuper" | "cumpleanos";
export type AppState = Record<CollectionName, unknown[]>;
export type CollectionItem = Record<string, unknown> & { id?: string | number };

export type UserAccount = {
  username: string;
  passwordHash: string;
  createdAt: string;
};

export interface StateRepository {
  read(ownerId?: string): Promise<AppState>;
  write(state: AppState, ownerId?: string): Promise<void>;
}

export interface UserRepository {
  findByUsername(username: string): Promise<UserAccount | null>;
  create(user: UserAccount): Promise<UserAccount>;
}

export type HttpError = Error & {
  statusCode?: number;
  details?: unknown;
};