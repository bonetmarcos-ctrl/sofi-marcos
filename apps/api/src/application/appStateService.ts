import { collectionNames, collectionSchemas, createInitialState } from "@sofi-marqui/domain";
import { nanoid } from "nanoid";
import type { AppState, CollectionItem, CollectionName, HttpError, StateRepository } from "./types.js";

export class AppStateService {
  private readonly repository: StateRepository;

  constructor(repository: StateRepository) {
    this.repository = repository;
  }

  async getState(): Promise<AppState> {
    return this.normalizeState(await this.repository.read());
  }

  async getUserState(ownerId: string): Promise<AppState> {
    return this.normalizeState(await this.repository.read(ownerId));
  }

  async resetState(ownerId?: string): Promise<AppState> {
    const state = createInitialState() as AppState;
    await this.repository.write(state, ownerId);
    return state;
  }

  async replaceState(payload: Partial<Record<CollectionName, unknown[]>>, ownerId?: string): Promise<AppState> {
    const state = createInitialState() as AppState;

    for (const collection of collectionNames as CollectionName[]) {
      state[collection] = Array.isArray(payload[collection])
        ? payload[collection].map((item) => this.parse(collection, item))
        : [];
    }

    await this.repository.write(state, ownerId);
    return state;
  }

  async list(collection: string, ownerId?: string) {
    this.assertCollection(collection);
    const state = this.normalizeState(await this.repository.read(ownerId));
    return state[collection] || [];
  }

  async create(collection: string, payload: Record<string, unknown>, ownerId?: string) {
    this.assertCollection(collection);
    const item = this.parse(collection, { ...payload, id: payload.id ?? nanoid(10) });
    const state = this.normalizeState(await this.repository.read(ownerId));
    const next = { ...state, [collection]: [...(state[collection] || []), item] };
    await this.repository.write(next, ownerId);
    return item;
  }

  async update(collection: string, id: string, payload: Record<string, unknown>, ownerId?: string) {
    this.assertCollection(collection);
    const state = this.normalizeState(await this.repository.read(ownerId));
    const current = (state[collection] || []) as CollectionItem[];
    const index = current.findIndex((item) => String(item.id) === String(id));

    if (index === -1) {
      const error = new Error(`${collection} item not found`) as HttpError;
      error.statusCode = 404;
      throw error;
    }

    const item = this.parse(collection, { ...current[index], ...payload, id: current[index].id });
    const nextCollection = current.map((currentItem, currentIndex) =>
      currentIndex === index ? item : currentItem,
    );
    await this.repository.write({ ...state, [collection]: nextCollection }, ownerId);
    return item;
  }

  async remove(collection: string, id: string, ownerId?: string) {
    this.assertCollection(collection);
    const state = this.normalizeState(await this.repository.read(ownerId));
    const current = (state[collection] || []) as CollectionItem[];
    const nextCollection = current.filter((item) => String(item.id) !== String(id));

    if (nextCollection.length === current.length) {
      const error = new Error(`${collection} item not found`) as HttpError;
      error.statusCode = 404;
      throw error;
    }

    await this.repository.write({ ...state, [collection]: nextCollection }, ownerId);
    return { id };
  }

  assertCollection(collection: string): asserts collection is CollectionName {
    if (!collectionNames.includes(collection as CollectionName)) {
      const error = new Error(`Unknown collection: ${collection}`) as HttpError;
      error.statusCode = 404;
      throw error;
    }
  }

  parse(collection: CollectionName, payload: unknown) {
    const result = collectionSchemas[collection].safeParse(payload);

    if (!result.success) {
      const error = new Error("Validation failed") as HttpError;
      error.statusCode = 422;
      error.details = result.error.flatten();
      throw error;
    }

    return result.data;
  }

  private normalizeState(state: AppState): AppState {
    const initialState = createInitialState() as AppState;
    const normalized = { ...initialState, ...state };

    for (const collection of collectionNames as CollectionName[]) {
      if (!Array.isArray(normalized[collection])) {
        normalized[collection] = initialState[collection];
      }
    }

    return normalized;
  }
}