import GameState, { STATES } from "./systems/GameState.js";
import BettingSystem, { CHIPS } from "./systems/BettingSystem.js";
import AssetLoader              from "./systems/AssetLoader.js";
import Renderer                 from "./Renderer.js";
import Input                    from "./Input.js";
import Deck                     from "./core/Deck.js";
import Hand                     from "./core/Hand.js";

// Exponer STATES globalmente para Input (evitar importación circular)
window._STATES = { STATES };

export default class Game {
  constructor(canvas, ctx) {
    this.canvas  = canvas;
    this.ctx     = ctx;
    this.state   = new GameState();
    this.betting = new BettingSystem(1000);
    this.assets  = new AssetLoader();
    this.deck    = new Deck();

    // Manos del jugador (array — puede haber más de una tras split)
    this.playerHands   = [new Hand()];
    this.activeHandIdx = 0; // cuál mano está jugando ahora
    this.dealerHand    = new Hand();

    this.result        = null; // array de resultados ["win","lose",...] uno por mano

    // Renderer e Input se inicializan tras cargar assets
    this.renderer = null;
    this.input    = null;

    this._init();
  }

  async _init() {
    await this.assets.loadAll();
    this.renderer = new Renderer(this.ctx, this.assets);
    this.input    = new Input(this.canvas, this, this.renderer);
    console.log("🃏 Blackjack: Givo Edition — listo");
  }

  // ── Loop ────────────────────────────────────────────────
  update(dt) {
    if (this.state.is(STATES.DEALER_TURN)) this._dealerPlay();
  }

  render() {
    if (!this.renderer) return; // todavía cargando
    this.renderer.render(
      this.state,
      this.playerHands,
      this.activeHandIdx,
      this.dealerHand,
      this.betting,
      this.result
    );
  }

  // ── Apuesta ─────────────────────────────────────────────
  placeChip(chipIdx) {
    if (!this.state.is(STATES.BETTING)) return;
    const chip = CHIPS[chipIdx];
    if (!chip) return;
    this.betting.addChip(chip.value);
  }

  // ── Deal ────────────────────────────────────────────────
  deal() {
    if (!this.state.is(STATES.BETTING) || !this.betting.hasBet) return;

    // Limpiar
    this.playerHands   = [new Hand()];
    this.activeHandIdx = 0;
    this.dealerHand    = new Hand();
    this.result        = null;

    // Guardar la apuesta en la mano
    this.playerHands[0].bet = this.betting.currentBet;

    this.state.set(STATES.DEALING);

    // Repartir: player, dealer, player, dealer
    this.playerHands[0].addCard(this.deck.draw());
    this.dealerHand.addCard(this.deck.draw());
    this.playerHands[0].addCard(this.deck.draw());

    const hole = this.deck.draw();
    hole.faceUp = false;
    this.dealerHand.addCard(hole);

    this._log(`Player: ${this._handStr(this.playerHands[0])} (${this.playerHands[0].getScore()})`);
    this._log(`Dealer: ${this.dealerHand.cards[0]} + [?]`);

    // Blackjack inmediato
    if (this.playerHands[0].isBlackjack) {
      this._revealDealer();
      this._endRound(["blackjack"]);
      return;
    }

    this.state.set(STATES.PLAYER_TURN);
  }

  // ── Acciones del jugador ────────────────────────────────
  hit() {
    if (!this.state.is(STATES.PLAYER_TURN)) return;
    const hand = this._activeHand();
    hand.addCard(this.deck.draw());
    this._log(`HIT → ${this._handStr(hand)} (${hand.getScore()})`);

    if (hand.isBust) {
      this._log(`BUST en mano ${this.activeHandIdx}`);
      this._nextHandOrDealer();
    }
  }

  stand() {
    if (!this.state.is(STATES.PLAYER_TURN)) return;
    this._log(`STAND en mano ${this.activeHandIdx}`);
    this._nextHandOrDealer();
  }

  double() {
    if (!this.state.is(STATES.PLAYER_TURN)) return;
    const hand = this._activeHand();
    if (!hand.canDouble || !this.betting.canBet(hand.bet)) return;

    // Doblar la apuesta de esta mano
    this.betting.balance -= hand.bet;
    hand.bet *= 2;
    this.betting.currentBet += hand.bet / 2; // reflejar en el bet total

    hand.addCard(this.deck.draw());
    this._log(`DOUBLE → ${this._handStr(hand)} (${hand.getScore()})`);
    this._nextHandOrDealer();
  }

  split() {
    if (!this.state.is(STATES.PLAYER_TURN)) return;
    const hand = this._activeHand();
    if (!hand.canSplit || !this.betting.canBet(hand.bet)) return;

    // Descontar la apuesta de la segunda mano del balance
    this.betting.balance    -= hand.bet;
    this.betting.currentBet += hand.bet;

    // Crear segunda mano con la segunda carta
    const newHand  = new Hand();
    newHand.bet    = hand.bet;
    newHand.addCard(hand.cards.pop()); // mover segunda carta

    // Repartir una carta a cada mano
    hand.addCard(this.deck.draw());
    newHand.addCard(this.deck.draw());

    // Insertar la nueva mano después de la activa
    this.playerHands.splice(this.activeHandIdx + 1, 0, newHand);

    this._log(`SPLIT → mano A: ${this._handStr(hand)} | mano B: ${this._handStr(newHand)}`);
  }

  // ── Dealer ──────────────────────────────────────────────
  _dealerPlay() {
    this._revealDealer();

    // Dealer saca hasta 17+
    while (this.dealerHand.getScore() < 17) {
      this.dealerHand.addCard(this.deck.draw());
    }

    const ds = this.dealerHand.getScore();
    this._log(`Dealer se planta en ${ds}`);

    // Calcular resultado por mano
    const results = this.playerHands.map(hand => {
      const ps = hand.getScore();
      if (hand.isBust)       return "bust";
      if (ds > 21)           return "win";
      if (ps > ds)           return "win";
      if (ps < ds)           return "lose";
      return "push";
    });

    this._endRound(results);
  }

  _revealDealer() {
    for (const card of this.dealerHand.cards) card.faceUp = true;
  }

  // ── Flujo entre manos ───────────────────────────────────
  _nextHandOrDealer() {
    if (this.activeHandIdx < this.playerHands.length - 1) {
      // Quedan más manos (split)
      this.activeHandIdx++;
      this._log(`Pasando a mano ${this.activeHandIdx}`);
    } else {
      // Todas las manos jugadas → turno del dealer
      this.state.set(STATES.DEALER_TURN);
    }
  }

  // ── Resultado ───────────────────────────────────────────
  _endRound(results) {
    this.result = results;
    this.state.set(STATES.RESULT);

    // Aplicar pagos
    results.forEach((r, i) => {
      const bet = this.playerHands[i].bet;
      const labels = { win: `WIN +$${bet*2}`, blackjack: `BLACKJACK +$${Math.floor(bet*2.5)}`,
                       push: `PUSH devuelve $${bet}`, lose: `LOSE -$${bet}`, bust: `BUST -$${bet}` };
      this._log(labels[r] || r);

      if (r === "blackjack") this.betting.win(2.5);
      else if (r === "win")  this.betting.win(2);
      else if (r === "push") this.betting.push();
      else                   this.betting.lose();
    });

    this._log(`Balance: $${this.betting.balance}`);
  }

  newRound() {
    if (!this.state.is(STATES.RESULT)) return;
    if (this.betting.broke) {
      this.betting.balance = 1000; // reiniciar si se quedó sin dinero
      this._log("Sin fondos — reiniciando balance a $1000");
    }
    this.state.set(STATES.BETTING);
  }

  // ── Helpers ─────────────────────────────────────────────
  _activeHand()      { return this.playerHands[this.activeHandIdx]; }
  _handStr(hand)     { return hand.cards.map(c => c.toString()).join(" "); }
  _log(msg)          { console.log(`[Game] ${msg}`); }
}
