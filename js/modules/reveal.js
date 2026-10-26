// Режиссура чтения по прокрутке.
//  [data-reveal] — блок плавно появляется, когда входит в экран.
//  [data-type]   — абзац «печатается» словами в прямой зависимости от прокрутки:
//                  быстрее листаешь — быстрее раскрывается, остановился — стоит, назад — остаётся видимым.
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
  items.add({ el, words, shown: 0 });
}

function tick() {
  ticking = false;
  const vh = window.innerHeight;
  for (const item of items) {
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
  if (!bound) {
    bound = true;
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
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
