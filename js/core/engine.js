import { state } from './state.js';
import { randomPick } from '../utils/helpers.js';

function getAvailable() {
  return state.items.filter(item => !state.gameExcluded.has(item.id));
}

function weightedPick(arr) {
  const biasTarget = state.settings.biasEnabled ? state.settings.biasTarget : null;
  if (biasTarget && arr.some(i => i.id === biasTarget)) {
    return Math.random() < 0.95
      ? arr.find(i => i.id === biasTarget)
      : randomPick(arr);
  }
  return randomPick(arr);
}

export function pickItem() {
  const available = getAvailable();
  if (!available.length) throw new Error('Нет доступных номеров');
  return weightedPick(available);
}