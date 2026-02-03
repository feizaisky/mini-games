export class AudioManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  setEnabled(value) {
    this.enabled = value;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  beep({ frequency = 440, duration = 0.08, type = "square", gain = 0.08 } = {}) {
    if (!this.enabled) return;
    this.unlock();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gainNode.gain.value = gain;
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
}
