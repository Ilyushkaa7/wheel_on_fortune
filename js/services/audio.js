import { state } from '../core/state.js';

class AudioService {
  constructor() {
    this.initialized = false;
    this.sounds = {};
  }

  init() {
    if (this.initialized) return;
    try {
      this.sounds = {
        spin: new Audio('assets/sounds/spin.mp3'),
        tick: new Audio('assets/sounds/click.mp3'),
        win: new Audio('assets/sounds/win.mp3')
      };
      Object.values(this.sounds).forEach(a => a.load());
      this.initialized = true;
    } catch (e) {}
  }

  play(name) {
    if (!state.settings.soundEnabled || !this.initialized || !this.sounds[name]) return;
    const s = this.sounds[name];
    s.currentTime = 0;
    s.play().catch(()=>{});
  }

  setEnabled(v) {
    state.settings.soundEnabled = v;
  }
}

export const audio = new AudioService();