// Психологический разбор: переворачивающиеся карточки и иллюстрация блокнота (если файл добавлен).

import { FLIP_CARDS } from '../data/article-examples.js';

// Иллюстрация блокнота. Файла пока нет в проекте, поэтому блок не показывается — без заглушек
// и без запроса к несуществующему файлу. Когда положишь assets/images/illustrations/travel-notebook.png,
// поменяй ready на true.
const NOTEBOOK = {
  ready: false,
  src: 'assets/images/illustrations/travel-notebook.png',
  alt: 'Раскрытый блокнот с нарисованным маршрутом поездки и карандашом',
};

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

function initNotebook() {
  const fig = document.querySelector('[data-notebook]');
  const probe = new Image();
  probe.onload = () => {
    fig.innerHTML = `<img src="${NOTEBOOK.src}" alt="${NOTEBOOK.alt}" width="${probe.naturalWidth}" height="${probe.naturalHeight}" loading="lazy" decoding="async">`;
    fig.style.aspectRatio = `${probe.naturalWidth} / ${probe.naturalHeight}`;
    fig.hidden = false;
  };
  // проверяем наличие только при открытии разбора, чтобы не грузить файл заранее
  fig.dataset.src = NOTEBOOK.src;
  return () => { if (NOTEBOOK.ready && !fig.dataset.checked) { fig.dataset.checked = '1'; probe.src = NOTEBOOK.src; } };
}

let checkNotebook = () => {};
export function initAnalysis({ onReview, onBack }) {
  initFlipCards();
  checkNotebook = initNotebook();
  document.querySelector('[data-open-review]').addEventListener('click', onReview);
  document.querySelector('[data-back-observations]').addEventListener('click', onBack);
}
export const onAnalysisOpen = () => checkNotebook();
