/**
 * SoundEngine.ts
 * Procedural audio generation for scheduling events.
 */

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
  }

  public playClick() {
    if (this.isMuted) return;
    this.init();
    const ctx = this.audioCtx!;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  public playWhir(duration: number = 0.5) {
    if (this.isMuted) return;
    this.init();
    const ctx = this.audioCtx!;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  public playContextSwitch() {
    if (this.isMuted) return;
    this.init();
    const ctx = this.audioCtx!;
    
    // Quick double click
    this.playClick();
    setTimeout(() => this.playClick(), 50);
  }
}

export const soundEngine = new SoundEngine();
