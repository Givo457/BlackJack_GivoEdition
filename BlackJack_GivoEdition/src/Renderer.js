import { STATES }  from "./systems/GameState.js";
import { CHIPS }    from "./systems/BettingSystem.js";

// Dimensiones de cada sprite
const CARD_W   = 18;
const CARD_H   = 26;
const CHIP_W   = 18;
const CHIP_H   = 18;
const BTN_W    = 36;
const BTN_H    = 18;

// Layout del juego (en píxeles del canvas 480×270)
const LAYOUT = {
  dealer: { x: 60,  y: 40  },  // inicio cartas del dealer
  player: { x: 60,  y: 160 },  // inicio cartas del jugador
  chips:  { y: 238 },           // fila de fichas
  btns:   { y: 250 },           // fila de botones
  score:  { dealer: { x: 8, y: 36  }, player: { x: 8, y: 156 } },
};

// Posiciones X de las 5 fichas (centradas en el canvas)
const CHIP_XS = [100, 124, 148, 172, 196];

// Posiciones X de los 4 botones (centrados en el canvas)
const BTN_XS  = [270, 312, 354, 396];
const BTN_LABELS = ["HIT", "STAND", "DOUBLE", "SPLIT"];

// Colores fallback (cuando no hay imagen)
const C = {
  bg:       "#1a5c2e",
  table:    "#0d7a3a",
  felt:     "#0b5e2b",
  cardBg:   "#ffffff",
  cardRed:  "#cc2200",
  cardBlk:  "#111111",
  cardBack: "#1a3a8a",
  text:     "#ffffff",
  muted:    "#8fbf8f",
  yellow:   "#ffe066",
  red:      "#ff5555",
  blue:     "#55aaff",
  btn:      "#2a4a2a",
  btnHover: "#3a6a3a",
  chip:     ["#4488ff","#44cc44","#ff4444","#222222","#aa44ff"],
};

export default class Renderer {
  constructor(ctx, assets) {
    this.ctx    = ctx;
    this.assets = assets;
    this.W      = ctx.canvas.width;
    this.H      = ctx.canvas.height;

    // Botones activos según el estado (se actualiza en render)
    this.activeButtons = [];
  }

  render(state, playerHands, activeHandIdx, dealerHand, betting, result) {
    this._drawBackground();
    this._drawDealerHand(dealerHand, state);
    this._drawPlayerHands(playerHands, activeHandIdx);
    this._drawScores(state, playerHands, activeHandIdx, dealerHand);
    this._drawBettingInfo(betting);
    this._drawChips(betting, state);
    this._drawButtons(state, playerHands, activeHandIdx, betting);
    if (result) this._drawResult(result);
    if (state.is(STATES.BETTING)) this._drawBettingHint(betting);
  }

  // ── Fondo ───────────────────────────────────────────────
  _drawBackground() {
    const ctx = this.ctx;
    if (this.assets.has("table")) {
      ctx.drawImage(this.assets.get("table"), 0, 0, this.W, this.H);
    } else {
      // Fallback: mesa verde
      ctx.fillStyle = C.felt;
      ctx.fillRect(0, 0, this.W, this.H);
      // Borde decorativo
      ctx.strokeStyle = "#1a8a3a";
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 6, this.W - 12, this.H - 12);
    }
  }

  // ── Cartas ──────────────────────────────────────────────
  _drawCard(card, x, y) {
    const ctx = this.ctx;

    if (!card.faceUp) {
      // Carta boca abajo
      if (this.assets.has("cardBack")) {
        ctx.drawImage(this.assets.get("cardBack"), 0, 0, CARD_W, CARD_H, x, y, CARD_W, CARD_H);
      } else {
        ctx.fillStyle = C.cardBack;
        ctx.fillRect(x, y, CARD_W, CARD_H);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, CARD_W, CARD_H);
      }
      return;
    }

    if (this.assets.has("cards")) {
      const sx = card.sheetCol * CARD_W;
      const sy = card.sheetRow * CARD_H;
      ctx.drawImage(this.assets.get("cards"), sx, sy, CARD_W, CARD_H, x, y, CARD_W, CARD_H);
    } else {
      // Fallback dibujado en código
      const isRed = card.suit === "♥" || card.suit === "♦";
      ctx.fillStyle = C.cardBg;
      ctx.fillRect(x, y, CARD_W, CARD_H);
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, CARD_W, CARD_H);
      ctx.fillStyle = isRed ? C.cardRed : C.cardBlk;
      ctx.font = "5px monospace";
      ctx.textAlign = "left";
      ctx.fillText(card.value, x + 2, y + 7);
      ctx.fillText(card.suit,  x + 2, y + 14);
    }
  }

  _drawDealerHand(hand, state) {
    hand.cards.forEach((card, i) => {
      this._drawCard(card, LAYOUT.dealer.x + i * (CARD_W + 3), LAYOUT.dealer.y);
    });
  }

  _drawPlayerHands(hands, activeIdx) {
    // Distribuir múltiples manos horizontalmente
    const total  = hands.length;
    const startX = total === 1 ? LAYOUT.player.x : 40;
    const gapX   = total === 1 ? 0 : Math.floor((this.W - 80) / total);

    hands.forEach((hand, hi) => {
      const baseX = startX + hi * gapX;
      // Resaltar mano activa con un marco
      if (total > 1 && hi === activeIdx) {
        this.ctx.strokeStyle = C.yellow;
        this.ctx.lineWidth   = 1;
        this.ctx.strokeRect(baseX - 2, LAYOUT.player.y - 2,
          hand.cards.length * (CARD_W + 3) + 1, CARD_H + 4);
      }
      hand.cards.forEach((card, ci) => {
        this._drawCard(card, baseX + ci * (CARD_W + 3), LAYOUT.player.y);
      });
    });
  }

  // ── Puntajes ────────────────────────────────────────────
  _drawScores(state, playerHands, activeIdx, dealerHand) {
    const ctx = this.ctx;
    ctx.font      = "7px monospace";
    ctx.textAlign = "left";

    // Dealer
    const dScore = dealerHand.getScore();
    if (dealerHand.cards.length > 0) {
      ctx.fillStyle = C.muted;
      ctx.fillText("DEALER", LAYOUT.score.dealer.x, LAYOUT.score.dealer.y);
      if (state.is(STATES.PLAYER_TURN) || state.is(STATES.BETTING) || state.is(STATES.DEALING)) {
        // Solo mostrar la carta visible
        const visible = dealerHand.cards.find(c => c.faceUp);
        if (visible) ctx.fillText(`${visible.getPoints()}+?`, LAYOUT.score.dealer.x + 36, LAYOUT.score.dealer.y);
      } else {
        ctx.fillStyle = dealerHand.isBust ? C.red : C.text;
        ctx.fillText(`${dScore}${dealerHand.isBust ? " BUST" : ""}`,
          LAYOUT.score.dealer.x + 36, LAYOUT.score.dealer.y);
      }
    }

    // Player
    if (playerHands[0].cards.length > 0) {
      ctx.fillStyle = C.muted;
      ctx.fillText("TÚ", LAYOUT.score.player.x, LAYOUT.score.player.y);
      playerHands.forEach((hand, i) => {
        const s = hand.getScore();
        ctx.fillStyle = hand.isBust ? C.red : (i === activeIdx ? C.yellow : C.text);
        ctx.fillText(`${s}${hand.isBust ? " BUST" : ""}${hand.isBlackjack ? " BJ!" : ""}`,
          LAYOUT.score.player.x + 18 + i * 40, LAYOUT.score.player.y);
      });
    }
  }

  // ── Apuesta e info ──────────────────────────────────────
  _drawBettingInfo(betting) {
    const ctx = this.ctx;
    ctx.font      = "7px monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = C.text;
    ctx.fillText(`$${betting.balance}`, this.W - 8, 12);
    ctx.fillStyle = C.yellow;
    if (betting.currentBet > 0)
      ctx.fillText(`BET $${betting.currentBet}`, this.W - 8, 22);
    ctx.textAlign = "left";
  }

  // ── Fichas ──────────────────────────────────────────────
  _drawChips(betting, state) {
    if (!state.is(STATES.BETTING)) return;
    const ctx = this.ctx;

    CHIPS.forEach((chip, i) => {
      const x = CHIP_XS[i];
      const y = LAYOUT.chips.y;
      const canAfford = betting.canBet(chip.value);

      if (this.assets.has("chips")) {
        ctx.globalAlpha = canAfford ? 1 : 0.35;
        ctx.drawImage(this.assets.get("chips"),
          chip.col * CHIP_W, 0, CHIP_W, CHIP_H,
          x, y, CHIP_W, CHIP_H);
        ctx.globalAlpha = 1;
      } else {
        // Fallback
        ctx.globalAlpha = canAfford ? 1 : 0.35;
        ctx.fillStyle   = C.chip[i];
        ctx.beginPath();
        ctx.arc(x + CHIP_W/2, y + CHIP_H/2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font      = "5px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`$${chip.value}`, x + CHIP_W/2, y + CHIP_H/2 + 2);
        ctx.textAlign = "left";
        ctx.globalAlpha = 1;
      }
    });
  }

  // ── Botones ─────────────────────────────────────────────
  _drawButtons(state, playerHands, activeIdx, betting) {
    const hand = playerHands[activeIdx];

    // Definir qué botones van activos según estado
    let buttons = [];
    if (state.is(STATES.PLAYER_TURN)) {
      buttons = [
        { idx: 0, label: "HIT",    active: true },
        { idx: 1, label: "STAND",  active: true },
        { idx: 2, label: "DOUBLE", active: hand.canDouble && betting.canBet(hand.bet) },
        { idx: 3, label: "SPLIT",  active: hand.canSplit  && betting.canBet(hand.bet) },
      ];
    }

    // Guardar para que Input pueda detectar clicks
    this.activeButtons = buttons;

    const ctx = this.ctx;
    buttons.forEach(btn => {
      const x = BTN_XS[btn.idx];
      const y = LAYOUT.btns.y;

      if (this.assets.has("buttons")) {
        const row = btn.active ? 0 : 1; // fila 0 normal, fila 1 inactivo/presionado
        ctx.globalAlpha = btn.active ? 1 : 0.4;
        ctx.drawImage(this.assets.get("buttons"),
          btn.idx * BTN_W, row * BTN_H, BTN_W, BTN_H,
          x, y, BTN_W, BTN_H);
        ctx.globalAlpha = 1;
      } else {
        // Fallback
        ctx.fillStyle   = btn.active ? C.btn : "#1a2a1a";
        ctx.globalAlpha = btn.active ? 1 : 0.4;
        ctx.fillRect(x, y, BTN_W, BTN_H);
        ctx.strokeStyle = btn.active ? C.muted : "#2a3a2a";
        ctx.lineWidth   = 0.5;
        ctx.strokeRect(x, y, BTN_W, BTN_H);
        ctx.fillStyle   = C.text;
        ctx.font        = "6px monospace";
        ctx.textAlign   = "center";
        ctx.fillText(btn.label, x + BTN_W/2, y + BTN_H/2 + 2);
        ctx.textAlign   = "left";
        ctx.globalAlpha = 1;
      }
    });
  }

  // ── Resultado ───────────────────────────────────────────
  _drawResult(results) {
    // results es un array (una por mano en caso de split)
    const ctx  = this.ctx;
    const msgs = {
      blackjack: { text: "BLACKJACK!", color: C.yellow },
      win:       { text: "GANASTE",    color: C.yellow },
      lose:      { text: "PERDISTE",   color: C.red    },
      bust:      { text: "BUST",       color: C.red    },
      push:      { text: "EMPATE",     color: C.blue   },
    };

    results.forEach((r, i) => {
      const m = msgs[r] || msgs.push;
      ctx.fillStyle = m.color;
      ctx.font      = "14px monospace";
      ctx.textAlign = "center";
      const offsetX = results.length > 1 ? (i - 0.5) * 80 : 0;
      ctx.fillText(m.text, this.W / 2 + offsetX, this.H / 2 - 10);
    });

    ctx.font      = "6px monospace";
    ctx.fillStyle = C.muted;
    ctx.fillText("click para continuar", this.W / 2, this.H / 2 + 8);
    ctx.textAlign = "left";
  }

  // ── Hint apuesta ────────────────────────────────────────
  _drawBettingHint(betting) {
    const ctx = this.ctx;
    ctx.font      = "6px monospace";
    ctx.fillStyle = C.muted;
    ctx.textAlign = "center";
    if (!betting.hasBet) {
      ctx.fillText("pon fichas para apostar", this.W / 2, LAYOUT.chips.y - 4);
    } else {
      ctx.fillText("click en la mesa para repartir", this.W / 2, LAYOUT.chips.y - 4);
    }
    ctx.textAlign = "left";
  }

  // ── Hit test botones (usado por Input) ─────────────────
  getButtonAt(x, y) {
    for (const btn of this.activeButtons) {
      if (!btn.active) continue;
      const bx = BTN_XS[btn.idx];
      const by = LAYOUT.btns.y;
      if (x >= bx && x <= bx + BTN_W && y >= by && y <= by + BTN_H) {
        return btn.label;
      }
    }
    return null;
  }

  getChipAt(x, y) {
    for (let i = 0; i < CHIP_XS.length; i++) {
      const cx = CHIP_XS[i];
      const cy = LAYOUT.chips.y;
      if (x >= cx && x <= cx + CHIP_W && y >= cy && y <= cy + CHIP_H) {
        return i; // índice de la ficha
      }
    }
    return -1;
  }
}
