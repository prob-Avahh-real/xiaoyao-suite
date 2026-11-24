import { buildSuite, SUITE_META } from './suite.js';
import { createSynth } from './synth.js';
import { createWearableInput } from './wearable-input.js';

const suite = buildSuite();
const synth = createSynth();

let index = 0;
let autoAdvance = true;
let inkPhase = 0;

const els = {
  brand: document.getElementById('brand'),
  roman: document.getElementById('roman'),
  title: document.getElementById('mv-title'),
  subtitle: document.getElementById('mv-subtitle'),
  epigraph: document.getElementById('epigraph'),
  mood: document.getElementById('mood'),
  mode: document.getElementById('mode'),
  tempo: document.getElementById('tempo'),
  progress: document.getElementById('progress'),
  dots: document.getElementById('dots'),
  play: document.getElementById('btn-play'),
  prev: document.getElementById('btn-prev'),
  next: document.getElementById('btn-next'),
  wear: document.getElementById('btn-wear'),
  stage: document.getElementById('stage'),
  ink: document.getElementById('ink'),
  hint: document.getElementById('hint'),
};

function movement() {
  return suite[index];
}

function renderDots() {
  els.dots.innerHTML = suite
    .map(
      (m, i) =>
        `<button type="button" class="dot${i === index ? ' on' : ''}" data-i="${i}" aria-label="第${m.roman}乐章 ${m.title}"></button>`
    )
    .join('');
  els.dots.querySelectorAll('.dot').forEach((btn) => {
    btn.addEventListener('click', () => select(+btn.dataset.i));
  });
}

function select(i, { playAfter = false } = {}) {
  const n = suite.length;
  index = ((i % n) + n) % n;
  const m = movement();
  document.documentElement.style.setProperty('--accent', m.color);
  els.roman.textContent = m.roman;
  els.title.textContent = m.title;
  els.subtitle.textContent = m.subtitle;
  els.epigraph.textContent = m.epigraph;
  els.mood.textContent = m.mood;
  els.mode.textContent = m.modeLabel;
  els.tempo.textContent = `♩ = ${m.tempo}`;
  els.stage.dataset.ink = m.ink;
  els.progress.style.width = '0%';
  renderDots();
  if (synth.isPlaying()) {
    synth.stop();
    setPlayLabel(false);
  }
  if (playAfter) playCurrent();
  pulseInk();
}

function setPlayLabel(on) {
  els.play.textContent = on ? '止' : '奏';
  els.play.setAttribute('aria-pressed', on ? 'true' : 'false');
}

function pulseInk() {
  inkPhase = (inkPhase + 1) % 3;
  els.ink.classList.remove('pulse-a', 'pulse-b', 'pulse-c');
  void els.ink.offsetWidth;
  els.ink.classList.add(['pulse-a', 'pulse-b', 'pulse-c'][inkPhase]);
}

function playCurrent() {
  const m = movement();
  synth.warm();
  setPlayLabel(true);
  pulseInk();
  synth.play(m, {
    onProgress: (p) => {
      els.progress.style.width = `${(p * 100).toFixed(1)}%`;
    },
    onNote: () => {
      els.ink.classList.add('note');
      setTimeout(() => els.ink.classList.remove('note'), 180);
    },
    onEnd: () => {
      setPlayLabel(false);
      els.progress.style.width = '100%';
      if (autoAdvance && index < suite.length - 1) {
        select(index + 1, { playAfter: true });
      } else if (autoAdvance && index === suite.length - 1) {
        els.hint.textContent = '组曲终 · 逍遥无待';
      }
    },
  });
}

function togglePlay() {
  if (synth.isPlaying()) {
    synth.stop();
    setPlayLabel(false);
    return;
  }
  playCurrent();
}

function prev() {
  select(index - 1, { playAfter: synth.isPlaying() });
}

function next() {
  select(index + 1, { playAfter: synth.isPlaying() });
}

const wearable = createWearableInput({
  onRingShake: () => togglePlay(),
  onRingTiltLeft: () => prev(),
  onRingTiltRight: () => next(),
  onCaneTap: () => togglePlay(),
  onCaneSwingLeft: () => prev(),
  onCaneSwingRight: () => next(),
});

async function enableWear() {
  synth.warm();
  const ok = await wearable.requestPermission();
  wearable.start();
  els.wear.classList.add('on');
  els.hint.textContent = ok
    ? '戒指甩动奏/止 · 左右倾切章 · 手杖轻点同效'
    : '已开启传感器监听（若无权限请在系统设置允许运动与方向）';
}

els.play.addEventListener('click', () => {
  synth.warm();
  togglePlay();
});
els.prev.addEventListener('click', prev);
els.next.addEventListener('click', next);
els.wear.addEventListener('click', () => enableWear());

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlay();
  } else if (e.code === 'ArrowLeft') prev();
  else if (e.code === 'ArrowRight') next();
});

if (els.brand) {
  els.brand.dataset.meta = SUITE_META.basis;
}

select(0);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
