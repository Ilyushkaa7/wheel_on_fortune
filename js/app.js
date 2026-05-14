import { state, setItems, resetGameExcluded, getActiveItems } from './core/state.js';
import { runSeries } from './core/series.js';
import { drawWheel, spinToItem } from './ui/wheel.js';
import { audio } from './services/audio.js';
import { showExcludePrompt } from './ui/modal.js';
import { loadJSON } from './services/dataLoader.js';
import { requestPassword } from './modes/itTop.js';

const btnNormal = document.getElementById('btnNormalMode');
const btnIT = document.getElementById('btnITMode');
const panelNormal = document.getElementById('panelNormal');
const panelIT = document.getElementById('panelIT');
const modeSubtitle = document.getElementById('modeSubtitle');

const rangeMin = document.getElementById('rangeMin');
const rangeMax = document.getElementById('rangeMax');
const excludeInput = document.getElementById('excludeInput');
const namesInput = document.getElementById('namesInput');
const resetExcludeBtn = document.getElementById('resetExclude');
const resetAllBtn = document.getElementById('resetAll');

const groupDropdownBtn = document.getElementById('groupDropdownBtn');
const selectedGroupName = document.getElementById('selectedGroupName');
const groupDropdownMenu = document.getElementById('groupDropdownMenuFloating');
const groupDropdownOverlay = document.getElementById('groupDropdownOverlay');
const excludeInputIT = document.getElementById('excludeInputIT');
const resetExcludeIT = document.getElementById('resetExcludeIT');
const resetAllIT = document.getElementById('resetAllIT');

const startBtn = document.getElementById('startSpin');
const spinsRange = document.getElementById('spinsRange');
const spinsValue = document.getElementById('spinsValue');
const biasEnabled = document.getElementById('biasEnabled');
const biasTargetID = document.getElementById('biasTargetID');
const soundToggle = document.getElementById('soundToggle');
const historyList = document.getElementById('historyList');
const probabilityBlock = document.getElementById('probabilityBlock');
const modeRadios = document.querySelectorAll('input[name="inputMode"]');
const rangeInputs = document.getElementById('rangeInputs');
const namesInputs = document.getElementById('namesInputs');

let currentMode = 'normal';
let allGroups = [];
let nameMap = {};

function setMode(mode) {
  currentMode = mode;
  if (mode === 'normal') {
    btnNormal.classList.add('active');
    btnIT.classList.remove('active');
    panelNormal.style.display = 'block';
    panelIT.style.display = 'none';
    modeSubtitle.textContent = 'Обычный режим';
  } else {
    btnIT.classList.add('active');
    btnNormal.classList.remove('active');
    panelNormal.style.display = 'none';
    panelIT.style.display = 'block';
    modeSubtitle.textContent = 'IT TOP (преподаватель)';
  }
  updateUI();
}

btnNormal.addEventListener('click', () => setMode('normal'));
btnIT.addEventListener('click', async () => {
  const granted = await requestPassword();
  if (granted) setMode('it');
});

// --- Сборка списка элементов ---
function buildItemsNormal() {
  const mode = document.querySelector('input[name="inputMode"]:checked').value;
  if (mode === 'range') {
    let min = parseInt(rangeMin.value) || 1;
    let max = parseInt(rangeMax.value) || 10;
    min = Math.max(1, Math.min(67, min));
    max = Math.max(1, Math.min(67, max));
    if (min > max) [min, max] = [max, min];
    rangeMin.value = min;
    rangeMax.value = max;
    const rawExclude = excludeInput.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const excludeSet = new Set(rawExclude);
    const items = [];
    for (let i = min; i <= max; i++) {
      if (!excludeSet.has(i)) items.push({ id: i });
    }
    setItems(items);
    nameMap = {};
  } else {
    const raw = namesInput.value;
    nameMap = {};
    const items = [];
    if (raw.trim()) {
      raw.split(',').map(s => s.trim()).filter(Boolean).forEach((name, idx) => {
        const id = idx + 1;
        nameMap[id] = name;
        items.push({ id, label: name });
      });
    }
    setItems(items);
  }
  resetGameExcluded();
  drawWheel();
  updateProbability();
}

function buildItemsIT() {
  const selectedLink = groupDropdownMenu.querySelector('a.selected');
  if (!selectedLink) {
    setItems([]);
    nameMap = {};
    resetGameExcluded();
    drawWheel();
    updateProbability();
    return;
  }
  const idx = parseInt(selectedLink.dataset.index);
  const group = allGroups[idx];
  if (!group) return;
  const rawExclude = excludeInputIT.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  const excludeSet = new Set(rawExclude);
  const items = group.items.filter(it => !excludeSet.has(it.id)).map(it => ({ id: it.id }));
  setItems(items);
  nameMap = {};
  group.items.forEach(it => { nameMap[it.id] = it.label; });
  resetGameExcluded();
  drawWheel();
  updateProbability();
}

function loadGroupIT(index) {
  if (!allGroups[index]) return;
  const group = allGroups[index];
  const rawExclude = excludeInputIT.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  const excludeSet = new Set(rawExclude);
  const items = group.items.filter(it => !excludeSet.has(it.id)).map(it => ({ id: it.id }));
  setItems(items);
  nameMap = {};
  group.items.forEach(it => { nameMap[it.id] = it.label; });
  resetGameExcluded();
  drawWheel();
  updateProbability();
}

function updateUI() {
  if (currentMode === 'normal') {
    buildItemsNormal();
  } else {
    buildItemsIT();
  }
}

// Вероятность
function updateProbability() {
  const active = getActiveItems();
  const total = active.length;
  if (!probabilityBlock) return;
  if (total === 0) {
    probabilityBlock.innerHTML = 'Нет секторов для расчёта';
    return;
  }
  const baseChance = (100 / total).toFixed(2);
  let html = `Вероятность выпадения любого сектора: <strong>${baseChance}%</strong>`;
  if (state.settings.biasEnabled && state.settings.biasTarget) {
    const targetId = state.settings.biasTarget;
    if (active.some(item => item.id === targetId)) {
      const otherChance = total > 1 ? ((100 - 75) / (total - 1)).toFixed(2) : '0';
      html += `<br>🔹 С подкруткой: сектор <strong>${targetId}</strong> выпадает с вероятностью <strong>75%</strong>, остальные — с вероятностью <strong>${otherChance}%</strong>`;
    }
  }
  probabilityBlock.innerHTML = html;
}

// Слушатели нормального режима
modeRadios.forEach(r => r.addEventListener('change', () => {
  rangeInputs.style.display = r.value === 'range' ? 'block' : 'none';
  namesInputs.style.display = r.value === 'names' ? 'block' : 'none';
  updateUI();
}));

let debounce;
[rangeMin, rangeMax, excludeInput, namesInput].forEach(el => {
  el.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(updateUI, 300);
  });
});

resetExcludeBtn.addEventListener('click', () => {
  excludeInput.value = '';
  updateUI();
});

resetAllBtn.addEventListener('click', () => {
  rangeMin.value = 1;
  rangeMax.value = 10;
  excludeInput.value = '';
  namesInput.value = '';
  nameMap = {};
  document.querySelector('input[name="inputMode"][value="range"]').checked = true;
  rangeInputs.style.display = 'block';
  namesInputs.style.display = 'none';
  updateUI();
});

// IT режим
excludeInputIT.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(updateUI, 300);
});
resetExcludeIT.addEventListener('click', () => {
  excludeInputIT.value = '';
  updateUI();
});
resetAllIT.addEventListener('click', () => {
  excludeInputIT.value = '';
  resetGameExcluded();
  drawWheel();
  updateProbability();
});

// Общие настройки
spinsRange.addEventListener('input', () => {
  state.settings.spinsPerSeries = parseInt(spinsRange.value);
  spinsValue.textContent = spinsRange.value;
});
spinsValue.textContent = spinsRange.value;
state.settings.spinsPerSeries = parseInt(spinsRange.value);

biasEnabled.addEventListener('change', () => {
  state.settings.biasEnabled = biasEnabled.checked;
  biasTargetID.disabled = !biasEnabled.checked;
  if (!biasEnabled.checked) {
    biasTargetID.value = '';
    state.settings.biasTarget = null;
  }
  updateProbability();
});
biasTargetID.addEventListener('input', () => {
  const val = parseInt(biasTargetID.value);
  state.settings.biasTarget = isNaN(val) ? null : val;
  updateProbability();
});

soundToggle.addEventListener('change', () => {
  audio.setEnabled(soundToggle.checked);
});

// Скорость
document.querySelectorAll('.speed-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.settings.speed = btn.dataset.speed;
    document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Старт вращения
async function handleStart() {
  if (!getActiveItems().length) {
    alert('Нет доступных номеров');
    return;
  }
  startBtn.disabled = true;
  try {
    const results = await runSeries(
      (item) => {
        audio.play('spin');
        return spinToItem(item);
      },
      state.settings.spinsPerSeries
    );
    drawWheel();
    audio.play('win');

    const ids = results.map(r => r.id);
    const confirmed = await new Promise(resolve => showExcludePrompt(ids, resolve));
    if (!confirmed) {
      ids.forEach(id => state.gameExcluded.delete(id));
    }
    drawWheel();
    addHistory(results);
    updateProbability();
  } catch (e) {
    alert(e.message);
  } finally {
    startBtn.disabled = false;
  }
}
startBtn.addEventListener('click', handleStart);

function addHistory(results) {
  const li = document.createElement('li');
  li.className = 'history-entry';
  const itemsStr = results.map(r => {
    const label = nameMap[r.id] || '';
    return label ? `${r.id} - ${label}` : `${r.id}`;
  }).join(', ');
  li.innerHTML = `<span class="entry-time">${new Date().toLocaleTimeString()}</span> ${itemsStr}`;
  historyList.prepend(li);
  if (historyList.children.length > 20) historyList.removeChild(historyList.lastChild);
}

// ========== КНОПКИ В ХЕДЕРЕ ==========

// Песочные часы
const btnSandbox = document.getElementById('btnSandbox');
if (btnSandbox) {
  btnSandbox.addEventListener('click', () => {
    window.open('sandbox.html', '_blank');
  });
}

// Правовая информация
const legalModal = document.getElementById('legalInfoModal');
const btnLegal = document.getElementById('btnLegal');
const closeLegalInfo = document.getElementById('closeLegalInfo');
const btnLegalInfo = document.getElementById('btnLegalInfo');

function openLegalModal() {
  if (legalModal) legalModal.classList.remove('hidden');
}

function closeLegalModal() {
  if (legalModal) legalModal.classList.add('hidden');
}

if (btnLegal) {
  btnLegal.addEventListener('click', openLegalModal);
}

if (btnLegalInfo) {
  btnLegalInfo.addEventListener('click', openLegalModal);
}

if (closeLegalInfo) {
  closeLegalInfo.addEventListener('click', closeLegalModal);
}

if (legalModal) {
  legalModal.addEventListener('click', (e) => {
    if (e.target === legalModal) closeLegalModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && legalModal && !legalModal.classList.contains('hidden')) {
    closeLegalModal();
  }
});

// ========== ИНИЦИАЛИЗАЦИЯ ==========
async function init() {
  audio.init();
  try {
    allGroups = await loadJSON('data/groups.json');
    groupDropdownMenu.innerHTML = allGroups.map((g, i) => 
      `<li><a href="#" data-index="${i}">${g.name}</a></li>`
    ).join('');
    
    groupDropdownMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(link.dataset.index);
        groupDropdownMenu.querySelectorAll('a').forEach(a => a.classList.remove('selected'));
        link.classList.add('selected');
        selectedGroupName.textContent = allGroups[index].name;
        closeDropdown();
        loadGroupIT(index);
      });
    });
    
    groupDropdownBtn.addEventListener('click', () => {
      if (groupDropdownOverlay.style.display === 'block') {
        closeDropdown();
      } else {
        openDropdown();
      }
    });
    
    groupDropdownOverlay.addEventListener('click', closeDropdown);
    
    function openDropdown() {
      const rect = groupDropdownBtn.getBoundingClientRect();
      groupDropdownMenu.style.top = rect.bottom + 6 + 'px';
      groupDropdownMenu.style.left = rect.left + 'px';
      groupDropdownMenu.style.width = rect.width + 'px';
      groupDropdownMenu.style.display = 'block';
      groupDropdownOverlay.style.display = 'block';
      groupDropdownBtn.classList.add('active');
    }
    
    function closeDropdown() {
      groupDropdownMenu.style.display = 'none';
      groupDropdownOverlay.style.display = 'none';
      groupDropdownBtn.classList.remove('active');
    }
    
    if (allGroups.length > 0) {
      selectedGroupName.textContent = allGroups[0].name;
      groupDropdownMenu.querySelector('a').classList.add('selected');
      loadGroupIT(0);
    }
  } catch (e) { 
    console.warn('Группы не загружены'); 
  }
  setMode('normal');
}

document.addEventListener('DOMContentLoaded', init);