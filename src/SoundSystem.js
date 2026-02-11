// SoundSystem.js - Système d'effets sonores

class SoundSystem {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.3;
  }

  // Initialiser le contexte audio (nécessaire pour jouer des sons)
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Jouer un bip simple
  playBeep(frequency = 440, duration = 200, type = 'sine') {
    if (!this.enabled) return;
    this.init();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.value = this.volume;

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  // Son pour nouveau cours (mélodie montante)
  playNewSession() {
    this.playBeep(523.25, 150); // Do
    setTimeout(() => this.playBeep(659.25, 150), 150); // Mi
    setTimeout(() => this.playBeep(783.99, 200), 300); // Sol
  }

  // Son pour retard (2 bips rapides)
  playDelay() {
    this.playBeep(392, 100); // Sol grave
    setTimeout(() => this.playBeep(392, 100), 150);
  }

  // Son pour absence (bip long grave)
  playAbsence() {
    this.playBeep(293.66, 400, 'square'); // Ré grave
  }

  // Son pour annulation (descendant)
  playCancellation() {
    this.playBeep(523.25, 100);
    setTimeout(() => this.playBeep(392, 100), 100);
    setTimeout(() => this.playBeep(293.66, 150), 200);
  }

  // Son pour notification générale
  playNotification() {
    this.playBeep(659.25, 150);
    setTimeout(() => this.playBeep(783.99, 150), 150);
  }

  // Activer/Désactiver les sons
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Changer le volume
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }
}

export default new SoundSystem();
