import {AmbienceMode, MusicTrackId} from '../types/tea';

export interface ChillTrackMeta {
  id: MusicTrackId;
  title: string;
  subtitle: string;
  bpmLabel: string;
  audioSrc?: string;
}

export const SMOKE_IN_THE_GLASS_AUDIO_URL =
  '/assets/aistudio/_____-_Smoke_in_the_Glass_402718f9.m4a';

export const CHILL_MUSIC_TRACKS: ChillTrackMeta[] = [
  {
    id: 'morning-bamboo',
    title: 'สายลมอุ่นในสวนไผ่',
    subtitle: 'คอร์ดเปียโนไฟฟ้าอุ่นๆ ผสมระฆังไม้ไผ่สบายใจ',
    bpmLabel: '74 BPM',
  },
  {
    id: 'rainy-teahouse',
    title: 'บ่ายฝนพรำในเรือนชา',
    subtitle: 'ทำนองช้าๆ โทนอุ่นนุ่มลึกชวนผ่อนคลาย',
    bpmLabel: '68 BPM',
  },
  {
    id: 'twilight-lantern',
    title: 'โคมไฟอุ่นยามพลบค่ำ',
    subtitle: 'เสียงพิณและเบสนุ่มๆ ยามเย็นในร้านชา',
    bpmLabel: '70 BPM',
  },
  {
    id: 'smoke-in-the-glass',
    title: 'Smoke in the Glass',
    subtitle: 'ไฟล์เพลงต้นฉบับ · แจ๊สชิลล์ในเรือนชา',
    bpmLabel: '2:44',
    audioSrc: SMOKE_IN_THE_GLASS_AUDIO_URL,
  },
  {
    id: 'none',
    title: 'ปิดเพลงประกอบ',
    subtitle: 'ฟังเฉพาะเสียงชงชาและเสียงธรรมชาติ',
    bpmLabel: 'เงียบ',
  },
];

type SynthTrackId = 'morning-bamboo' | 'rainy-teahouse' | 'twilight-lantern';

interface ChillPattern {
  stepMs: number;
  chords: number[][];
  melody: (number | null)[];
  bass: number[];
  leadWave: OscillatorType;
}

const CHILL_PATTERNS: Record<SynthTrackId, ChillPattern> = {
  // Warm sunlit garden: Fmaj7 -> Em7 -> Dm9 -> Cmaj7
  'morning-bamboo': {
    stepMs: 405,
    chords: [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [164.81, 196.0, 246.94, 293.66], // Em7
      [146.83, 174.61, 220.0, 329.63], // Dm9
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
    ],
    melody: [
      523.25, null, 659.25, 587.33,
      440.0, null, 392.0, null,
      493.88, null, 587.33, 523.25,
      392.0, null, 440.0, null,
      587.33, null, 659.25, 783.99,
      659.25, null, 523.25, null,
      440.0, 493.88, 523.25, null,
      392.0, null, 329.63, null,
    ],
    bass: [87.31, 82.41, 73.42, 65.41],
    leadWave: 'sine',
  },
  // Mellow rainy cafe lo-fi: Am9 -> Fmaj7 -> Dm7 -> E7sus4
  'rainy-teahouse': {
    stepMs: 440,
    chords: [
      [220.0, 261.63, 329.63, 493.88], // Am9
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [146.83, 174.61, 220.0, 261.63], // Dm7
      [164.81, 220.0, 246.94, 293.66], // E7sus4
    ],
    melody: [
      659.25, null, 587.33, null,
      523.25, 493.88, 440.0, null,
      523.25, null, 440.0, null,
      392.0, null, 329.63, null,
      587.33, null, 523.25, 440.0,
      349.23, null, 440.0, null,
      493.88, null, 523.25, 493.88,
      440.0, null, null, null,
    ],
    bass: [110.0, 87.31, 73.42, 82.41],
    leadWave: 'triangle',
  },
  // Cozy warm lantern evening: Gmaj7 -> Em9 -> Cmaj7 -> D6
  'twilight-lantern': {
    stepMs: 428,
    chords: [
      [196.0, 246.94, 293.66, 369.99], // Gmaj7
      [164.81, 196.0, 246.94, 369.99], // Em9
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
      [146.83, 185.0, 220.0, 246.94], // D6
    ],
    melody: [
      587.33, null, 493.88, null,
      392.0, 440.0, 493.88, null,
      659.25, null, 587.33, 493.88,
      392.0, null, null, null,
      523.25, null, 493.88, 392.0,
      329.63, null, 392.0, null,
      440.0, null, 493.88, 587.33,
      493.88, null, 392.0, null,
    ],
    bass: [98.0, 82.41, 65.41, 73.42],
    leadWave: 'sine',
  },
};

function isSynthTrack(track: MusicTrackId): track is SynthTrackId {
  return (
    track === 'morning-bamboo' ||
    track === 'rainy-teahouse' ||
    track === 'twilight-lantern'
  );
}

class CozySoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private masterVolume = 0.85;
  private sfxVolume = 0.9;
  private ambienceVolume = 0.75;
  private musicVolume = 0.7;
  private ambienceMode: AmbienceMode = 'none';
  private musicTrack: MusicTrackId = 'morning-bamboo';

  private ambienceGain: GainNode | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private breezeLfo: OscillatorNode | null = null;

  private musicBusGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private musicTimer: number | null = null;
  private musicStepIdx = 0;

  private audioEl: HTMLAudioElement | null = null;
  private audioUnlocked = false;

  private ensureContext(createIfMissing = true): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      if (!createIfMissing) return null;
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

  private getAudioFileMeta(): ChillTrackMeta | undefined {
    return CHILL_MUSIC_TRACKS.find((t) => t.id === this.musicTrack && t.audioSrc);
  }

  private getAudioFileVolume(): number {
    return Math.max(0, Math.min(1, 0.8 * this.masterVolume * this.musicVolume));
  }

  private syncAudioElementVolume() {
    if (!this.audioEl) return;
    const isAudioTrack = Boolean(this.getAudioFileMeta());
    this.audioEl.volume =
      this.isMuted || !isAudioTrack ? 0 : this.getAudioFileVolume();
  }

  private startAudioFileTrack(src: string) {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    if (!this.audioEl) {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = 'auto';
      this.audioEl = audio;
    }
    if (!this.audioEl.src.endsWith(src)) {
      this.audioEl.src = src;
      this.audioEl.currentTime = 0;
    }
    this.syncAudioElementVolume();
    if (!this.isMuted && this.audioUnlocked) {
      void this.audioEl.play().catch(() => {
        // Ignore browser autoplay rejection until next user gesture
      });
    }
  }

  private stopAudioFileTrack(resetPosition = true) {
    if (!this.audioEl) return;
    this.audioEl.pause();
    if (resetPosition) {
      try {
        this.audioEl.currentTime = 0;
      } catch {
        // Ignore if metadata not loaded yet
      }
    }
  }

  public unlock() {
    this.audioUnlocked = true;
    const ctx = this.ensureContext(true);
    const fileTrack = this.getAudioFileMeta();
    if (fileTrack?.audioSrc && !this.isMuted) {
      this.startAudioFileTrack(fileTrack.audioSrc);
    } else if (
      ctx &&
      isSynthTrack(this.musicTrack) &&
      !this.isMuted &&
      this.musicTimer === null
    ) {
      this.startMusicLoop();
    }
    if (ctx && this.ambienceMode !== 'none' && !this.ambienceSource) {
      this.setAmbience(this.ambienceMode);
    }
  }

  public setVolumes(
    masterPct: number,
    sfxPct: number,
    ambiencePct: number,
    musicPct?: number,
  ) {
    this.masterVolume = Math.max(0, Math.min(1, masterPct / 100));
    this.sfxVolume = Math.max(0, Math.min(1, sfxPct / 100));
    this.ambienceVolume = Math.max(0, Math.min(1, ambiencePct / 100));
    if (typeof musicPct === 'number') {
      this.musicVolume = Math.max(0, Math.min(1, musicPct / 100));
    }

    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setTargetAtTime(
        this.isMuted || this.ambienceMode === 'none'
          ? 0
          : this.getAmbienceVolume(),
        this.ctx.currentTime,
        0.1,
      );
    }

    if (this.musicBusGain && this.ctx) {
      this.musicBusGain.gain.setTargetAtTime(
        this.isMuted || !isSynthTrack(this.musicTrack)
          ? 0
          : this.getMusicBusVolume(),
        this.ctx.currentTime,
        0.12,
      );
    }

    this.syncAudioElementVolume();
  }

  public setMusicVolume(musicPct: number) {
    this.musicVolume = Math.max(0, Math.min(1, musicPct / 100));
    if (this.musicBusGain && this.ctx) {
      this.musicBusGain.gain.setTargetAtTime(
        this.isMuted || !isSynthTrack(this.musicTrack)
          ? 0
          : this.getMusicBusVolume(),
        this.ctx.currentTime,
        0.12,
      );
    }
    this.syncAudioElementVolume();
  }

  public setMusicTrack(track: MusicTrackId) {
    const changed = this.musicTrack !== track;
    this.musicTrack = track;
    if (track === 'none') {
      this.stopMusicLoop();
      this.stopAudioFileTrack(true);
      return;
    }

    const fileTrack = this.getAudioFileMeta();
    if (fileTrack?.audioSrc) {
      this.stopMusicLoop();
      if (changed) {
        this.stopAudioFileTrack(true);
      }
      this.startAudioFileTrack(fileTrack.audioSrc);
      return;
    }

    this.stopAudioFileTrack(true);
    if (changed) {
      this.musicStepIdx = 0;
      this.stopMusicLoop();
    }
    if (this.ctx && !this.isMuted && this.musicTimer === null) {
      this.startMusicLoop();
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
    if (this.musicBusGain && this.ctx) {
      this.musicBusGain.gain.setTargetAtTime(
        muted || !isSynthTrack(this.musicTrack) ? 0 : this.getMusicBusVolume(),
        this.ctx.currentTime,
        0.15,
      );
    }

    const fileTrack = this.getAudioFileMeta();
    if (fileTrack?.audioSrc) {
      if (muted) {
        this.stopAudioFileTrack(false);
      } else {
        this.startAudioFileTrack(fileTrack.audioSrc);
      }
    } else if (
      !muted &&
      this.ctx &&
      isSynthTrack(this.musicTrack) &&
      this.musicTimer === null
    ) {
      this.startMusicLoop();
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

  private getMusicBusVolume(): number {
    return 0.22 * this.masterVolume * this.musicVolume;
  }

  private ensureMusicBus(ctx: AudioContext): GainNode {
    if (!this.musicBusGain || !this.musicFilter) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1750;
      filter.Q.value = 0.7;

      const bus = ctx.createGain();
      bus.gain.setValueAtTime(
        this.isMuted || !isSynthTrack(this.musicTrack)
          ? 0
          : this.getMusicBusVolume(),
        ctx.currentTime,
      );

      filter.connect(bus);
      bus.connect(ctx.destination);
      this.musicFilter = filter;
      this.musicBusGain = bus;
    }
    return this.musicBusGain;
  }

  private scheduleMusicStep() {
    if (
      this.isMuted ||
      !isSynthTrack(this.musicTrack) ||
      !this.ctx ||
      this.ctx.state !== 'running'
    ) {
      return;
    }
    if (typeof document !== 'undefined' && document.hidden) return;

    const pattern = CHILL_PATTERNS[this.musicTrack];
    const ctx = this.ctx;
    this.ensureMusicBus(ctx);
    const dest = this.musicFilter;
    if (!dest) return;

    const step = this.musicStepIdx % pattern.melody.length;
    this.musicStepIdx = (this.musicStepIdx + 1) % pattern.melody.length;

    const now = ctx.currentTime + 0.04;
    const stepSec = pattern.stepMs / 1000;

    // Trigger warm chord + soft bass at the start of every 8-step bar
    if (step % 8 === 0) {
      const barIdx = Math.floor(step / 8) % pattern.chords.length;
      const chord = pattern.chords[barIdx];
      const chordDur = stepSec * 7.6;

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.015);
        g.gain.setValueAtTime(0.0001, now + idx * 0.015);
        g.gain.linearRampToValueAtTime(0.065, now + idx * 0.015 + 0.14);
        g.gain.exponentialRampToValueAtTime(0.0008, now + chordDur);
        osc.connect(g);
        g.connect(dest);
        osc.start(now + idx * 0.015);
        osc.stop(now + chordDur + 0.05);
      });

      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(pattern.bass[barIdx], now);
      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.linearRampToValueAtTime(0.14, now + 0.08);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + chordDur * 0.9);
      bassOsc.connect(bassGain);
      bassGain.connect(dest);
      bassOsc.start(now);
      bassOsc.stop(now + chordDur);
    }

    // Gentle melody pluck
    const melFreq = pattern.melody[step];
    if (melFreq) {
      const mOsc = ctx.createOscillator();
      const mGain = ctx.createGain();
      mOsc.type = pattern.leadWave;
      mOsc.frequency.setValueAtTime(melFreq, now);

      const noteDur = stepSec * 2.1;
      mGain.gain.setValueAtTime(0.0001, now);
      mGain.gain.linearRampToValueAtTime(0.11, now + 0.025);
      mGain.gain.exponentialRampToValueAtTime(0.0008, now + noteDur);

      mOsc.connect(mGain);
      mGain.connect(dest);
      mOsc.start(now);
      mOsc.stop(now + noteDur + 0.04);
    }
  }

  private startMusicLoop() {
    if (!isSynthTrack(this.musicTrack)) return;
    const ctx = this.ensureContext(true);
    if (!ctx) return;
    this.ensureMusicBus(ctx);

    const pattern = CHILL_PATTERNS[this.musicTrack];
    this.scheduleMusicStep();
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
    }
    this.musicTimer = window.setInterval(() => {
      this.scheduleMusicStep();
    }, pattern.stepMs);
  }

  private stopMusicLoop() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicBusGain && this.ctx) {
      this.musicBusGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    }
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
