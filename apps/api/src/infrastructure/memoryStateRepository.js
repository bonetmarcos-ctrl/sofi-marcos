import { createInitialState } from "@sofi-marqui/domain";

export class MemoryStateRepository {
  constructor(initialState = createInitialState()) {
    this.state = structuredClone(initialState);
  }

  async read() {
    return structuredClone(this.state);
  }

  async write(state) {
    this.state = structuredClone(state);
  }
}