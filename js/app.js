import { state, setItems, resetGameExcluded, getActiveItems } from './core/state.js';
import { runSeries } from './core/series.js';
import { drawWheel, spinToItem } from './ui/wheel.js';
import { initControls } from './ui/controls.js';
import { audio } from './services/audio.js';
import { showExcludePrompt } from './ui/modal.js';
import { requestPassword } from './modes/itTop.js';

// DOM
const rangeMin = document.getElementById('rangeMin');
const rangeMax = document.getElementById('rangeMax');
const excludeInput = document.getElementById('excludeInput');
const namesInput = document.getElementById('namesInput');
const resetExcludeBtn = document.getElementById('resetExclude');
const resetAllBtn = document.getElementById('resetAll');
const startBtn = document.getElementById('startSpin');
const spinsRange = document.getElementById('spinsRange');
const spinsValue = document.getElementById('spinsValue');
const biasEnabled = document.getElementById('biasEnabled');
const biasTargetID = document.getElementById('biasTargetID');
const soundToggle = document.getElementById('soundToggle');
const switchModeBtn = document.getElementById('switchMode');
const historyList = document.getElementById('historyList');
const modeRadios = document.querySelectorAll('input[name="inputMode"]');
const rangeInputs = document.getElementById('rangeInputs');
const namesInputs = document.getElementById('namesInputs');

let nameMap = {};

function parseNames() {
    const raw = namesInput.value;
    nameMap = {};
    if (raw.trim()) {
        raw.split(',').map(s => s.trim()).filter(Boolean).forEach((name, idx) => {
            nameMap[idx + 1] = name;
        });
    }
}

function buildItems() {
    const mode = document.querySelector('input[name="inputMode"]:checked').value;
    if (mode === 'range') {
        const min = parseInt(rangeMin.value) || 1;
        const max = parseInt(rangeMax.value) || 10;
        const rawExclude = excludeInput.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        const excludeSet = new Set(rawExclude);
        const items = [];
        for (let i = min; i <= max; i++) {
            if (!excludeSet.has(i)) items.push({ id: i });
        }
        setItems(items);
        nameMap = {}; // сброс имён
    } else {
        // режим имён
        parseNames();
        const ids = Object.keys(nameMap).map(Number);
        setItems(ids.map(id => ({ id })));
    }
    resetGameExcluded();
    drawWheel();
}

function updateUI() {
    buildItems();
}

// Смена режима
modeRadios.forEach(r => r.addEventListener('change', () => {
    if (r.value === 'range') {
        rangeInputs.style.display = 'block';
        namesInputs.style.display = 'none';
        rangeMin.disabled = false;
        rangeMax.disabled = false;
        excludeInput.disabled = false;
        namesInput.disabled = true;
    } else {
        rangeInputs.style.display = 'none';
        namesInputs.style.display = 'block';
        rangeMin.disabled = true;
        rangeMax.disabled = true;
        excludeInput.disabled = true;
        namesInput.disabled = false;
    }
    updateUI();
}));

// Дебаунс на ввод
let debounce;
function onRangeChange() {
    clearTimeout(debounce);
    debounce = setTimeout(updateUI, 300);
}
[rangeMin, rangeMax, excludeInput].forEach(el => el.addEventListener('input', onRangeChange));
namesInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(updateUI, 300);
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
    rangeMin.disabled = false;
    rangeMax.disabled = false;
    excludeInput.disabled = false;
    namesInput.disabled = true;

    biasEnabled.checked = false;
    biasTargetID.value = '';
    biasTargetID.disabled = true;
    state.settings.biasEnabled = false;
    state.settings.biasTarget = null;
    state.settings.speed = 'normal';
    document.querySelectorAll('.speed button').forEach(b => b.classList.remove('active'));
    document.querySelector('.speed button[data-speed="normal"]').classList.add('active');
    updateUI();
});

// Слайдер спинов
spinsRange.addEventListener('input', () => {
    state.settings.spinsPerSeries = parseInt(spinsRange.value);
    spinsValue.textContent = spinsRange.value;
});
// Инициализация
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

// Старт
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
    } catch (e) {
        alert(e.message);
    } finally {
        startBtn.disabled = false;
    }
}

startBtn.addEventListener('click', handleStart);

function addHistory(results) {
    const li = document.createElement('li');
    const itemsStr = results.map(r => {
        const name = nameMap[r.id];
        return name ? `${r.id} - ${name}` : `${r.id}`;
    }).join(', ');
    li.textContent = itemsStr;
    historyList.prepend(li);
    if (historyList.children.length > 20) historyList.removeChild(historyList.lastChild);
}

// IT TOP
switchModeBtn.addEventListener('click', async () => {
    const ok = await requestPassword();
    if (ok) {
        sessionStorage.setItem('itop_skip_password', '1');
        window.location.href = 'ittop.html';
    }
});

function init() {
    audio.init();
    updateUI();
}
document.addEventListener('DOMContentLoaded', init);