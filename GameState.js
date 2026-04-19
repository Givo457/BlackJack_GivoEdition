export const STATES = {
  BETTING:     "BETTING",
  DEALING:     "DEALING",
  PLAYER_TURN: "PLAYER_TURN",
  DEALER_TURN: "DEALER_TURN",
  RESULT:      "RESULT",
};

export default class GameState {
  constructor() {
    this.current = STATES.BETTING;
  }

  set(newState) {
    if (!STATES[newState]) {
      console.warn(`[GameState] Estado inválido: ${newState}`);
      return;
    }
    console.log(`[STATE] ${this.current} → ${newState}`);
    this.current = newState;
  }

  is(state)  { return this.current === state; }
  not(state) { return this.current !== state; }
}
