export default class Input {
  constructor(canvas, game, renderer) {
    this.canvas   = canvas;
    this.game     = game;
    this.renderer = renderer;
    this._bind();
  }

  _bind() {
    this.canvas.addEventListener("click", e => this._onClick(e));
  }

  _getCanvasPos(e) {
    const rect   = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width  / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }

  _onClick(e) {
    const { x, y } = this._getCanvasPos(e);
    const state     = this.game.state;
    const { STATES } = window._STATES; // importado desde Game

    // Estado: RESULTADO — click en cualquier lado para continuar
    if (state.is(STATES.RESULT)) {
      this.game.newRound();
      return;
    }

    // Estado: APUESTA
    if (state.is(STATES.BETTING)) {
      // Click en ficha
      const chipIdx = this.renderer.getChipAt(x, y);
      if (chipIdx >= 0) {
        this.game.placeChip(chipIdx);
        return;
      }
      // Click en cualquier parte de la mesa (con apuesta) → deal
      if (this.game.betting.hasBet) {
        this.game.deal();
        return;
      }
    }

    // Estado: TURNO DEL JUGADOR
    if (state.is(STATES.PLAYER_TURN)) {
      const btn = this.renderer.getButtonAt(x, y);
      if (!btn) return;
      switch (btn) {
        case "HIT":    this.game.hit();    break;
        case "STAND":  this.game.stand();  break;
        case "DOUBLE": this.game.double(); break;
        case "SPLIT":  this.game.split();  break;
      }
    }
  }
}
