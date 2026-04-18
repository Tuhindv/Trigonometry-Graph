const canvas = document.getElementById("graph");
const ctx = canvas.getContext("2d");

let currentFunc = "sin";
let zoom = 1;
let offsetX = 0;

let isDragging = false;
let lastX = 0;
let lastDist = null;

// 🔥 resize canvas (full screen support)
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  drawFromInput();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// 🔥 dynamic Y scale (clear graph)
function getScaleY() {
  return canvas.height / 6;
}

// X scale
function scaleX() {
  return (canvas.width / (4 * Math.PI)) * zoom;
}

// trig functions
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

// 🔥 GRID
function drawGrid() {
  ctx.beginPath();
  ctx.strokeStyle = "#eee";

  let step = 40;
  let startX = offsetX % step;

  for (let x = startX; x < canvas.width; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }

  for (let y = 0; y < canvas.height; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }

  ctx.stroke();
}

// 🔥 AXES
function drawAxes() {
  ctx.beginPath();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;

  let centerX = canvas.width / 2 + offsetX;

  // X axis
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);

  // Y axis (moves with pan)
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, canvas.height);

  ctx.stroke();
  ctx.lineWidth = 1;
}

// 🔥 π LABELS
function drawXAxisLabels() {
  ctx.fillStyle = "black";
  ctx.font = "bold 13px Arial";

  let sX = scaleX();
  let centerX = canvas.width / 2 + offsetX;

  let left = (0 - centerX) / sX;
  let right = (canvas.width - centerX) / sX;

  let step = Math.PI / 2;
  let start = Math.floor(left / step) * step;

  for (let x = start; x <= right; x += step) {
    let px = centerX + x * sX;

    let k = Math.round(x / (Math.PI / 2));
    let label = "";

    if (k === 0) label = "0";
    else if (k % 2 === 0) {
      let n = k / 2;
      label = `${n === 1 ? "" : n === -1 ? "-" : n}π`;
    } else {
      label = `${k}π/2`;
    }

    ctx.fillText(label, px - 15, canvas.height / 2 + 20);
  }
}

// 🔥 Y LABELS
function drawYAxisLabels() {
  ctx.fillStyle = "black";
  ctx.font = "bold 13px Arial";

  let scaleY = getScaleY();
  let centerY = canvas.height / 2;
  let centerX = canvas.width / 2 + offsetX;

  for (let y = -3; y <= 3; y++) {
    let py = centerY - y * scaleY;

    ctx.fillText(y, centerX + 10, py + 4);
  }
}

// 🔥 GRAPH DRAW
function drawGraph(fn) {
  let sX = scaleX();
  let centerX = canvas.width / 2 + offsetX;

  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#2563eb";

  let first = true;

  for (let px = 0; px < canvas.width; px++) {
    let x = (px - centerX) / sX;
    let y = getValue(fn, x);

    if (!isFinite(y) || Math.abs(y) > 10) {
      first = true;
      continue;
    }

    let py = canvas.height / 2 - y * getScaleY();

    if (first) {
      ctx.moveTo(px, py);
      first = false;
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
}

// 🔴 POINT DISPLAY
function drawPoint(fn, deg) {
  let sX = scaleX();
  let centerX = canvas.width / 2 + offsetX;

  let rad = deg * Math.PI / 180;
  let x = centerX + rad * sX;
  let y = getValue(fn, rad);

  if (!isFinite(y)) return;

  let py = canvas.height / 2 - y * getScaleY();

  ctx.beginPath();
  ctx.fillStyle = "red";
  ctx.arc(x, py, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "black";
  ctx.font = "bold 13px Arial";
  ctx.fillText(`${fn}(${deg}°) = ${y.toFixed(2)}`, x + 10, py - 10);
}

// 🔥 MAIN DRAW
function drawFromInput() {
  let expr = document.getElementById("expr").value.toLowerCase().trim();

  let fnMatch = expr.match(/(sin|cos|tan|cosec|sec|cot)/);
  let numMatch = expr.match(/-?\d+(\.\d+)?/);

  if (!fnMatch) return;

  currentFunc = fnMatch[1];
  let deg = numMatch ? parseFloat(numMatch[0]) : NaN;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawAxes();
  drawXAxisLabels();
  drawYAxisLabels();
  drawGraph(currentFunc);

  if (!isNaN(deg)) drawPoint(currentFunc, deg);
}

// =======================
// 🖱️ DESKTOP SUPPORT
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
// 📱 MOBILE SUPPORT
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

  // drag
  if (e.touches.length === 1 && isDragging) {
    let x = e.touches[0].clientX;
    offsetX += x - lastX;
    lastX = x;
    drawFromInput();
  }

  // pinch zoom
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