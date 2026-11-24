/**
 * Web Audio — 古琴气息 + 笛色泛音
 */

export function createSynth() {
  let ctx = null;
  let master = null;
  let playing = false;
  let timerIds = [];
  let current = null;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.52;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function playTone(midi, when, duration, velocity = 0.32, kind = 'pluck') {
    const c = ensureCtx();
    const freq = midiToFreq(midi);
    const osc = c.createOscillator();
    const osc2 = c.createOscillator();
    const gain = c.createGain();
    const gain2 = c.createGain();
    const filter = c.createBiquadFilter();

    const breath = kind === 'breath';
    osc.type = breath ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    osc2.type = 'sine';
    osc2.frequency.value = freq * (breath ? 2.005 : 2);
    gain2.gain.value = breath ? 0.07 : 0.11;

    filter.type = 'lowpass';
    filter.frequency.value = breath ? 1400 : 2600;
    filter.Q.value = breath ? 0.4 : 0.75;

    const attack = breath ? 0.12 : 0.015;
    const release = Math.min(breath ? 0.8 : 0.4, duration * 0.45);
    const peak = velocity;

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + attack);
    gain.gain.exponentialRampToValueAtTime(peak * (breath ? 0.7 : 0.5), when + duration * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration + release);

    osc.connect(filter);
    osc2.connect(gain2);
    gain2.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.start(when);
    osc2.start(when);
    osc.stop(when + duration + release + 0.05);
    osc2.stop(when + duration + release + 0.05);
  }

  function clearTimers() {
    for (const id of timerIds) clearTimeout(id);
    timerIds = [];
  }

  function stop() {
    clearTimers();
    playing = false;
    current = null;
    if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
      master.gain.linearRampToValueAtTime(0.0001, now + 0.1);
      const id = setTimeout(() => {
        if (master && ctx) master.gain.setValueAtTime(0.52, ctx.currentTime);
      }, 140);
      timerIds.push(id);
    }
  }

  /**
   * @param {import('./suite.js').Movement} movement
   * @param {{ onNote?: Function, onEnd?: Function, onProgress?: Function }} [hooks]
   */
  function play(movement, hooks = {}) {
    if (!movement?.melody?.length) return;
    stop();
    ensureCtx();
    master.gain.setValueAtTime(0.52, ctx.currentTime);

    playing = true;
    current = movement;

    const beatSec = 60 / movement.tempo;
    const t0 = ctx.currentTime + 0.06;
    const kind = movement.kind || 'pluck';

    for (const d of movement.drones || []) {
      playTone(d.midi, t0, movement.durationSec * 0.96, d.velocity ?? 0.1, 'breath');
    }

    for (const note of movement.melody) {
      const when = t0 + note.beat * beatSec;
      const dur = Math.max(0.1, note.duration * beatSec * 0.9);
      const vel = kind === 'breath' ? 0.28 : 0.34;
      playTone(note.midi, when, dur, vel, kind);

      if (hooks.onNote) {
        const delay = Math.max(0, (when - ctx.currentTime) * 1000);
        const id = setTimeout(() => {
          if (playing && current === movement) hooks.onNote(note);
        }, delay);
        timerIds.push(id);
      }
    }

    if (hooks.onProgress) {
      const steps = Math.ceil(movement.durationSec * 10);
      for (let i = 0; i <= steps; i++) {
        const id = setTimeout(() => {
          if (playing && current === movement) {
            hooks.onProgress(Math.min(1, i / steps));
          }
        }, 60 + (i / 10) * 1000);
        timerIds.push(id);
      }
    }

    const endId = setTimeout(() => {
      if (!playing || current !== movement) return;
      playing = false;
      current = null;
      hooks.onEnd?.();
    }, (movement.durationSec + 0.4) * 1000);
    timerIds.push(endId);
  }

  function isPlaying() {
    return playing;
  }

  function getCurrent() {
    return current;
  }

  function warm() {
    ensureCtx();
  }

  return { play, stop, isPlaying, getCurrent, warm, ensureCtx };
}
