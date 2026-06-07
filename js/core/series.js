import { pickItem } from './engine.js';
import { addGameExcluded, addSeriesResult, resetSeriesProgress, state } from './state.js';

export async function runSeries(spinFn, count) {
  resetSeriesProgress(count);
  const results = [];
  for (let i = 0; i < count; i++) {
    const item = pickItem();
    await spinFn(item);
    addGameExcluded(item.id);
    addSeriesResult(item);
    results.push(item);
  }
  return results;
}