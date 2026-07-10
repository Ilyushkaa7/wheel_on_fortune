export const state = {
  items: [],
  gameExcluded: new Set(),
  settings: {
    speed: 'normal',
    spinsPerSeries: 1,
    biasEnabled: false,
    biasTarget: null,   // ID для подкрутки
    soundEnabled: true
  },
  currentSeries: {
    completed: 0,
    total: 3,
    results: []
  }
};

export function setItems(newItems) {
  state.items = newItems;
}

export function resetGameExcluded() {
  state.gameExcluded.clear();
}

export function addGameExcluded(id) {
  state.gameExcluded.add(id);
}

export function getActiveItems() {
  return state.items.filter(item => !state.gameExcluded.has(item.id));
}

export function resetSeriesProgress(total) {
  state.currentSeries = {
    completed: 0,
    total: total || state.settings.spinsPerSeries,
    results: []
  };
}

export function addSeriesResult(item) {
  state.currentSeries.completed++;
  state.currentSeries.results.push(item);
}

export function isSeriesComplete() {
  return state.currentSeries.completed >= state.currentSeries.total;
}
