import { state, setItems, resetGameExcluded, getActiveItems } from './core/state.js';
import { runSeries } from './core/series.js';
import { drawWheel, spinToItem } from './ui/wheel.js';
import { audio } from './services/audio.js';
import { showExcludePrompt } from './ui/modal.js';
import { loadJSON } from './services/dataLoader.js';
import { requestPassword } from './modes/itTop.js';

const groupSelect = document.getElementById('groupSelect');
const startBtn = document.getElementById('startSpin');
const spinsRange = document.getElementById('spinsRange');
const spinsValue = document.getElementById('spinsValue');
const biasEnabled = document.getElementById('biasEnabled');
const biasTargetID = document.getElementById('biasTargetID');
const soundToggle = document.getElementById('soundToggle');
const resetAllBtn = document.getElementById('resetAll');
const historyList = document.getElementById('historyList');
const excludeInput = document.getElementById('excludeInput');
const resetExcludeBtn = document.getElementById('resetExclude');

let allGroups = [];
let nameMap = {};

function applyExcludesAndLoadGroup(group) {
    const rawExclude = excludeInput.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    const excludeSet = new Set(rawExclude);
    const items = group.items.filter(it => !excludeSet.has(it.id)).map(it => ({ id: it.id }));
    setItems(items);
    nameMap = {};
    group.items.forEach(it => { nameMap[it.id] = it.label; });
    resetGameExcluded();
    drawWheel();
}

function loadGroup(index) {
    const group = allGroups[index];
    if (!group) return;
    applyExcludesAndLoadGroup(group);
}

groupSelect.addEventListener('change', () => loadGroup(groupSelect.value));

// Исключения ввод
let debounce;
excludeInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
        const idx = groupSelect.value;
        if (idx !== '') loadGroup(idx);
    }, 300);
});
resetExcludeBtn.addEventListener('click', () => {
    excludeInput.value = '';
    const idx = groupSelect.value;
    if (idx !== '') loadGroup(idx);
});

resetAllBtn.addEventListener('click', () => {
    resetGameExcluded();
    drawWheel();
});

// Слайдер спинов
spinsRange.addEventListener('input', () => {
    state.settings.spinsPerSeries = parseInt(spinsRange.value);
    spinsValue.textContent = spinsRange.value;
});
spinsValue.textContent = spinsRange.value;
state.settings.spinsPerSeries = parseInt(spinsRange.value);

// Подкрутка
biasEnabled.addEventListener('change', () => {
    state.settings.biasEnabled = biasEnabled.checked;
    biasTargetID.disabled = !biasEnabled.checked;
    if (!biasEnabled.checked) {
        biasTargetID.value = '';
        state.settings.biasTarget = null;
    }
});
biasTargetID.addEventListener('input', () => {
    const val = parseInt(biasTargetID.value);
    state.settings.biasTarget = isNaN(val) ? null : val;
});

// Звук
soundToggle.addEventListener('change', () => {
    audio.setEnabled(soundToggle.checked);
});

// Скорость
document.querySelectorAll('.speed button').forEach(btn => {
    btn.addEventListener('click', () => {
        state.settings.speed = btn.dataset.speed;
        document.querySelectorAll('.speed button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

async function startSpin() {
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
    } catch (e) {
        alert(e.message);
    } finally {
        startBtn.disabled = false;
    }
}

startBtn.addEventListener('click', startSpin);

function addHistory(results) {
    const li = document.createElement('li');
    const itemsStr = results.map(r => {
        const name = nameMap[r.id] || '';
        return name ? `${r.id} - ${name}` : `${r.id}`;
    }).join(', ');
    li.textContent = itemsStr;
    historyList.prepend(li);
    if (historyList.children.length > 20) historyList.removeChild(historyList.lastChild);
}

// Правовая информация
document.getElementById('btnLegalInfo').addEventListener('click', () => {
    document.getElementById('legalInfoModal').classList.remove('hidden');
});
document.getElementById('closeLegalInfo').addEventListener('click', () => {
    document.getElementById('legalInfoModal').classList.add('hidden');
});

async function init() {
    audio.init();

    const skip = sessionStorage.getItem('itop_skip_password');
    if (skip === '1') {
        sessionStorage.removeItem('itop_skip_password');
    } else {
        const granted = await requestPassword();
        if (!granted) {
            document.body.innerHTML = '<h2 style="text-align:center;margin-top:80px;">Доступ запрещён</h2>';
            return;
        }
    }

    try {
        allGroups = await loadJSON('data/groups.json');
        groupSelect.innerHTML = allGroups.map((g, i) => `<option value="${i}">${g.name}</option>`).join('');
        if (allGroups.length) loadGroup(0);
    } catch (e) {
        alert('Ошибка загрузки групп');
    }
}

document.addEventListener('DOMContentLoaded', init);