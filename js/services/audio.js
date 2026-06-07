import { state } from '../core/state.js';

class AudioService {
  constructor() {
    this.initialized = false;
    this.sounds = {};
  }

  init() {
    if (this.initialized) return;

    this.sounds = {
      spin: new Audio('assets/sounds/mellstroy.mp3')
    };

    this.sounds.spin.preload = 'auto';
    this.sounds.spin.volume = 0.55;
    this.initialized = true;
  }

  play(name) {
    if (!state.settings.soundEnabled || !this.initialized) return;

    if (name === 'spin') {
      this.playSpin();
    }

    if (name === 'win') {
      this.stopSpin();
    }
  }

  playSpin() {
    const sound = this.sounds.spin;

    if (!sound) return;

    sound.pause();
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }

  stopSpin() {
    const sound = this.sounds.spin;

    if (!sound) return;

    sound.pause();
    sound.currentTime = 0;
  }

  setEnabled(v) {
    state.settings.soundEnabled = v;

    if (!v) {
      this.stopSpin();
    }
  }
}

export const audio = new AudioService();
