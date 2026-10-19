// Финальный пересмотр: шесть сокращённых анкет, неизменный первый выбор и текущее итоговое решение.
// Баллы не считаются, «правильность» выбора не оценивается.

import { getCharacter } from '../data/characters.js';
import { getState, update, finalDecision } from './state.js';

const ICONS = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  cross: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5"/></svg>',
};

const imgVars = (box) => `--l:${box.l}%;--t:${box.t}%;--w:${box.w}%;--h:${box.h}%`;
const word = (v) => (v === 'continue' ? 'продолжить' : v === 'skip' ? 'пропустить' : 'не выбран');
const nowText = (v) =>
  v === 'continue' ? 'Сейчас: продолжить общение' : v === 'skip' ? 'Сейчас: отказаться' : 'Сейчас: решение не выбрано';

let handlers = { onOpenStory: () => {} };

// Порядок карточек как во фрейме MacBook Air 17: Соня | Алина / Даня | Марк / Варя | Ника
const ORDER = ['sonya', 'alina', 'danya', 'mark', 'varya', 'nika'];

function cardTemplate(c, s) {
  const fin = finalDecision(c.id, s);
  return `
    <li class="review-card" id="review-${c.id}" data-review="${c.id}" aria-labelledby="review-name-${c.id}">
      <span class="avatar${c.flip ? ' avatar--flip' : ''}">
        <img src="${c.icon}" alt="" style="${imgVars(c.iconImg)}" loading="lazy" decoding="async">
      </span>
      <div class="review-card__body">
        <h3 class="review-card__name" id="review-name-${c.id}">${c.name}, ${c.ageLabel}</h3>
        <p class="review-card__first">Первый выбор: <b>${word(s.initial[c.id])}</b></p>
        <p class="review-card__now" data-now aria-live="polite">${nowText(fin)}</p>
        <div class="review-card__controls" role="group" aria-label="Итоговое решение: ${c.name}">
          <button class="round-btn" type="button" data-final="continue" aria-pressed="${fin === 'continue'}" aria-label="Продолжить общение с ${c.forms.ins}">${ICONS.check}</button>
          <button class="round-btn" type="button" data-final="skip" aria-pressed="${fin === 'skip'}" aria-label="Отказаться от общения с ${c.forms.ins}">${ICONS.cross}</button>
          <button class="round-btn round-btn--dark" type="button" data-open="${c.id}" aria-label="Открыть историю: ${c.name}">${ICONS.arrow}</button>
        </div>
      </div>
    </li>`;
}

export function renderReview() {
  const s = getState();
  document.querySelector('[data-review-grid]').innerHTML = ORDER.map((id) => cardTemplate(getCharacter(id), s)).join('');
}

function syncCard(id) {
  const card = document.querySelector(`[data-review="${id}"]`);
  if (!card) return;
  const fin = finalDecision(id);
  card.querySelectorAll('[data-final]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.final === fin)));
  card.querySelector('[data-now]').textContent = nowText(fin);
}

export function initReview(h) {
  handlers = { ...handlers, ...h };
  const grid = document.querySelector('[data-review-grid]');
  grid.addEventListener('click', (e) => {
    const fin = e.target.closest('[data-final]');
    if (fin) {
      const id = fin.closest('[data-review]').dataset.review;
      const value = fin.dataset.final;
      // повторное нажатие на выбранную кнопку снимает выбор
      const next = finalDecision(id) === value ? null : value;
      update((s) => { s.final[id] = next; });
      syncCard(id);
      return;
    }
    const open = e.target.closest('[data-open]');
    if (open) handlers.onOpenStory(open.dataset.open);
  });
}

export function focusCard(id) {
  const card = document.getElementById(`review-${id}`);
  if (!card) return false;
  card.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  card.querySelector('[data-open]')?.focus({ preventScroll: true });
  card.classList.remove('is-flash');
  void card.offsetWidth;
  card.classList.add('is-flash');
  return true;
}

export { getCharacter };
