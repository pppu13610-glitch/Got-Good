import {AmbienceMode} from '../types/tea';

class CozySoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private masterVolume = 0.85;
  private sfxVolume = 0.9;
  private ambienceVolume = 0.75;
  private ambienceMode: AmbienceMode = 'none';
  private ambienceGain: GainNode | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private breezeLfo: OscillatorNode | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext?: typeof AudioContext})
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureContext();
  }

  public setVolumes(masterPct: number, sfxPct: number, ambiencePct: number) {
    this.masterVolume = Math.max(0, Math.min(1, masterPct / 100));
    this.sfxVolume = Math.max(0, Math.min(1, sfxPct / 100));
    this.ambienceVolume = Math.max(0, Math.min(1, ambiencePct / 100));
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setTargetAtTime(
        this.isMuted || this.ambienceMode === 'none'
          ? 0
          : this.getAmbienceVolume(),
        this.ctx.currentTime,
        0.1,
      );
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setTargetAtTime(
        muted || this.ambienceMode === 'none' ? 0 : this.getAmbienceVolume(),
        this.ctx.currentTime,
        0.15,
      );
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private getSfxScale(): number {
    return this.masterVolume * this.sfxVolume;
  }

  private getAmbienceVolume(): number {
    const base = this.ambienceMode === 'rain' ? 0.055 : 0.042;
    return base * this.masterVolume * this.ambienceVolume;
  }

  public playTap() {
    const scale = this.getSfxScale();
    if (this.isMuted || scale <= 0.001) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.055);

    gain.gain.setValueAtTime(0.065 * scale, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  public playLeafDrop() {
    const scale = this.getSfxScale();
    if (this.isMuted || scale <= 0.001) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);

    gain.gain.setValueAtTime(0.055 * scale, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playPourWater() {
    const scale = this.getSfxScale();
    if (this.isMuted || scale <= 0.001) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 1.25;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.06 * white) / 1.06;
      lastOut = data[i];
      data[i] *= 2.8;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(620, now);
    filter.frequency.linearRampToValueAtTime(1050, now + duration);
    filter.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.095 * scale, now + 0.18);
    gain.gain.setValueAtTime(0.09 * scale, now + duration - 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);
  }

  public playSweetSpotChime() {
    const scale = this.getSfxScale();
    if (this.isMuted || scale <= 0.001) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 880]; // D5 -> A5 gentle chime
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.001, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.065 * scale, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.5);
    });
  }

  public playServeChime() {
    const scale = this.getSfxScale();
    if (this.isMuted || scale <= 0.001) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C major warmth
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.07;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.06 * scale, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  }

  public setAmbience(mode: AmbienceMode) {
    this.ambienceMode = mode;
    this.stopAmbienceNodes();
    if (mode === 'none') return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const duration = 4;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Soft pink-ish noise loop
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.08;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const targetVol = this.isMuted ? 0 : this.getAmbienceVolume();

    if (mode === 'rain') {
      filter.type = 'bandpass';
      filter.frequency.value = 1150;
      filter.Q.value = 0.55;
    } else {
      filter.type = 'lowpass';
      filter.frequency.value = 460;
      filter.Q.value = 1.2;

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.18;
      lfoGain.gain.value = 180;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.breezeLfo = lfo;
    }

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.6);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    this.ambienceSource = source;
    this.ambienceGain = gain;
  }

  private stopAmbienceNodes() {
    if (this.ambienceSource) {
      try {
        this.ambienceSource.stop();
        this.ambienceSource.disconnect();
      } catch {
        // Ignore already stopped
      }
      this.ambienceSource = null;
    }
    if (this.breezeLfo) {
      try {
        this.breezeLfo.stop();
        this.breezeLfo.disconnect();
      } catch {
        // Ignore already stopped
      }
      this.breezeLfo = null;
    }
    if (this.ambienceGain) {
      this.ambienceGain.disconnect();
      this.ambienceGain = null;
    }
  }
}

export const soundEngine = new CozySoundEngine();
