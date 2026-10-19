// Шесть анкет по одной. «Продолжить общение» → опрос о причине, «Пропустить» → сразу дальше.
// Повторные нажатия блокируются, чтобы одну карточку нельзя было обработать дважды.

import { CHARACTERS, REASONS, getReason } from '../data/characters.js';
import { getState, update } from './state.js';
import { wait, reducedMotion } from './animations.js';

const root = () => document.querySelector('[data-selection-root]');
const counter = () => document.querySelector('[data-selection-counter]');

let busy = false;
let onComplete = () => {};

const imgVars = (box) =>
  `--l:${box.l}%;--t:${box.t}%;--w:${box.w}%;--h:${box.h}%`;

function profileTemplate(c) {
  return `
    <article class="profile" data-profile="${c.id}" aria-labelledby="profile-name-${c.id}">
      <div class="profile__portrait">
        <div class="profile__oval${c.flip ? ' profile__oval--flip' : ''}">
          <img src="${c.portrait}" alt="Аватар: ${c.id === 'varya' ? 'рисованный пушистый зверёк' : `портрет ${c.forms.gen}`}" style="${imgVars(c.profileImg)}" decoding="async">
        </div>
        <img class="profile__frame" src="assets/images/decorations/frame-ornate.webp" alt="" aria-hidden="true" width="585" height="779" decoding="async">
      </div>
      <img class="log-mark profile__log" src="assets/images/decorations/log.webp" alt="" aria-hidden="true" width="198" height="196">
      <div class="profile__body">
        <h3 class="profile__name" id="profile-name-${c.id}">${c.name}, ${c.ageLabel}</h3>
        <p class="profile__bio">${c.bio}</p>
        <p class="profile__interests">Интересы: ${c.interests}</p>
        <div class="profile__actions">
          <button class="btn-plaque btn-plaque--fill btn-plaque--ui" type="button" data-action="continue"><span>Продолжить общение</span></button>
          <button class="btn-plaque btn-plaque--ui" type="button" data-action="skip"><span>Пропустить</span></button>
        </div>
        <div class="poll is-hidden" data-poll hidden role="group" aria-labelledby="poll-title-${c.id}">
          <h4 class="poll__title" id="poll-title-${c.id}">Что больше всего повлияло на твой выбор?</h4>
          <div class="poll__options" role="radiogroup" aria-labelledby="poll-title-${c.id}">
            ${REASONS.map(
              (r, i) => `
              <button class="poll__option" type="button" role="radio" aria-checked="false" tabindex="${i === 0 ? 0 : -1}" data-reason="${r.id}">
                <span class="poll__radio" aria-hidden="true"></span><span>${r.label}</span>
              </button>`
            ).join('')}
          </div>
          <p class="poll__thanks" data-poll-thanks aria-live="polite"></p>
        </div>
      </div>
    </article>`;
}

function setCounter(index) {
  const el = counter();
  if (!el) return;
  el.textContent = index < CHARACTERS.length ? `Анкета ${index + 1} из ${CHARACTERS.length}` : '';
}

function bindProfile(card, c) {
  const actions = card.querySelectorAll('[data-action]');
  const poll = card.querySelector('[data-poll]');
  const options = [...card.querySelectorAll('[data-reason]')];

  const lockActions = () => actions.forEach((b) => { b.disabled = true; });

  async function openPoll({ instant = false } = {}) {
    lockActions();
    card.querySelector('[data-action="continue"]').setAttribute('aria-pressed', 'true');
    poll.hidden = false;
    if (!instant) await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    poll.classList.remove('is-hidden');
    options[0].focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 600px)').matches) poll.scrollTop = 0;
  }

  card.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled || busy) return;

    if (btn.dataset.action === 'continue') {
      busy = true;
      update((s) => { s.initial[c.id] = 'continue'; });
      await openPoll();
      busy = false;
      return;
    }

    if (btn.dataset.action === 'skip') {
      busy = true;
      lockActions();
      btn.setAttribute('aria-pressed', 'true');
      update((s) => {
        s.initial[c.id] = 'skip';
        delete s.reasons[c.id];
        s.profileIndex += 1;
      });
      await wait(260);
      await advance(card);
      busy = false;
      return;
    }

    if (btn.dataset.reason) {
      if (getState().reasons[c.id]) return; // уже записано
      busy = true;
      options.forEach((o) => {
        o.setAttribute('aria-checked', String(o === btn));
        o.disabled = o !== btn;
      });
      const reason = getReason(btn.dataset.reason);
      card.querySelector('[data-poll-thanks]').textContent = `Записали: «${reason.label}». Дальше — следующая анкета`;
      update((s) => {
        s.reasons[c.id] = reason.id;
        s.profileIndex += 1;
      });
      await wait(900);
      await advance(card);
      busy = false;
    }
  });

  // Навигация стрелками внутри группы radio
  poll.addEventListener('keydown', (e) => {
    const i = options.indexOf(document.activeElement);
    if (i === -1) return;
    let next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = options[(i + 1) % options.length];
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = options[(i - 1 + options.length) % options.length];
    if (e.key === 'Home') next = options[0];
    if (e.key === 'End') next = options[options.length - 1];
    if (next) {
      e.preventDefault();
      options.forEach((o) => { o.tabIndex = -1; });
      next.tabIndex = 0;
      next.focus();
    }
  });

  // Восстановление: выбор «продолжить» сохранён, а причина ещё нет — сразу показываем опрос
  const s = getState();
  if (s.initial[c.id] === 'continue' && !s.reasons[c.id]) openPoll({ instant: true });
}

async function advance(card) {
  card.classList.add('is-leaving');
  await wait(reducedMotion() ? 0 : 420);
  render({ animate: true, focus: true });
}

export function render({ animate = false, focus = false } = {}) {
  const el = root();
  if (!el) return;
  const { profileIndex } = getState();
  setCounter(profileIndex);
  const done = document.querySelector('[data-selection-done]');

  if (profileIndex >= CHARACTERS.length) {
    el.innerHTML = '';
    done.hidden = false;
    onComplete({ scroll: focus });
    return;
  }
  done.hidden = true;
  const c = CHARACTERS[profileIndex];
  el.innerHTML = profileTemplate(c);
  const card = el.firstElementChild;
  if (animate && !reducedMotion()) {
    card.classList.add('is-entering');
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('is-entering')));
  }
  bindProfile(card, c);
  if (focus && !card.querySelector('[data-poll]:not([hidden])')) {
    card.querySelector('[data-action="continue"]').focus({ preventScroll: true });
    const top = card.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.4) {
      card.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
  }
}

export function initSelection({ onDone }) {
  onComplete = onDone;
  document.querySelector('[data-go-stories]')?.addEventListener('click', () => onDone({ scroll: true }));
  render();
}
