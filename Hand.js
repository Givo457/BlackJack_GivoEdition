export default class Hand {
  constructor() {
    this.cards = [];
    this.bet   = 0; // cada mano tiene su propia apuesta (necesario para split)
  }

  addCard(card) {
    this.cards.push(card);
  }

  getScore() {
    let total = 0;
    let aces  = 0;

    for (const card of this.cards) {
      if (!card.faceUp) continue;
      const pts = card.getPoints();
      if (pts === 11) aces++;
      total += pts;
    }

    // Ajustar ases: de 11 a 1 si nos pasamos
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  }

  clear() {
    this.cards = [];
    this.bet   = 0;
  }

  get isBust()       { return this.getScore() > 21; }
  get isBlackjack()  { return this.cards.length === 2 && this.getScore() === 21; }
  get isPair()       { return this.cards.length === 2 && this.cards[0].value === this.cards[1].value; }
  get canDouble()    { return this.cards.length === 2; }
  get canSplit()     { return this.isPair; }
  get count()        { return this.cards.length; }
}
