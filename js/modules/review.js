// Финальный пересмотр: шесть сокращённых анкет, неизменный первый выбор и текущее итоговое решение.
// Баллы не считаются, «правильность» выбора не оценивается.

import { getCharacter, CONFIDENCE } from '../data/characters.js';
import { getStory } from '../data/stories.js';
import { getState, update, finalDecision } from './state.js';

const ICONS = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  cross: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5"/></svg>',
};

const imgVars = (box) => `--l:${box.l}%;--t:${box.t}%;--w:${box.w}%;--h:${box.h}%`;
const word = (v) => (v === 'continue' ? 'продолжить' : v === 'skip' ? 'пропустить' : 'не выбран');
const nowText = (v, first) => {
  const base = v === 'continue' ? 'Сейчас: продолжить общение' : v === 'skip' ? 'Сейчас: отказаться' : 'Сейчас: решение не выбрано';
  return v === first ? `${base} — как в начале` : `${base} — решение изменилось`;
};

let handlers = { onOpenStory: () => {} };

// Порядок карточек как во фрейме MacBook Air 17: Соня | Алина / Даня | Марк / Варя | Ника
const ORDER = ['sonya', 'alina', 'danya', 'mark', 'varya', 'nika'];

function cardTemplate(c, s) {
  const fin = finalDecision(c.id, s);
  const first = s.initial[c.id];
  // внешность Марка видна только после его истории
  const showFace = !c.anonymous || s.viewed.includes(c.id);
  const src = showFace && c.anonymous ? c.revealIcon : c.icon;
  const box = showFace && c.anonymous ? c.revealIconImg : c.iconImg;
  const hasStory = Boolean(getStory(s.situationId, c.id));
  return `
    <li class="review-card" id="review-${c.id}" data-review="${c.id}" aria-labelledby="review-name-${c.id}">
      <span class="avatar${c.flip ? ' avatar--flip' : ''}">
        <img src="${src}" alt="" style="${imgVars(box)}" width="200" height="266" loading="lazy" decoding="async">
      </span>
      <div class="review-card__body">
        <h3 class="review-card__name" id="review-name-${c.id}">${c.name}, ${c.ageLabel}</h3>
        <p class="review-card__first">Первый выбор: <b>${word(first)}</b></p>
        <p class="review-card__now${fin !== first ? ' is-changed' : ''}" data-now aria-live="polite">${nowText(fin, first)}</p>
        <div class="review-card__controls" role="group" aria-label="Итоговое решение: ${c.name}">
          <button class="round-btn" type="button" data-final="continue" aria-pressed="${fin === 'continue'}" aria-label="Продолжить общение с ${c.forms.ins}">${ICONS.check}</button>
          <button class="round-btn" type="button" data-final="skip" aria-pressed="${fin === 'skip'}" aria-label="Отказаться от общения с ${c.forms.ins}">${ICONS.cross}</button>
          ${hasStory ? `<button class="round-btn round-btn--dark" type="button" data-open="${c.id}" aria-label="Открыть историю: ${c.name}">${ICONS.arrow}</button>` : ''}
        </div>
      </div>
    </li>`;
}

export function renderReview() {
  const s = getState();
  document.querySelector('[data-review-grid]').innerHTML = ORDER.map((id) => cardTemplate(getCharacter(id), s)).join('');
  const conf = CONFIDENCE.find((c) => c.id === s.confidence);
  document.querySelector('[data-review-confidence]').textContent = conf ? `Уверенность в первых впечатлениях перед историями: «${conf.label}».` : '';
}

function syncCard(id) {
  const card = document.querySelector(`[data-review="${id}"]`);
  if (!card) return;
  const fin = finalDecision(id);
  const first = getState().initial[id];
  card.querySelectorAll('[data-final]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.final === fin)));
  const now = card.querySelector('[data-now]');
  now.textContent = nowText(fin, first);
  now.classList.toggle('is-changed', fin !== first);
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
