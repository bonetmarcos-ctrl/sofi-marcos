import { collectionNames, collectionSchemas, createInitialState } from "@sofi-marqui/domain";
import { nanoid } from "nanoid";

export class AppStateService {
  constructor(repository) {
    this.repository = repository;
  }

  async getState() {
    return this.repository.read();
  }

  async resetState() {
    const state = createInitialState();
    await this.repository.write(state);
    return state;
  }

  async replaceState(payload) {
    const state = createInitialState();

    for (const collection of collectionNames) {
      state[collection] = Array.isArray(payload[collection])
        ? payload[collection].map((item) => this.parse(collection, item))
        : [];
    }

    await this.repository.write(state);
    return state;
  }

  async list(collection) {
    this.assertCollection(collection);
    const state = await this.repository.read();
    return state[collection] || [];
  }

  async create(collection, payload) {
    this.assertCollection(collection);
    const item = this.parse(collection, { ...payload, id: payload.id ?? nanoid(10) });
    const state = await this.repository.read();
    const next = { ...state, [collection]: [...(state[collection] || []), item] };
    await this.repository.write(next);
    return item;
  }

  async update(collection, id, payload) {
    this.assertCollection(collection);
    const state = await this.repository.read();
    const current = state[collection] || [];
    const index = current.findIndex((item) => String(item.id) === String(id));

    if (index === -1) {
      const error = new Error(`${collection} item not found`);
      error.statusCode = 404;
      throw error;
    }

    const item = this.parse(collection, { ...current[index], ...payload, id: current[index].id });
    const nextCollection = current.map((currentItem, currentIndex) =>
      currentIndex === index ? item : currentItem,
    );
    await this.repository.write({ ...state, [collection]: nextCollection });
    return item;
  }

  async remove(collection, id) {
    this.assertCollection(collection);
    const state = await this.repository.read();
    const current = state[collection] || [];
    const nextCollection = current.filter((item) => String(item.id) !== String(id));

    if (nextCollection.length === current.length) {
      const error = new Error(`${collection} item not found`);
      error.statusCode = 404;
      throw error;
    }

    await this.repository.write({ ...state, [collection]: nextCollection });
    return { id };
  }

  assertCollection(collection) {
    if (!collectionNames.includes(collection)) {
      const error = new Error(`Unknown collection: ${collection}`);
      error.statusCode = 404;
      throw error;
    }
  }

  parse(collection, payload) {
    const result = collectionSchemas[collection].safeParse(payload);

    if (!result.success) {
      const error = new Error("Validation failed");
      error.statusCode = 422;
      error.details = result.error.flatten();
      throw error;
    }

    return result.data;
  }
}