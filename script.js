const canvas = document.getElementById("graph");
const ctx = canvas.getContext("2d");

let currentFunc = "sin";
let zoom = 1;
let offsetX = 0;

let isDragging = false;
let lastX = 0;
let lastDist = null;

// =======================
// 📱 MOBILE + SHARP CANVAS FIX (IMPORTANT)
// =======================
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;

  canvas.style.width = canvas.clientWidth + "px";
  canvas.style.height = canvas.clientHeight + "px";

  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
  ctx.scale(dpr, dpr);

  drawFromInput();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// =======================
// 📊 SCALE
// =======================
function getScaleY() {
  return canvas.height / (6 * (window.devicePixelRatio || 1));
}

function scaleX() {
  return (canvas.width / (4 * Math.PI)) * zoom / (window.devicePixelRatio || 1);
}

// =======================
// 🔢 TRIG FUNCTIONS
// =======================
function getValue(fn, x) {
  switch (fn) {
    case "sin": return Math.sin(x);
    case "cos": return Math.cos(x);
    case "tan": return Math.tan(x);
    case "cosec": return 1 / Math.sin(x);
    case "sec": return 1 / Math.cos(x);
    case "cot": return 1 / Math.tan(x);
  }
}

// =======================
// 🔥 GRID (LIGHT CLEAR)
// =======================
function drawGrid() {
  ctx.beginPath();
  ctx.strokeStyle = "#f1f5f9";
  ctx.lineWidth = 1;

  let step = 40;
  let startX = offsetX % step;

  for (let x = startX; x < canvas.clientWidth; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.clientHeight);
  }

  for (let y = 0; y < canvas.clientHeight; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.clientWidth, y);
  }

  ctx.stroke();
}

// =======================
// 🔥 AXIS (CLEAR)
// =======================
function drawAxes() {
  ctx.beginPath();
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.5;

  let centerX = canvas.clientWidth / 2 + offsetX;

  // X axis
  ctx.moveTo(0, canvas.clientHeight / 2);
  ctx.lineTo(canvas.clientWidth, canvas.clientHeight / 2);

  // Y axis
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, canvas.clientHeight);

  ctx.stroke();
}

// =======================
// 📊 GRAPH
// =======================
function drawGraph(fn) {
  let sX = scaleX();
  let centerX = canvas.clientWidth / 2 + offsetX;

  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#2563eb";

  ctx.shadowColor = "rgba(37,99,235,0.25)";
  ctx.shadowBlur = 2;

  let first = true;

  for (let px = 0; px < canvas.clientWidth; px++) {
    let x = (px - centerX) / sX;
    let y = getValue(fn, x);

    if (!isFinite(y) || Math.abs(y) > 10) {
      first = true;
      continue;
    }

    let py = canvas.clientHeight / 2 - y * getScaleY();

    if (first) {
      ctx.moveTo(px, py);
      first = false;
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
  ctx.shadowBlur = 0;
}

// =======================
// 🔴 POINT (FIXED VISIBILITY)
// =======================
function drawPoint(fn, deg) {
  let sX = scaleX();
  let centerX = canvas.clientWidth / 2 + offsetX;

  let rad = deg * Math.PI / 180;
  let x = centerX + rad * sX;
  let y = getValue(fn, rad);

  if (!isFinite(y)) return;

  let py = canvas.clientHeight / 2 - y * getScaleY();

  ctx.beginPath();
  ctx.fillStyle = "#ef4444";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;

  ctx.arc(x, py, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "black";
  ctx.font = "bold 13px Arial";
  ctx.fillText(`${fn}(${deg}°) = ${y.toFixed(2)}`, x + 10, py - 10);
}

// =======================
// 🧠 MAIN DRAW
// =======================
function drawFromInput() {
  let expr = document.getElementById("expr").value.toLowerCase().trim();

  let fnMatch = expr.match(/(sin|cos|tan|cosec|sec|cot)/);
  let numMatch = expr.match(/-?\d+(\.\d+)?/);

  if (!fnMatch) return;

  currentFunc = fnMatch[1];
  let deg = numMatch ? parseFloat(numMatch[0]) : NaN;

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  drawGrid();
  drawAxes();
  drawGraph(currentFunc);

  if (!isNaN(deg)) drawPoint(currentFunc, deg);
}

// =======================
// 🖱️ DESKTOP
// =======================
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  zoom *= e.deltaY < 0 ? 1.1 : 0.9;
  drawFromInput();
});

canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  lastX = e.clientX;
});

canvas.addEventListener("mouseup", () => isDragging = false);

canvas.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  offsetX += e.clientX - lastX;
  lastX = e.clientX;

  drawFromInput();
});

// =======================
// 📱 MOBILE
// =======================
canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    lastX = e.touches[0].clientX;
  }

  if (e.touches.length === 2) {
    lastDist = getDistance(e.touches);
  }
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();

  if (e.touches.length === 1 && isDragging) {
    let x = e.touches[0].clientX;
    offsetX += x - lastX;
    lastX = x;
    drawFromInput();
  }

  if (e.touches.length === 2) {
    let dist = getDistance(e.touches);

    if (lastDist) {
      zoom *= dist > lastDist ? 1.02 : 0.98;
    }

    lastDist = dist;
    drawFromInput();
  }
});

canvas.addEventListener("touchend", () => {
  isDragging = false;
  lastDist = null;
});

// helper
function getDistance(touches) {
  let dx = touches[0].clientX - touches[1].clientX;
  let dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}