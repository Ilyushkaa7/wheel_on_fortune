import { state, getActiveItems } from '../core/state.js';
import { COLORS, SPEEDS } from '../utils/constants.js';

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const W = 600, H = 600;
const CX = 300, CY = 300, R = 270;

let currentAngle = 0;

export function drawWheel() {
  const items = getActiveItems();
  ctx.clearRect(0, 0, W, H);
  if (!items.length) {
    drawEmpty();
    return;
  }
  const step = (2 * Math.PI) / items.length;
  items.forEach((item, i) => {
    const start = i * step + currentAngle;
    const end = start + step;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, start, end);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const mid = start + step / 2;
    const tx = CX + R * 0.7 * Math.cos(mid);
    const ty = CY + R * 0.7 * Math.sin(mid);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(mid + Math.PI/2);
    ctx.font = 'bold 20px "Segoe UI"';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = item.label || item.id.toString();
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
  drawPointer();
}

function drawPointer() {
  ctx.beginPath();
  ctx.moveTo(CX - 14, CY - R + 5);
  ctx.lineTo(CX + 14, CY - R + 5);
  ctx.lineTo(CX, CY - R + 35);
  ctx.closePath();
  ctx.fillStyle = '#c62828';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawEmpty() {
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, 2*Math.PI);
  ctx.fillStyle = '#e0e0e0';
  ctx.fill();
  ctx.strokeStyle = '#aaa';
  ctx.stroke();
  ctx.fillStyle = '#666';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Нет номеров', CX, CY);
  drawPointer();
}

export function spinToItem(targetItem) {
  return new Promise(resolve => {
    const items = getActiveItems();
    const idx = items.findIndex(i => i.id === targetItem.id);
    if (idx === -1) { resolve(); return; }
    const step = (2 * Math.PI) / items.length;
    const targetMidAbsolute = currentAngle + idx * step + step / 2;
    let delta = (-Math.PI / 2) - targetMidAbsolute;

    const speedCfg = SPEEDS[state.settings.speed] || SPEEDS.normal;
    // случайная добавка от 0 до 2 полных оборотов, чтобы не было однообразия
    const extraTurns = Math.floor(Math.random() * 3);
    const totalRotations = (speedCfg.rotations + extraTurns) * 2 * Math.PI;
    while (delta < 0) delta += 2 * Math.PI;
    delta += totalRotations;

    const startAngle = currentAngle;
    const duration = speedCfg.duration; // всегда 7000
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // easing easeInOutQuad
      const eased = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
      currentAngle = startAngle + delta * eased;
      drawWheel();
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(animate);
  });
}