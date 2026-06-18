import { createInitialState } from "@sofi-marqui/domain";
import type { AppState, StateRepository } from "../application/types.js";

export class MemoryStateRepository implements StateRepository {
  private state: AppState;

  constructor(initialState = createInitialState()) {
    this.state = structuredClone(initialState);
  }

  async read(): Promise<AppState> {
    return structuredClone(this.state);
  }

  async write(state: AppState) {
    this.state = structuredClone(state);
  }
}