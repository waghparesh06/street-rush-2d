// STREET RUSH 2D - Procedural Web Audio API Engine

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isMusicMuted = false;
    this.engineNode = null;
    this.engineGain = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    
    // Check initial user settings
    const settings = storage.getSettings();
    this.isMuted = !settings.sound;
    this.isMusicMuted = !settings.music;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSoundEnabled(enabled) {
    this.isMuted = !enabled;
    if (this.isMuted && this.engineGain) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  setMusicEnabled(enabled) {
    this.isMusicMuted = !enabled;
    if (this.isMusicMuted) {
      this.stopBGM();
    } else if (this.bgmPlaying) {
      this.startBGM();
    }
  }

  // --- SOUND EFFECTS ---

  playClick() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  playCoin() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    osc2.frequency.setValueAtTime(1975.53, now); // B6
    osc2.frequency.setValueAtTime(2637.02, now + 0.08); // E7

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.25);
    osc2.stop(now + 0.25);
  }

  playNearMiss() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playCrash() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Low rumble boom
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);

    // Noise crunch
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.35);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
  }

  playPowerup() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  playNitroBurn() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.3);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playLevelComplete() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const fanfare = [
      { f: 523.25, t: 0.00, d: 0.12 }, // C5
      { f: 659.25, t: 0.12, d: 0.12 }, // E5
      { f: 783.99, t: 0.24, d: 0.12 }, // G5
      { f: 1046.50, t: 0.36, d: 0.40 } // C6
    ];

    fanfare.forEach(item => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(item.f, now + item.t);

      gain.gain.setValueAtTime(0.2, now + item.t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + item.t + item.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + item.t);
      osc.stop(now + item.t + item.d);
    });
  }

  playGameOver() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [
      { f: 392.00, t: 0.0, d: 0.3 }, // G4
      { f: 369.99, t: 0.3, d: 0.3 }, // F#4
      { f: 349.23, t: 0.6, d: 0.3 }, // F4
      { f: 293.66, t: 0.9, d: 0.6 }  // D4
    ];

    chords.forEach(c => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(c.f, now + c.t);

      gain.gain.setValueAtTime(0.25, now + c.t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + c.t + c.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + c.t);
      osc.stop(now + c.t + c.d);
    });
  }

  // --- ENGINE DRONE SOUND ---

  startEngine() {
    if (this.isMuted || this.engineNode) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      this.engineNode = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350;

      this.engineNode.type = 'triangle';
      this.engineNode.frequency.setValueAtTime(65, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.engineNode.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineNode.start();
    } catch (e) {
      console.warn('Engine sound init issue:', e);
    }
  }

  updateEnginePitch(speedRatio, isNitro) {
    if (!this.engineNode || !this.ctx || this.isMuted) return;
    const baseFreq = 65;
    const targetFreq = baseFreq + (speedRatio * 85) + (isNitro ? 50 : 0);
    this.engineNode.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
    
    if (this.engineGain) {
      const targetGain = 0.06 + (speedRatio * 0.06) + (isNitro ? 0.04 : 0);
      this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  stopEngine() {
    if (this.engineNode) {
      try {
        this.engineNode.stop();
        this.engineNode.disconnect();
      } catch (e) {}
      this.engineNode = null;
      this.engineGain = null;
    }
  }

  // --- PROCEDURAL SYNTHWAVE BGM LOOP ---

  startBGM() {
    this.bgmPlaying = true;
    if (this.isMusicMuted) return;
    this.ensureContext();
    if (!this.ctx || this.bgmTimer) return;

    // 130 BPM Synthwave arpeggiated loop
    const tempo = 135;
    const stepDuration = (60 / tempo) / 4; // 16th notes
    
    // Bass note sequences (Am, F, C, G chord progression)
    const bassScale = [
      110, 110, 220, 110,  110, 110, 220, 110, // A2
      87.31, 87.31, 174.61, 87.31, 87.31, 87.31, 174.61, 87.31, // F2
      130.81, 130.81, 261.63, 130.81, 130.81, 130.81, 261.63, 130.81, // C3
      98.00, 98.00, 196.00, 98.00, 98.00, 98.00, 196.00, 98.00  // G2
    ];

    const leadScale = [
      440, 523.25, 659.25, 880,  523.25, 659.25, 880, 1046.5,
      349.23, 440, 523.25, 698.46, 440, 523.25, 698.46, 880,
      523.25, 659.25, 783.99, 1046.5, 659.25, 783.99, 1046.5, 1318.51,
      392, 493.88, 587.33, 783.99, 493.88, 587.33, 783.99, 987.77
    ];

    this.bgmStep = 0;

    const playStep = () => {
      if (!this.bgmPlaying || this.isMusicMuted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Bass synth beat
      const bassFreq = bassScale[this.bgmStep % bassScale.length];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + stepDuration);

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      bassGain.gain.setValueAtTime(0.12, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.95);

      bassOsc.connect(filter);
      filter.connect(bassGain);
      bassGain.connect(this.ctx.destination);

      bassOsc.start(now);
      bassOsc.stop(now + stepDuration);

      // Hi-hat noise on alternating steps
      if (this.bgmStep % 2 === 0) {
        const leadFreq = leadScale[this.bgmStep % leadScale.length];
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(leadFreq, now);
        leadGain.gain.setValueAtTime(0.04, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.7);
        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);
        leadOsc.start(now);
        leadOsc.stop(now + stepDuration);
      }

      this.bgmStep = (this.bgmStep + 1) % 32;
    };

    this.bgmTimer = setInterval(playStep, stepDuration * 1000);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

const audio = new SoundEngine();
