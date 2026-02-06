const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = 800;
const H = 450;

const CELL = 25;
const COLS = W / CELL;
const ROWS = H / CELL;

let STEP_MS = 120;

let snake, dir, nextDir, food, score, gameOver, paused;
let lastTime = 0;
let acc = 0;

const hudScore = document.getElementById("hud-score");
const hudSpeed = document.getElementById("hud-speed");
const hudStatus = document.getElementById("hud-status");

const sheet = new Image();
sheet.src = "assets/img/snake_sheet.png";
let sheetReady = false;
sheet.onload = () => (sheetReady = true);

const foodImg = new Image();
foodImg.src = "assets/img/food.png";
let foodReady = false;
foodImg.onload = () => (foodReady = true);


const TILE = 42;
const HEAD_OFFSET = -Math.PI / 2;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function samePos(a, b) {
  return a.x === b.x && a.y === b.y;
}

function spawnFood() {
  let f;
  while (true) {
    f = { x: randInt(0, COLS), y: randInt(0, ROWS) };
    if (!snake.some(s => samePos(s, f))) return f;
  }
}

function refreshHUD() {
  if (!hudScore || !hudSpeed || !hudStatus) return;
  hudScore.textContent = score;
  hudSpeed.textContent = `${Math.round(1000 / STEP_MS)} mov/s`;
  hudStatus.textContent = gameOver ? "GAME OVER" : (paused ? "PAUSA" : "JUGANDO");
}

function resetGame() {
  score = 0;
  gameOver = false;
  paused = false;

  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);

  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY }
  ];

  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };

  food = spawnFood();

  lastTime = performance.now();
  acc = 0;
  refreshHUD();
}

function isOpposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  let nd = null;

  if (k === "arrowup" || k === "w") nd = { x: 0, y: -1 };
  if (k === "arrowdown" || k === "s") nd = { x: 0, y: 1 };
  if (k === "arrowleft" || k === "a") nd = { x: -1, y: 0 };
  if (k === "arrowright" || k === "d") nd = { x: 1, y: 0 };

  if (nd && !isOpposite(nd, dir)) nextDir = nd;

  if (k === "p") paused = !paused;
  if (k === "r") resetGame();

  if (k === "+" || k === "=") STEP_MS = Math.max(60, STEP_MS - 10);
  if (k === "-" || k === "_") STEP_MS = Math.min(250, STEP_MS + 10);

  refreshHUD();
});

function updateStep() {
  if (gameOver || paused) return;

  dir = nextDir;

  const head = snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
    gameOver = true;
    refreshHUD();
    return;
  }

  for (let i = 0; i < snake.length; i++) {
    if (samePos(snake[i], newHead)) {
      gameOver = true;
      refreshHUD();
      return;
    }
  }

  snake.unshift(newHead);

  if (samePos(newHead, food)) {
    score++;
    food = spawnFood();
    refreshHUD();
  } else {
    snake.pop();
  }
}

function angleFromDelta(dx, dy) {
  if (dx === 1) return 0;
  if (dx === -1) return Math.PI;
  if (dy === 1) return Math.PI / 2;
  return -Math.PI / 2;
}

function drawTile(tx, ty, gx, gy) {
  const sx = tx * TILE;
  const sy = ty * TILE;
  const dx = gx * CELL;
  const dy = gy * CELL;
  ctx.drawImage(sheet, sx, sy, TILE, TILE, dx, dy, CELL, CELL);
}

function drawTileRotated(tx, ty, gx, gy, angle) {
  const sx = tx * TILE;
  const sy = ty * TILE;
  const cx = gx * CELL + CELL / 2;
  const cy = gy * CELL + CELL / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.drawImage(sheet, sx, sy, TILE, TILE, -CELL / 2, -CELL / 2, CELL, CELL);
  ctx.restore();
}

function drawSegment(i) {
  const s = snake[i];
  const prev = snake[i - 1];
  const next = snake[i + 1];

  const d1 = { x: prev.x - s.x, y: prev.y - s.y };
  const d2 = { x: next.x - s.x, y: next.y - s.y };

  if (d1.y === 0 && d2.y === 0) {
    drawTileRotated(2, 2, s.x, s.y, Math.PI / 2);
    return;
  }

  if (d1.x === 0 && d2.x === 0) {
    drawTile(1, 2, s.x, s.y);
    return;
  }

  const up = (d1.y === -1) || (d2.y === -1);
  const down = (d1.y === 1) || (d2.y === 1);
  const left = (d1.x === -1) || (d2.x === -1);
  const right = (d1.x === 1) || (d2.x === 1);

  if (up && right) drawTile(1, 1, s.x, s.y);
  else if (up && left) drawTile(2, 1, s.x, s.y);
  else if (down && right) drawTile(1, 0, s.x, s.y);
  else if (down && left) drawTile(2, 0, s.x, s.y);
  else drawTile(1, 2, s.x, s.y);
}

function drawTail() {
  const t = snake[snake.length - 1];
  const before = snake[snake.length - 2];
  const dy = before.y - t.y;

  if (dy === 0) drawTileRotated(2, 2, t.x, t.y, Math.PI / 2);
  else drawTile(1, 2, t.x, t.y);
}

function drawFallbackSnake() {
  for (let i = 0; i < snake.length; i++) {
    const s = snake[i];
    ctx.fillStyle = i === 0 ? "#22c55e" : "#16a34a";
    ctx.fillRect(s.x * CELL, s.y * CELL, CELL, CELL);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= W; x += CELL) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  for (let y = 0; y <= H; y += CELL) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  if (foodReady) {
  ctx.drawImage(foodImg, food.x * CELL, food.y * CELL, CELL, CELL);
} else {
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(food.x * CELL, food.y * CELL, CELL, CELL);
}


  if (sheetReady) {
    const h = snake[0];
    drawTileRotated(0, 0, h.x, h.y, angleFromDelta(dir.x, dir.y) + HEAD_OFFSET);

    if (snake.length > 2) {
      for (let i = 1; i < snake.length - 1; i++) drawSegment(i);
    }

    if (snake.length > 1) drawTail();
  } else {
    drawFallbackSnake();
  }

  if (paused) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.font = "44px system-ui";
    ctx.fillText("PAUSA", W / 2 - 70, H / 2);
  }

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.font = "46px system-ui";
    ctx.fillText("GAME OVER", W / 2 - 150, H / 2 - 10);
    ctx.font = "20px system-ui";
    ctx.fillText(`Puntaje final: ${score}`, W / 2 - 70, H / 2 + 25);
    ctx.fillText("Presiona R para reiniciar", W / 2 - 110, H / 2 + 55);
  }
}

function loop(t) {
  const dt = t - lastTime;
  lastTime = t;

  acc += dt;

  while (acc >= STEP_MS) {
    updateStep();
    acc -= STEP_MS;
  }

  draw();
  requestAnimationFrame(loop);
}

resetGame();
requestAnimationFrame(loop);
