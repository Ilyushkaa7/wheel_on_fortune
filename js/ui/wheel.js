import { state, getActiveItems } from '../core/state.js';
import { COLORS, SPEEDS } from '../utils/constants.js';

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const CX = 250, CY = 250, R = 220;

let currentAngle = 0;

export function drawWheel() {
  const items = getActiveItems();
  ctx.clearRect(0, 0, 500, 500);
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
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const mid = start + step / 2;
    const tx = CX + R * 0.7 * Math.cos(mid);
    const ty = CY + R * 0.7 * Math.sin(mid);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(mid + Math.PI/2);
    ctx.font = 'bold 18px "Segoe UI"';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.id.toString(), 0, 0);
    ctx.restore();
  });
  drawPointer();
}

function drawPointer() {
  ctx.beginPath();
  ctx.moveTo(CX - 12, CY - R + 5);
  ctx.lineTo(CX + 12, CY - R + 5);
  ctx.lineTo(CX, CY - R + 30);
  ctx.closePath();
  ctx.fillStyle = '#e05050';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawEmpty() {
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, 2*Math.PI);
  ctx.fillStyle = '#eee';
  ctx.fill();
  ctx.strokeStyle = '#ddd';
  ctx.stroke();
  ctx.fillStyle = '#888';
  ctx.font = '16px sans-serif';
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
    // Абсолютный угол середины целевого сектора
    const targetMidAbsolute = currentAngle + idx * step + step / 2;
    // Нужный поворот, чтобы указатель (угол -PI/2) указывал на targetMidAbsolute
    let delta = (-Math.PI / 2) - targetMidAbsolute;
    // Добавляем целое число полных оборотов
    const totalSpins = (SPEEDS[state.settings.speed] || 4) + Math.floor(Math.random() * 2) + 2;
    const fullRotations = totalSpins * 2 * Math.PI;
    // Убедимся, что delta положительная
    while (delta < 0) delta += 2 * Math.PI;
    delta += fullRotations;
    const startAngle = currentAngle;
    const totalRotation = delta; // поворот по часовой? У нас currentAngle увеличивается.
    const duration = 7000;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      currentAngle = startAngle + totalRotation * eased;
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