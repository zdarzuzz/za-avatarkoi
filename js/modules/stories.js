// Истории в манге (MacBook Air 13).
// После анкет читатель обязательно видит две истории: одного человека, с которым продолжил общение,
// и одного пропущенного. Если выбраны все или пропущены все — две разные истории, подводка адаптируется.
// Остальные истории ситуации доступны дополнительно.

import { CHARACTERS, getCharacter, getReason } from '../data/characters.js';
import { getSituation } from '../data/situations.js';
import { getStory, storiesIn } from '../data/stories.js';
import { getState, update } from './state.js';
import { observePanels, goTo, wait } from './animations.js';

const ICON_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const imgVars = (b) => `--l:${b.l}%;--t:${b.t}%;--w:${b.w}%;--h:${b.h}%`;

let handlers = { onObservations: () => {}, onReturnToReview: () => {} };
let returnTarget = null;
let disconnectPanels = () => {};
let disconnectFit = () => {};

/** Реплики не должны выходить за нижний край кадра: на узких экранах текст переносится на большее число строк. */
function fitBubbles(manga) {
  if (!manga || typeof ResizeObserver === 'undefined') return () => {};
  const fit = (panel) => {
    const h = panel.clientHeight;
    const placed = [];
    panel.querySelectorAll('.bubble').forEach((b) => {
      b.style.top = '';
      let top = b.offsetTop;
      const left = b.offsetLeft, w = b.offsetWidth, bh = b.offsetHeight;
      // если плашка наехала на уже размещённую — сдвигаем ниже неё
      placed.forEach((r) => {
        if (left < r.l + r.w && r.l < left + w && top < r.t + r.h + 4 && r.t < top + bh) top = r.t + r.h + 6;
      });
      top = Math.max(4, Math.min(top, h - bh - 4));
      if (top !== b.offsetTop) b.style.top = `${top}px`;
      placed.push({ l: left, t: top, w, h: bh });
    });
  };
  const ro = new ResizeObserver((entries) => entries.forEach((e) => fit(e.target)));
  manga.querySelectorAll('[data-panel]').forEach((p) => ro.observe(p));
  return () => ro.disconnect();
}

/** Кто доступен в этой ситуации (у кого есть история с кадрами), в порядке анкет. */
export const availableIds = (s = getState()) => {
  const ids = storiesIn(s.situationId).map((x) => x.characterId);
  return CHARACTERS.map((c) => c.id).filter((id) => ids.includes(id));
};

/** Две обязательные истории. Выбор детерминирован номером прохождения, чтобы не меняться после обновления. */
export function pickMandatory(s = getState()) {
  const ids = availableIds(s);
  const cont = ids.filter((id) => s.initial[id] === 'continue');
  const skip = ids.filter((id) => s.initial[id] === 'skip');
  const at = (list, k) => list[(s.runNumber - 1 + k) % list.length];
  if (cont.length && skip.length) return [at(cont, 0), at(skip, 0)];
  const pool = cont.length ? cont : skip.length ? skip : ids;
  if (pool.length >= 2) {
    const a = at(pool, 0);
    const b = pool.find((id) => id !== a);
    return [a, b];
  }
  // в пуле один человек: вторая история — любого другого доступного
  return [pool[0], ids.find((id) => id !== pool[0])].filter(Boolean);
}

const isMark = (c) => c.anonymous;
const portraitOf = (c, s) => (c.anonymous && s.viewed.includes(c.id) ? c.revealIcon : c.icon);
const iconBoxOf = (c, s) => (c.anonymous && s.viewed.includes(c.id) ? c.revealIconImg : c.iconImg);

function introLine(c, s) {
  const choice = s.initial[c.id];
  const reason = getReason(s.reasons[c.id]);
  const why = reason ? ` Главным было «${reason.label.toLowerCase()}».` : '';
  if (!choice) return `Анкета ${c.forms.gen} осталась неоткрытой — эта история показывает встречу без первого впечатления.`;
  if (choice === 'skip') return `Анкета ${c.forms.gen} осталась пропущенной.${why} История открыта не для того, чтобы переубедить, а чтобы показать детали, которых в анкете не было.`;
  return `Знакомство с ${c.forms.ins} продолжено.${why} Вот один возможный эпизод.`;
}

function personalNote(c, s) {
  const choice = s.initial[c.id];
  const base = choice === 'skip'
    ? 'Ниже — что в этой сцене могло бы поддержать сомнения, а что их, возможно, не касается.'
    : 'Ниже — что в этой сцене могло поддержать такое решение, а что — поставить его под вопрос.';
  return `${base} История не доказывает, что выбор был верным или ошибочным.`;
}

/* ───── Иконки ───── */
function renderIcons() {
  const s = getState();
  const ids = availableIds(s);
  $('[data-story-icons]').innerHTML = ids.map((id) => {
    const c = getCharacter(id);
    const active = id === s.currentStory;
    const seen = s.viewed.includes(id);
    const must = s.mandatory.includes(id);
    const src = portraitOf(c, s);
    const box = iconBoxOf(c, s);
    return `<li>
      <button class="avatar-btn" type="button" data-open-story="${id}"
        aria-label="История: ${c.name}, ${c.ageLabel}${must ? ', обязательная' : ', дополнительная'}${seen ? ', просмотрена' : ''}" ${active ? 'aria-current="true"' : ''}>
        <span class="avatar${active ? ' avatar--active' : ''}${c.flip ? ' avatar--flip' : ''}">
          <img class="avatar__mono" src="${c.anonymous && seen ? c.revealIconMono : c.iconMono}" alt="" style="${imgVars(box)}" width="200" height="266" loading="lazy" decoding="async">
          <img class="avatar__red" src="${src}" alt="" style="${imgVars(box)}" width="200" height="266" loading="lazy" decoding="async">
        </span>
        ${seen ? `<span class="avatar-btn__seen" aria-hidden="true">${ICON_CHECK}</span>` : ''}
      </button></li>`;
  }).join('');
  const left = s.mandatory.filter((id) => !s.viewed.includes(id)).length;
  $('[data-stories-progress]').textContent = left
    ? `Обязательных историй осталось: ${left} из 2`
    : ids.length > 2 ? 'Обязательные истории просмотрены. Остальные — по желанию.' : 'Обе истории просмотрены.';
}

/* ───── Кадры ───── */
/** Ширина кадра на экране: доля ряда от основной колонки манги (до 1100 px). */
function sizesFor(p, rowW) {
  const share = Math.max(0.2, Math.min(1, p.w / rowW));
  return `(max-width: 600px) 100vw, ${Math.round(share * 100)}vw`;
}

function panelTemplate(p, rowH, n, c, rowW = p.w) {
  const img = p.fit
    ? `<img class="panel-frame__img panel-frame__img--fit" src="${p.img}"${p.imgSm ? ` srcset="${p.imgSm} ${p.smW}w, ${p.img} ${p.imgW}w" sizes="${sizesFor(p, rowW)}"` : ''} alt="${esc(p.scene)}" style="${imgVars(p.fit)}" width="${p.imgW}" height="${p.imgH}" loading="lazy" decoding="async">`
    : `<img class="panel-frame__img panel-frame__img--contain" src="${p.img}"${p.imgSm ? ` srcset="${p.imgSm} ${p.smW}w, ${p.img} ${p.imgW}w" sizes="${sizesFor(p, rowW)}"` : ''} alt="${esc(p.scene)}" width="${p.imgW}" height="${p.imgH}" loading="lazy" decoding="async">`;
  const bubbles = p.bubbles.map((bb, i) => `<p class="bubble bubble--${bb.tail}${bb.you ? ' bubble--you' : ''}" style="--x:${bb.x}%;--y:${bb.y}%;--bw:${bb.w}%;--bdelay:${i * 0.25}s"><span class="visually-hidden">${bb.you ? 'Ты' : c.name}: </span>${esc(bb.text)}</p>`).join('');
  return `<figure class="panel-frame" data-panel="${n}" style="--grow:${p.w};--ar:${p.w} / ${rowH}">${img}${bubbles}</figure>`;
}

function mangaTemplate(story, c) {
  let n = 0;
  let detail = 0;
  return `<div class="manga" data-manga>${story.rows.map((row) => {
    const rowW = row.panels.reduce((sum, p) => sum + p.w, 0);
    const cls = ['manga__row'];
    if (row.panels.length > 1) cls.push('manga__row--pair');
    // одиночный вертикальный или квадратный кадр — деталь: уже колонки, по очереди слева и справа
    if (row.detail) cls.push('manga__row--detail', (detail++ % 2) ? 'manga__row--end' : 'manga__row--start');
    return `<div class="${cls.join(' ')}">${row.panels.map((p) => panelTemplate(p, row.h, ++n, c, rowW)).join('')}</div>`;
  }).join('')}</div>`;
}

function navButtons(s) {
  const ids = availableIds(s);
  const nextMust = s.mandatory.find((id) => !s.viewed.includes(id));
  if (nextMust) return `<button class="btn-plaque btn-plaque--fill" type="button" data-open-story="${nextMust}"><span>Следующая история</span></button>`;
  const nextOpt = ids.find((id) => !s.viewed.includes(id));
  return `${nextOpt ? `<button class="btn-plaque" type="button" data-to-observations><span>Пропустить истории</span></button>
    <button class="btn-plaque btn-plaque--fill" type="button" data-open-story="${nextOpt}"><span>Следующая история</span></button>`
    : `<button class="btn-plaque btn-plaque--fill" type="button" data-to-observations><span>Дальше</span></button>`}`;
}

function storyTemplate(c, story, s) {
  const situation = getSituation(s.situationId);
  const answer = s.answers[c.id];
  const portrait = c.anonymous ? c.revealIcon : c.icon;   // внешность Марка раскрывается в манге
  const box = c.anonymous ? c.revealIconImg : c.iconImg;
  return `
    <div class="story__layout">
      <aside class="story__who" aria-label="Сейчас история: ${c.name}">
        <span class="avatar${c.flip ? ' avatar--flip' : ''}"><img class="avatar__red" style="opacity:1;${imgVars(box)}" src="${portrait}" alt="" width="200" height="266" decoding="async"></span>
        <span class="story__who-name">${c.name}</span>
      </aside>
      <div class="story__main">
        <h3 class="story__title" id="story-title">${situation.storyTitle}</h3>
        <p class="story__intro">${introLine(c, s)}</p>
        ${mangaTemplate(story, c)}
        <p class="story__closing">${story.closing}</p>

        <section class="story__question" aria-labelledby="q-title">
          <h3 class="h-question" id="q-title">Хочешь продолжить знакомство?</h3>
          <div class="answer-row" role="group" aria-labelledby="q-title">
            ${[['yes', 'Да'], ['no', 'Нет'], ['unsure', 'Не знаю']].map(([id, l]) => `<button class="btn-plaque" type="button" data-answer="${id}" aria-pressed="${answer === id}"><span>${l}</span></button>`).join('')}
          </div>
          <p class="story__prompt">Что в&nbsp;этой сцене могло вызвать желание общаться дальше?</p>
          <p class="story__hint" data-hint aria-live="polite">${answer ? story.hints[answer] : ''}</p>
        </section>

        <section class="story__comment" aria-labelledby="comment-title">
          <p class="story__comment-label">Авторский комментарий</p>
          <h3 class="story__comment-title" id="comment-title">Что могло повлиять на&nbsp;твоё впечатление ${c.forms.about}?</h3>
          <p class="story__personal">${personalNote(c, s)}</p>
          <div class="observations-grid">
            ${story.comments.map((o) => `<div class="observation"><h4>${o.title}</h4><p>${o.text}</p></div>`).join('')}
          </div>
          <nav class="story__nav" aria-label="Дальше" data-story-nav>${navButtons(s)}</nav>
        </section>
      </div>
    </div>`;
}

function renderStory({ scroll = false } = {}) {
  const s = getState();
  const c = getCharacter(s.currentStory);
  const story = c && getStory(s.situationId, c.id);
  const root = $('[data-story-root]');
  if (!story) { root.innerHTML = ''; return; }
  const seenBefore = s.viewed.includes(c.id);
  disconnectPanels();
  root.setAttribute('aria-labelledby', 'story-title');
  root.innerHTML = storyTemplate(c, story, s);
  if (!seenBefore) update((st) => { st.viewed.push(c.id); });
  disconnectPanels = observePanels(root.querySelector('[data-manga]'), { seen: seenBefore });
  disconnectFit();
  disconnectFit = fitBubbles(root.querySelector('[data-manga]'));
  // кнопки навигации зависят от отметки «просмотрено» — перерисовываем после неё
  root.querySelector('[data-story-nav]').innerHTML = navButtons(getState());
  renderIcons();
  if (scroll) goTo(root, { focus: true });
}

async function openStory(id, { scroll = true } = {}) {
  const root = $('[data-story-root]');
  if (getState().currentStory === id && root.childElementCount) { if (scroll) goTo(root); return; }
  root.classList.add('is-switching');
  await wait(220);
  update((s) => { s.currentStory = id; });
  renderStory({ scroll });
  root.classList.remove('is-switching');
}

function setAnswer(btn) {
  const s = getState();
  const id = s.currentStory;
  const story = getStory(s.situationId, id);
  update((st) => { st.answers[id] = btn.dataset.answer; });
  document.querySelectorAll('[data-answer]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  const hint = $('[data-hint]');
  hint.classList.add('is-updating');
  setTimeout(() => { hint.textContent = story.hints[btn.dataset.answer]; hint.classList.remove('is-updating'); }, 180);
}

export function setReturnTarget(id) {
  returnTarget = id;
  $('[data-return-bar]').hidden = !id;
}

/** Открыть раздел: назначить обязательные истории (один раз за прохождение) и показать первую непросмотренную. */
export function renderStories() {
  const s = getState();
  if (s.mandatory.length < 2) update((st) => { st.mandatory = pickMandatory(st); });
  const cur = getState();
  if (!cur.currentStory) update((st) => { st.currentStory = st.mandatory.find((id) => !st.viewed.includes(id)) ?? st.mandatory[0]; });
  renderIcons();
  renderStory();
}

export const mandatoryDone = (s = getState()) => s.mandatory.length === 2 && s.mandatory.every((id) => s.viewed.includes(id));

export function openFromReview(id) {
  setReturnTarget(id);
  openStory(id, { scroll: true });
}

export function initStories(h) {
  handlers = { ...handlers, ...h };
  $('#stories').addEventListener('click', (e) => {
    const open = e.target.closest('[data-open-story]');
    if (open) { openStory(open.dataset.openStory); return; }
    const ans = e.target.closest('[data-answer]');
    if (ans) { setAnswer(ans); return; }
    if (e.target.closest('[data-to-observations]')) { handlers.onObservations(); return; }
    if (e.target.closest('[data-return-review]')) {
      const id = returnTarget;
      setReturnTarget(null);
      handlers.onReturnToReview(id);
    }
  });
}
