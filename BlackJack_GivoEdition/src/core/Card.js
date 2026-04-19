// Palos en el mismo orden que el spritesheet: ♠ ♥ ♦ ♣
export const SUITS  = ["♠", "♥", "♦", "♣"];
// Valores en el mismo orden que el spritesheet: A 2 3 4 5 6 7 8 9 10 J Q K
export const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

export default class Card {
  constructor(suit, value) {
    this.suit   = suit;   // "♠" | "♥" | "♦" | "♣"
    this.value  = value;  // "A" | "2"..."10" | "J" | "Q" | "K"
    this.faceUp = true;

    // Coordenadas en el spritesheet (calculadas una vez)
    this.sheetCol = VALUES.indexOf(value); // 0-12
    this.sheetRow = SUITS.indexOf(suit);   // 0-3
  }

  getPoints() {
    if (this.value === "A") return 11;
    if (["J","Q","K"].includes(this.value)) return 10;
    return parseInt(this.value);
  }

  toString() {
    return `${this.value}${this.suit}`;
  }
}
