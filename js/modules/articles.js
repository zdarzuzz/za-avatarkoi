// Статьи: слайдер «В карточке → Впечатление», переворачивающиеся карточки,
// появление при прокрутке, иллюстрация блокнота, кнопка «Далее».

import { COMPARISON_PAIRS, FLIP_CARDS } from '../data/article-examples.js';
import { ILLUSTRATIONS } from '../data/manga-manifest.js';
import { observeReveal, wait } from './animations.js';

let index = 0;

function initCompare() {
  const root = document.querySelector('[data-compare]');
  const card = root.querySelector('[data-compare-card]');
  const impression = root.querySelector('[data-compare-impression]');
  const counter = root.querySelector('[data-compare-index]');

  const show = async (i, animate = true) => {
    index = (i + COMPARISON_PAIRS.length) % COMPARISON_PAIRS.length;
    if (animate) {
      root.classList.add('is-switching');
      await wait(300);
    }
    // две карточки меняются синхронно, как связанная пара
    card.textContent = COMPARISON_PAIRS[index].card;
    impression.textContent = COMPARISON_PAIRS[index].impression;
    counter.textContent = `${index + 1} / ${COMPARISON_PAIRS.length}`;
    root.classList.remove('is-switching');
  };

  root.querySelector('[data-compare-prev]').addEventListener('click', () => show(index - 1));
  root.querySelector('[data-compare-next]').addEventListener('click', () => show(index + 1));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  show(0, false);
}

function initFlipCards() {
  const list = document.querySelector('[data-flip-cards]');
  list.innerHTML = FLIP_CARDS.map(
    (c, i) => `
    <li class="flip-card" data-reveal>
      <button class="flip-card__btn" type="button" aria-pressed="false" aria-describedby="flip-hint" data-flip="${i}">
        <span class="flip-card__inner">
          <span class="flip-card__face flip-card__face--front">
            <span>${c.front}</span>
            <span class="flip-card__tag" aria-hidden="true">одна трактовка ↻</span>
          </span>
          <span class="flip-card__face flip-card__face--back">
            <span>${c.back}</span>
            <span class="flip-card__tag" aria-hidden="true">другая трактовка ↻</span>
          </span>
        </span>
        <span class="visually-hidden" data-flip-live></span>
      </button>
    </li>`
  ).join('');

  // Работает по нажатию, Enter и пробелу (у button это поведение встроено)
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-flip]');
    if (!btn) return;
    const flipped = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(flipped));
    const face = btn.querySelector(flipped ? '.flip-card__face--back' : '.flip-card__face--front');
    btn.querySelector('[data-flip-live]').textContent = flipped ? 'Перевёрнуто' : '';
    btn.setAttribute('aria-label', face.firstElementChild.textContent);
  });
  list.querySelectorAll('[data-flip]').forEach((btn) => {
    btn.setAttribute('aria-label', btn.querySelector('.flip-card__face--front > span').textContent);
  });
}

/** Иллюстрация блокнота: подключается, как только файл отмечен в манифесте. */
function initNotebook() {
  const fig = document.querySelector('[data-notebook]');
  if (!fig || !ILLUSTRATIONS.travelNotebook) return;
  fig.innerHTML = `<img src="${ILLUSTRATIONS.travelNotebook}" alt="Раскрытый блокнот с нарисованным маршрутом поездки и карандашом" loading="lazy" decoding="async">`;
}

export function initArticles({ onNext }) {
  initCompare();
  initFlipCards();
  initNotebook();
  document.querySelector('[data-articles-next]').addEventListener('click', onNext);
}

export const revealArticles = () => observeReveal(document.getElementById('articles'));
