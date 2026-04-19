import Game from "./src/Game.js";

const canvas = document.getElementById("game");
const ctx    = canvas.getContext("2d");

// Resolución interna — NO cambiar, todo el juego está diseñado para esto
const GAME_W = 480;
const GAME_H = 270;

canvas.width  = GAME_W;
canvas.height = GAME_H;

// Escalar al viewport manteniendo aspect ratio
function resize() {
  const scale = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
  canvas.style.width  = `${GAME_W * scale}px`;
  canvas.style.height = `${GAME_H * scale}px`;
}
window.addEventListener("resize", resize);
resize();

// Iniciar juego
const game = new Game(canvas, ctx);

// Exponer a consola para debug
window.game = game;

// Game loop
let lastTime = 0;
function loop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.1); // cap a 100ms
  lastTime = ts;
  ctx.clearRect(0, 0, GAME_W, GAME_H);
  game.update(dt);
  game.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
