import Card, { SUITS, VALUES } from "./Card.js";

export default class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const suit of SUITS)
      for (const value of VALUES)
        this.cards.push(new Card(suit, value));
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    // Regenerar si quedan pocas cartas (menos de 15)
    if (this.cards.length < 15) {
      console.log("[Deck] Mazo bajo — regenerando...");
      this.reset();
    }
    return this.cards.pop();
  }

  get remaining() { return this.cards.length; }
}
