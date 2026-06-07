import { state } from '../core/state.js';
import { audio } from '../services/audio.js';

export function initControls() {
  document.querySelectorAll('.speed button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.settings.speed = btn.dataset.speed;
      document.querySelectorAll('.speed button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const spinsSel = document.getElementById('spinsPerSeries');
  if (spinsSel) {
    spinsSel.addEventListener('change', () => {
      state.settings.spinsPerSeries = parseInt(spinsSel.value);
    });
  }

  const biasChk = document.getElementById('biasToggle');
  if (biasChk) {
    biasChk.addEventListener('change', () => {
      state.settings.biasEnabled = biasChk.checked;
    });
  }

  const soundChk = document.getElementById('soundToggle');
  if (soundChk) {
    soundChk.addEventListener('change', () => {
      audio.setEnabled(soundChk.checked);
    });
  }
}