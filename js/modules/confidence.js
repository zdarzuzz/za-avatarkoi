// Вопрос об уверенности: один раз, после всех анкет, перед раскрытием историй.

import { CONFIDENCE } from '../data/characters.js';
import { getState, update } from './state.js';

export function initConfidence({ onNext }) {
  const list = document.querySelector('[data-confidence]');
  const next = document.querySelector('[data-confidence-next]');
  const render = () => {
    const cur = getState().confidence;
    list.innerHTML = CONFIDENCE.map((c, i) => `
      <button class="choice" type="button" role="radio" data-conf="${c.id}" aria-checked="${cur === c.id}"
        tabindex="${(cur ? cur === c.id : i === 0) ? 0 : -1}"><span class="choice__radio" aria-hidden="true"></span><span>${c.label}</span></button>`).join('');
    next.disabled = !cur;
  };
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-conf]');
    if (!b) return;
    update((s) => { s.confidence = b.dataset.conf; });
    render();
    list.querySelector(`[data-conf="${b.dataset.conf}"]`).focus({ preventScroll: true });
  });
  list.addEventListener('keydown', (e) => {
    const opts = [...list.querySelectorAll('[data-conf]')];
    const i = opts.indexOf(document.activeElement);
    if (i === -1 || !['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const n = (i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + opts.length) % opts.length;
    opts.forEach((o) => { o.tabIndex = -1; }); opts[n].tabIndex = 0; opts[n].focus();
  });
  next.addEventListener('click', () => { if (getState().confidence) onNext(); });
  render();
  return { render };
}
