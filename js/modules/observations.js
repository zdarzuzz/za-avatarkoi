// «А что добавил ты?» — слайдер пар «В карточке → Впечатление» (две карточки меняются синхронно).

import { COMPARISON_PAIRS } from '../data/article-examples.js';
import { wait } from './animations.js';

export function initObservations({ onAnalysis }) {
  const root = document.querySelector('[data-compare]');
  const card = root.querySelector('[data-compare-card]');
  const imp = root.querySelector('[data-compare-impression]');
  const idx = root.querySelector('[data-compare-index]');
  let index = 0;
  const show = async (i, animate = true) => {
    index = (i + COMPARISON_PAIRS.length) % COMPARISON_PAIRS.length;
    if (animate) { root.classList.add('is-switching'); await wait(300); }
    card.textContent = COMPARISON_PAIRS[index].card;
    imp.textContent = COMPARISON_PAIRS[index].impression;
    idx.textContent = `${index + 1} / ${COMPARISON_PAIRS.length}`;
    root.classList.remove('is-switching');
  };
  root.querySelector('[data-compare-prev]').addEventListener('click', () => show(index - 1));
  root.querySelector('[data-compare-next]').addEventListener('click', () => show(index + 1));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  show(0, false);
  document.querySelector('[data-open-analysis]').addEventListener('click', onAnalysis);
}
