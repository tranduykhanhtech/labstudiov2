/**
 * Sound synthesis engine using browser Web Audio API
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Initialized lazily on first user interaction
  }

  private initCtx() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public toggle(): boolean {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  // 1. Packet arrival / ping success: pleasant melodic chime
  public playPingSuccess() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.1); // A5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 2. Packet drop / error: subtle low alert buzzer
  public playError() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.2);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // 3. Cable crimp action: crisp mechanical click/snap
  public playCrimpSnap() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // High snap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    // Mechanical click body
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(180, now + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(60, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.12);
  }

  // 4. Tester LED step tick
  public playTesterTick(isSuccess: boolean = true) {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isSuccess ? 1046.5 : 330, now); // C6 or E4

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 5. Terminal keystroke
  public playKeyClick() {
    if (!this.soundEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, now);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }
}

export const sound = new SoundEngine();
