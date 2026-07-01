const modal = document.getElementById('excludeModal');
const messageEl = document.getElementById('excludeMessage');
const yesBtn = document.getElementById('excludeYes');
const noBtn = document.getElementById('excludeNo');

let currentCallback = null;

export function showExcludePrompt(ids, callback) {
  if (!modal) return;
  const list = ids.join(', ');
  messageEl.textContent = `Исключить номер${ids.length > 1 ? 'а' : ''} ${list}?`;
  modal.classList.remove('hidden');
  currentCallback = callback;
}

function hide() {
  modal.classList.add('hidden');
  if (currentCallback) {
    currentCallback(false);
    currentCallback = null;
  }
}

yesBtn.onclick = () => {
  modal.classList.add('hidden');
  if (currentCallback) {
    currentCallback(true);
    currentCallback = null;
  }
};

noBtn.onclick = hide;

modal.addEventListener('click', (e) => {
  if (e.target === modal) hide();
});