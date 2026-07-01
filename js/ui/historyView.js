import { state } from '../core/state.js';

const historyListEl = document.getElementById('historyList');

/**
 * Отрендерить историю в DOM
 */
export function renderHistory() {
  if (!historyListEl) return;
  
  if (!state.history || state.history.length === 0) {
    historyListEl.innerHTML = '<div class="history-empty">История пуста. Запустите серию вращений!</div>';
    return;
  }
  
  // Берём последние записи в обратном порядке
  const entries = [...state.history].reverse();
  
  historyListEl.innerHTML = entries.map((entry, idx) => {
    const number = state.history.length - idx;
    const time = entry.time || formatDate(entry.date);
    const names = entry.results
      .map(r => r.label || 'Неизвестный')
      .join(', ');
    
    return `
      <div class="history-entry">
        <span class="entry-number">#${number}</span>
        <span class="entry-time">${time}</span>
        <span class="entry-names">${escapeHtml(names)}</span>
      </div>
    `;
  }).join('');
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  } catch {
    return '';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}