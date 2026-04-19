export const CHIPS = [
  { value: 10,  col: 0 },
  { value: 25,  col: 1 },
  { value: 50,  col: 2 },
  { value: 100, col: 3 },
  { value: 500, col: 4 },
];

export default class BettingSystem {
  constructor(startBalance = 1000) {
    this.balance    = startBalance;
    this.currentBet = 0;
  }

  addChip(amount) {
    if (!this.canBet(amount)) return false;
    this.currentBet += amount;
    this.balance    -= amount;
    console.log(`[BET] +$${amount} → apuesta: $${this.currentBet} | balance: $${this.balance}`);
    return true;
  }

  // Resultado de la ronda
  win(multiplier = 2) {
    const ganancia = this.currentBet * multiplier;
    this.balance += ganancia;
    console.log(`[BET] WIN x${multiplier} → +$${ganancia} | balance: $${this.balance}`);
    this.currentBet = 0;
  }

  lose() {
    console.log(`[BET] LOSE → -$${this.currentBet} | balance: $${this.balance}`);
    this.currentBet = 0;
  }

  push() {
    this.balance   += this.currentBet;
    console.log(`[BET] PUSH → devuelve $${this.currentBet} | balance: $${this.balance}`);
    this.currentBet = 0;
  }

  canBet(amount) { return this.balance >= amount && amount > 0; }
  get hasBet()   { return this.currentBet > 0; }
  get broke()    { return this.balance <= 0 && this.currentBet === 0; }
}
