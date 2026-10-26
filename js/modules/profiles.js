// Анкеты — слайдер (MacBook Air 18–19).
// В центре активная анкета, по бокам пустые приглушённые рамки (информацию следующего человека не раскрываем).
// Решение: кнопки «Пропустить» / «Продолжить», свайп влево / вправо, стрелки ← / → на клавиатуре.
// После решения в той же анкете появляется вопрос о причине; после ответа анкета сама улетает
// в сторону решения (вправо — продолжить, влево — пропустить). После двух анкет можно пропустить остальные.

import { CHARACTERS, getCharacter, reasonsFor, getReason } from '../data/characters.js';
import { getState, update } from './state.js';
import { wait, reducedMotion } from './animations.js';

const SWIPE_MIN = 80;     // px — порог свайпа
const LOCK_MIN = 14;      // px — с какого смещения решаем, горизонтальный ли жест

let busy = false;
let onDone = () => {};
let autoTimer = 0;
const AUTO_DELAY = 750;   // мс — выбранный ответ успевает подсветиться, затем анкета улетает

const $ = (s) => document.querySelector(s);
const imgVars = (b) => `--l:${b.l}%;--t:${b.t}%;--w:${b.w}%;--h:${b.h}%`;

function cardTemplate(c, pending) {
  const choice = pending?.choice;
  const reasons = reasonsFor(c);
  const label = choice === 'skip' ? 'Пропустить' : 'Продолжить';
  const q = choice === 'skip' ? 'Что больше всего повлияло на&nbsp;решение пропустить?' : 'Что больше всего повлияло на&nbsp;твой выбор?';
  return `
  <article class="card${choice ? ' is-deciding' : ''}" data-card="${c.id}" tabindex="0"
    aria-labelledby="card-name-${c.id}" aria-describedby="card-help">
    <div class="card__portrait" data-swipe>
      <div class="card__oval${c.flip ? ' card__oval--flip' : ''}">
        <img src="${c.portrait}" alt="${c.anonymous ? 'Аватар без фотографии' : c.id === 'varya' ? 'Аватар: рисованный пушистый зверёк — не она сама' : `Аватар: ${c.name}`}"
          style="${imgVars(c.profileImg)}" width="400" height="533" decoding="async" draggable="false">
      </div>
      <img class="card__frame" src="assets/images/decorations/frame-ornate.webp" alt="" aria-hidden="true" width="1086" height="1448" decoding="async" draggable="false">
    </div>

    <div class="card__actions">
      ${choice
        ? `<button class="btn-plaque btn-plaque--fill card__confirm" type="button" data-confirm ${pending.reason ? '' : 'disabled'}><span>${label}</span></button>`
        : `<button class="btn-plaque" type="button" data-decide="skip"><span>Пропустить</span></button>
           <button class="btn-plaque btn-plaque--fill" type="button" data-decide="continue"><span>Продолжить</span></button>`}
    </div>

    <div class="card__info">
      <h3 class="card__name" id="card-name-${c.id}">${c.name}, ${c.ageLabel}</h3>
      <p class="card__interests">Интересы: ${c.interests}</p>
      <p class="card__bio">${c.bio}</p>
    </div>

    <div class="card__reason" ${choice ? '' : 'hidden'} data-reason-block>
      <h4 class="h-question" id="reason-q-${c.id}">${q}</h4>
      <div class="choice-list" role="radiogroup" aria-labelledby="reason-q-${c.id}">
        ${reasons.map((r, i) => `
          <button class="choice" type="button" role="radio" data-reason="${r.id}"
            aria-checked="${pending?.reason === r.id}" tabindex="${(pending?.reason ? pending.reason === r.id : i === 0) ? 0 : -1}">
            <span class="choice__radio" aria-hidden="true"></span><span>${r.label}</span>
          </button>`).join('')}
      </div>
      <p class="card__reason-note" aria-live="polite">${pending?.reason ? `Выбрано: «${getReason(pending.reason).label}».` : 'Выбери вариант — анкета перелистнётся сама.'}</p>
      <button class="text-link card__undo" type="button" data-undo>Изменить решение</button>
    </div>
  </article>`;
}

function setGhosts(index) {
  $('.slider__ghost--prev').toggleAttribute('data-empty', index === 0);
  $('.slider__ghost--next').toggleAttribute('data-empty', index >= CHARACTERS.length - 1);
}

export function renderProfiles({ animate = false, from = 'right' } = {}) {
  const s = getState();
  const track = $('[data-slider-track]');
  const counter = $('[data-profile-counter]');
  $('#profiles').classList.toggle('is-done', s.profileIndex >= CHARACTERS.length);
  renderProgress(s);
  if (s.profileIndex >= CHARACTERS.length) {
    const seen = Object.keys(s.initial).length;
    track.innerHTML = `<p class="profiles__done body-text body-text--ink">${seen === CHARACTERS.length ? 'Все шесть анкет просмотрены.' : `Просмотрено анкет: ${seen} из ${CHARACTERS.length}.`}</p>`;
    counter.textContent = '';
    setGhosts(CHARACTERS.length);
    return;
  }
  const c = CHARACTERS[s.profileIndex];
  const pending = s.pending?.id === c.id ? s.pending : null;
  counter.textContent = `Анкета ${s.profileIndex + 1} из ${CHARACTERS.length}`;
  track.innerHTML = cardTemplate(c, pending);
  setGhosts(s.profileIndex);
  const card = track.firstElementChild;
  if (animate && !reducedMotion()) {
    card.classList.add(from === 'left' ? 'is-out-left' : 'is-in');
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('is-in', 'is-out-left')));
  }
  bindSwipe(card);
}

/** Счётчик внизу блока: точки и «N из 6»; после двух анкет — тихая ссылка «пропустить остальные». */
function renderProgress(s) {
  const box = $('[data-profiles-progress]');
  if (!box) return;
  const done = Object.keys(s.initial).length;
  const total = CHARACTERS.length;
  const finished = s.profileIndex >= total;
  const dots = CHARACTERS.map((c, i) => `<span class="progress-dot${s.initial[c.id] ? ' is-done' : i === s.profileIndex ? ' is-current' : ''}"></span>`).join('');
  const canSkip = !finished && done >= 2 && !s.pending;
  box.innerHTML = finished ? '' : `
    <p class="profiles__count"><span class="profiles__dots" aria-hidden="true">${dots}</span>
      <span>Пройдено анкет: <b>${done}</b> из ${total}</span></p>
    ${canSkip ? '<button class="profiles__skip-rest" type="button" data-skip-rest>Пропустить остальные анкеты <span aria-hidden="true">→</span></button>' : ''}`;
}

async function skipRest() {
  if (busy) return;
  busy = true;
  clearTimeout(autoTimer);
  update((st) => { st.pending = null; st.profilesSkipped = true; st.profileIndex = CHARACTERS.length; });
  renderProfiles();
  onDone();
  await wait(200);
  busy = false;
}

function focusFirst(card, sel) {
  const el = card.querySelector(sel);
  el?.focus({ preventScroll: true });
}

async function decide(choice) {
  const s = getState();
  if (busy || s.pending || s.profileIndex >= CHARACTERS.length) return;
  busy = true;
  const c = CHARACTERS[s.profileIndex];
  update((st) => { st.pending = { id: c.id, choice, reason: null }; });
  renderProfiles();
  const card = $('[data-card]');
  const block = card.querySelector('[data-reason-block]');
  // вопрос появляется прямо в анкете — переводим к нему взгляд и фокус
  block.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
  focusFirst(card, '[data-reason][tabindex="0"]');
  await wait(350);
  busy = false;
}

function pickReason(btn) {
  const s = getState();
  if (!s.pending) return;
  update((st) => { st.pending.reason = btn.dataset.reason; });
  const card = btn.closest('[data-card]');
  card.querySelectorAll('[data-reason]').forEach((o) => {
    const on = o === btn;
    o.setAttribute('aria-checked', String(on));
    o.tabIndex = on ? 0 : -1;
  });
  card.querySelector('[data-confirm]').disabled = false;
  card.querySelector('.card__reason-note').textContent = `Выбрано: «${getReason(btn.dataset.reason).label}».`;
  clearTimeout(autoTimer);
  autoTimer = setTimeout(confirm, reducedMotion() ? 250 : AUTO_DELAY);
}

async function confirm() {
  clearTimeout(autoTimer);
  const s = getState();
  if (busy || !s.pending?.reason) return;
  busy = true;
  const { id, choice, reason } = s.pending;
  const card = $('[data-card]');
  card.querySelector('[data-confirm]').disabled = true;
  update((st) => {
    st.initial[id] = choice;
    st.reasons[id] = reason;
    st.pending = null;
    st.profileIndex += 1;
  });
  if (!reducedMotion()) {
    card.classList.add(choice === 'continue' ? 'is-out-right' : 'is-out-left');
    await wait(420);
  }
  const done = getState().profileIndex >= CHARACTERS.length;
  renderProfiles({ animate: true });
  if (done) {
    onDone();
  } else {
    const next = $('[data-card]');
    const top = next.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.3) next.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    focusFirst(next, '[data-decide="continue"]');
  }
  await wait(200);
  busy = false;
}

function undo() {
  if (busy) return;
  clearTimeout(autoTimer);
  update((st) => { st.pending = null; });
  renderProfiles();
  focusFirst($('[data-card]'), '[data-decide="continue"]');
}

/* ───── Свайп: только явный горизонтальный жест, вертикальная прокрутка не засчитывается ───── */
function bindSwipe(card) {
  const area = card.querySelector('[data-swipe]');
  let x0 = 0; let y0 = 0; let dx = 0; let mode = null; let id = null;
  area.addEventListener('pointerdown', (e) => {
    if (getState().pending || busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; mode = null; id = e.pointerId;
  });
  area.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const mx = e.clientX - x0; const my = e.clientY - y0;
    if (!mode && (Math.abs(mx) > LOCK_MIN || Math.abs(my) > LOCK_MIN)) {
      mode = Math.abs(mx) > Math.abs(my) * 1.4 ? 'x' : 'y';
      if (mode === 'x') { area.setPointerCapture(id); card.classList.add('is-dragging'); }
    }
    if (mode === 'x') {
      dx = mx;
      card.style.transform = `translateX(${dx * 0.6}px) rotate(${dx * 0.02}deg)`;
    }
  });
  const end = (e) => {
    if (e.pointerId !== id) return;
    id = null;
    card.classList.remove('is-dragging');
    card.style.transform = '';
    if (mode === 'x' && Math.abs(dx) >= SWIPE_MIN) decide(dx > 0 ? 'continue' : 'skip');
    mode = null;
  };
  area.addEventListener('pointerup', end);
  area.addEventListener('pointercancel', end);
}

export function initProfiles({ onComplete }) {
  onDone = onComplete;
  const root = document.getElementById('profiles');
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.decide) decide(b.dataset.decide);
    else if (b.dataset.reason) pickReason(b);
    else if ('confirm' in b.dataset) confirm();
    else if ('undo' in b.dataset) undo();
    else if ('skipRest' in b.dataset) skipRest();
  });
  root.addEventListener('keydown', (e) => {
    const card = e.target.closest('[data-card]');
    if (!card) return;
    const opts = [...card.querySelectorAll('[data-reason]')];
    const i = opts.indexOf(document.activeElement);
    if (i !== -1 && ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      const n = e.key === 'Home' ? 0 : e.key === 'End' ? opts.length - 1
        : (i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + opts.length) % opts.length;
      opts.forEach((o) => { o.tabIndex = -1; });
      opts[n].tabIndex = 0;
      opts[n].focus();
      return;
    }
    // ← / → на самой анкете — те же решения, что кнопки
    if (e.target === card && !getState().pending) {
      if (e.key === 'ArrowRight') { e.preventDefault(); decide('continue'); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); decide('skip'); }
    }
  });
  renderProfiles();
}

export { getCharacter };
