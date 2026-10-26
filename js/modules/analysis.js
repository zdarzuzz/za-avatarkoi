// Психологический разбор: переворачивающиеся карточки.

import { FLIP_CARDS } from '../data/article-examples.js';

// Иллюстрация блокнота стоит прямо в разметке (index.html), с отложенной загрузкой.

function initFlipCards() {
  const list = document.querySelector('[data-flip-cards]');
  list.innerHTML = FLIP_CARDS.map((c, i) => `
    <li class="flip-card" data-reveal>
      <button class="flip-card__btn" type="button" aria-pressed="false" aria-describedby="flip-hint" data-flip="${i}" aria-label="${c.front}">
        <span class="flip-card__inner">
          <span class="flip-card__face flip-card__face--front"><span>${c.front}</span><span class="flip-card__tag" aria-hidden="true">одна трактовка ↻</span></span>
          <span class="flip-card__face flip-card__face--back"><span>${c.back}</span><span class="flip-card__tag" aria-hidden="true">другая трактовка ↻</span></span>
        </span>
      </button>
    </li>`).join('');
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-flip]');
    if (!btn) return;
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', FLIP_CARDS[btn.dataset.flip][on ? 'back' : 'front']);
  });
}


export function initAnalysis({ onReview, onBack }) {
  initFlipCards();
  document.querySelector('[data-open-review]').addEventListener('click', onReview);
  document.querySelector('[data-back-observations]').addEventListener('click', onBack);
}
export const onAnalysisOpen = () => {};
