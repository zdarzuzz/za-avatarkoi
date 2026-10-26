// Режиссура чтения по прокрутке.
//  [data-reveal] — блок плавно появляется, когда входит в экран.
//  [data-type]   — абзац «печатается» словами в прямой зависимости от прокрутки:
//                  быстрее листаешь — быстрее раскрывается, остановился — стоит, назад — остаётся видимым.
//  [data-pin]   — большой текстовый блок закрепляется у верха экрана, пока его слова не раскроются
//                  по прокрутке: сначала первая колонка, затем вторая; потом блок уезжает дальше.
// Полный текст всё время в DOM (копирование, поиск, скринридер); меняется только прозрачность слов,
// поэтому место зарезервировано и ничего не прыгает.

import { reducedMotion } from './animations.js';

const items = new Set();
let ticking = false;
let bound = false;

function split(el) {
  if (el.dataset.typeReady) return;
  el.dataset.typeReady = '1';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const parts = node.textContent.split(/(\s+)/);
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.append(part); continue; }
      const w = document.createElement('span');
      w.className = 'type-w';
      w.textContent = part;
      frag.append(w);
    }
    node.replaceWith(frag);
  }
  const words = [...el.querySelectorAll('.type-w')];
  items.add({ el, words, shown: 0, pinned: Boolean(el.closest('[data-pin]')) });
}

/* ───── Закреплённые блоки ───── */
const pins = [];

function setupPin(el) {
  if (el.dataset.pinReady) return;
  el.dataset.pinReady = '1';
  const wrap = document.createElement('div');
  wrap.className = 'pin';
  el.before(wrap);
  wrap.append(el);
  el.classList.add('pin__sticky');
  pins.push({ wrap, el, words: null, shown: 0, dist: 0, top: 0, h: 0, off: false });
}

function measurePin(pin) {
  const vh = window.innerHeight;
  pin.words = [...pin.el.querySelectorAll('.type-w')];
  pin.h = pin.el.offsetHeight;
  pin.off = !pin.words.length;
  // высокий блок закрепляется нижним краем: он целиком прокручивается в экран и стоит, пока раскрываются слова
  pin.dist = pin.off ? 0 : Math.round(Math.min(vh * 1.6, Math.max(vh * 0.6, pin.words.length * 6)));
  const room = vh * 0.88 - 72;
  pin.top = pin.h <= room ? Math.max(72, vh * 0.12) : vh - pin.h - 32;   // обычно — у верха экрана
  pin.el.style.top = `${Math.round(pin.top)}px`;
  // высота обёртки = блок + путь закрепления (липкий элемент ходит только внутри контентной области)
  pin.wrap.style.height = pin.off ? "" : `${pin.h + pin.dist}px`;
  pin.el.classList.toggle('pin__sticky--off', pin.off);
}

function tickPins() {
  for (const pin of pins) {
    if (!pin.el.isConnected || pin.el.offsetParent === null) continue;
    if (!pin.words || pin.h !== pin.el.offsetHeight) measurePin(pin);
    if (pin.off) {
      // запасной путь — как у обычного абзаца
      const r = pin.el.getBoundingClientRect(); const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.88 - r.top) / (vh * 0.88 - (vh * 0.3 - r.height * 0.5))));
      reveal(pin, p);
      continue;
    }
    const r = pin.wrap.getBoundingClientRect();
    // до закрепления блок уже начинает проявляться, основное — пока он стоит
    const lead = window.innerHeight * 0.35;
    const p = Math.min(1, Math.max(0, (pin.top + lead - r.top) / (pin.dist + lead)));
    reveal(pin, p);
  }
}

function reveal(pin, p) {
  const target = Math.ceil(p * pin.words.length);
  if (target > pin.shown) {
    for (let i = pin.shown; i < target; i += 1) pin.words[i].classList.add('is-on');
    pin.shown = target;
  }
}

function tick() {
  ticking = false;
  const vh = window.innerHeight;
  tickPins();
  for (const item of items) {
    if (item.pinned) continue;
    if (!item.el.isConnected || item.el.offsetParent === null) continue;
    if (item.shown >= item.words.length) continue;
    const r = item.el.getBoundingClientRect();
    // раскрытие идёт, пока абзац проходит от низа экрана (88 %) до его середины (45 %)
    const start = vh * 0.88;
    const end = vh * 0.45 - r.height * 0.6;
    const p = Math.min(1, Math.max(0, (start - r.top) / (start - end)));
    const target = Math.ceil(p * item.words.length);
    if (target > item.shown) {
      for (let i = item.shown; i < target; i += 1) item.words[i].classList.add('is-on');
      item.shown = target;
    }
  }
}

const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };

export function initTyping(root = document) {
  if (reducedMotion()) return;          // текст сразу виден целиком
  root.querySelectorAll('[data-type]').forEach(split);
  root.querySelectorAll('[data-pin]').forEach(setupPin);
  if (!bound) {
    bound = true;
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', () => { pins.forEach((p) => { p.words = null; }); request(); });
  }
  request();
}

export const refreshTyping = request;

/** Плавное появление [data-reveal] с короткой задержкой внутри группы. */
export function initReveal(root = document) {
  const els = root.querySelectorAll('[data-reveal]:not(.is-visible)');
  if (reducedMotion() || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-visible')); return; }
  const io = new IntersectionObserver((entries) => {
    let i = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      if (!el.hasAttribute('data-pause')) el.style.transitionDelay = `${Math.min(i * 0.12, 0.36)}s`;
      el.classList.add('is-visible');
      io.unobserve(el);
      i += 1;
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
  els.forEach((e) => io.observe(e));
}
