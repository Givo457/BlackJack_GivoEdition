// Carga todos los assets y los mantiene listos para el renderer
export default class AssetLoader {
  constructor() {
    this.images = {};
    this.loaded  = false;
  }

  async loadAll() {
    const toLoad = {
      cards:    "assets/sprites/cards.png",
      cardBack: "assets/sprites/card_back.png",
      chips:    "assets/sprites/chips.png",
      buttons:  "assets/sprites/buttons.png",
      // Opcionales — no rompen si no existen aún
      ui:       "assets/sprites/ui.png",
      table:    "assets/backgrounds/table.png",
    };

    const promises = Object.entries(toLoad).map(([key, src]) =>
      this._load(key, src)
    );

    await Promise.allSettled(promises); // allSettled = no falla si uno no existe
    this.loaded = true;
    console.log("[Assets] Cargados:", Object.keys(this.images));
  }

  _load(key, src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload  = () => { this.images[key] = img; resolve(); };
      img.onerror = () => {
        console.warn(`[Assets] No encontrado: ${src} (se usará fallback)`);
        resolve(); // no bloquear el juego
      };
      img.src = src;
    });
  }

  get(key) { return this.images[key] || null; }
  has(key) { return !!this.images[key]; }
}
