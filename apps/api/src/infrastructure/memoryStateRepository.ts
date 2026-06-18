import { createInitialState } from "@sofi-marqui/domain";
import type { AppState, StateRepository } from "../application/types.js";

export class MemoryStateRepository implements StateRepository {
  private states: Map<string, AppState>;

  constructor(initialState = createInitialState()) {
    this.states = new Map([["default", structuredClone(initialState)]]);
  }

  async read(ownerId = "default"): Promise<AppState> {
    const state = this.states.get(ownerId) || createInitialState();
    if (!this.states.has(ownerId)) {
      this.states.set(ownerId, structuredClone(state));
    }
    return structuredClone(state);
  }

  async write(state: AppState, ownerId = "default") {
    this.states.set(ownerId, structuredClone(state));
  }
}