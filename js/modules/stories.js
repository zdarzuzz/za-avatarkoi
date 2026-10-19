// Раздел манги: шесть иконок, история выбранного персонажа в текущей ситуации,
// вопрос после истории, авторский комментарий и навигация.

import { CHARACTERS, getCharacter, getReason } from '../data/characters.js';
import { getSituation } from '../data/situations.js';
import { getStory } from '../data/stories.js';
import { getState, update } from './state.js';
import { observePanels, goTo, wait } from './animations.js';

const ICON_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

let handlers = { onArticles: () => {}, onReturnToReview: () => {} };
let returnTarget = null;     // characterId карточки в итогах, откуда открыли историю
let disconnectPanels = () => {};

const $ = (sel) => document.querySelector(sel);
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const imgVars = (box) => `--l:${box.l}%;--t:${box.t}%;--w:${box.w}%;--h:${box.h}%`;

/* ───── Персонализация ───── */
function introLine(c, s) {
  const choice = s.initial[c.id];
  const reason = getReason(s.reasons[c.id]);
  if (choice === 'skip') {
    return `Ты пропустил ${c.forms.acc}. История всё равно открыта — не чтобы переубедить, а чтобы посмотреть на детали, которых не было в анкете.`;
  }
  const lines = {
    avatar: `Больше всего на выбор повлиял аватар. Посмотрим, что видно, когда есть не только кадр.`,
    bio: `Ты опирался на то, как ${c.name} ${c.gender === 'm' ? 'описал' : 'описала'} себя. Посмотрим, как эти слова выглядят в деле.`,
    interests: `Вас связали общие интересы. Посмотрим, что появляется рядом с ними.`,
    little: `Сведений было мало, и ты решил узнать больше. Вот один эпизод.`,
    style: `Тебя зацепила манера речи. Посмотрим, как ${c.name} говорит не в анкете, а рядом.`,
    feeling: `Решение было скорее на ощущении. Посмотрим, с какими поступками оно встретится.`,
  };
  return (reason && lines[reason.id]) || `Ты решил продолжить общение. Вот один возможный эпизод.`;
}

function personalNote(c, s) {
  const choice = s.initial[c.id];
  const reason = getReason(s.reasons[c.id]);
  if (choice === 'skip') {
    return `На этапе анкеты ты пропустил ${c.forms.acc}. Ниже — что в этой сцене могло бы поддержать сомнения, а что их, возможно, не касается. История не доказывает, что решение было верным или ошибочным.`;
  }
  const r = reason ? `, опираясь на пункт «${reason.label.toLowerCase()}»` : '';
  return `Ты решил продолжить общение${r}. Ниже — что в этой сцене могло поддержать такое решение, а что — поставить его под вопрос. История не доказывает, что выбор был верным или ошибочным.`;
}

const choiceLabel = (v) => (v === 'continue' ? 'Продолжить' : v === 'skip' ? 'Пропустить' : 'Не выбрано');

/* ───── Иконки ───── */
function renderIcons() {
  const s = getState();
  const list = $('[data-story-icons]');
  list.innerHTML = CHARACTERS.map((c) => {
    const active = c.id === s.currentStory;
    const seen = s.viewed.includes(c.id);
    const label = `История: ${c.name}, ${c.ageLabel}${seen ? ', просмотрена' : ''}`;
    return `
      <li>
        <button class="avatar-btn" type="button" data-open-story="${c.id}" aria-label="${label}" ${active ? 'aria-current="true"' : ''}>
          <span class="avatar${active ? ' avatar--active' : ''}${c.flip ? ' avatar--flip' : ''}">
            <img class="avatar__mono" src="${c.iconMono}" alt="" style="${imgVars(c.iconImg)}" loading="lazy" decoding="async">
            <img class="avatar__red" src="${c.icon}" alt="" style="${imgVars(c.iconImg)}" loading="lazy" decoding="async">
          </span>
          ${seen ? `<span class="avatar-btn__seen" aria-hidden="true">${ICON_CHECK}</span>` : ''}
        </button>
      </li>`;
  }).join('');
}

/* ───── Манга ───── */
function panelTemplate(panel, n, c) {
  const ar = `${panel.w} / ${panel.h}`;
  const img = panel.ready
    ? `<img class="panel-frame__img ${panel.fit ? 'panel-frame__img--fit' : 'panel-frame__img--cover'}" src="${panel.img}" alt="${esc(panel.scene)}" ${panel.fit ? `style="${imgVars(panel.fit)}"` : ''} loading="lazy" decoding="async">`
    : `<div class="asset-missing" role="img" aria-label="Кадр ${n} ещё не нарисован. Сцена: ${esc(panel.scene)}">
         <span>Кадр ${n}: ${esc(panel.scene)}</span>
         <small>${esc(panel.img.replace(/^.*manga\//, 'manga/'))}</small>
       </div>`;
  const bubbles = panel.bubbles
    .map((bb, i) => {
      const who = bb.you ? 'Ты' : c.name;
      return `<p class="bubble bubble--${bb.tail}${bb.you ? ' bubble--you' : ''}" style="--x:${bb.x}%;--y:${bb.y}%;--bw:${bb.w}%;--bdelay:${i * 0.25}s"><span class="visually-hidden">${who}: </span>${esc(bb.text)}</p>`;
    })
    .join('');
  return `<figure class="panel-frame" data-panel="${n}" style="--grow:${panel.w};--ar:${ar}">${img}${bubbles}</figure>`;
}

function mangaTemplate(story, c) {
  let n = 0;
  return `<div class="manga" data-manga>${story.rows
    .map((row) => {
      const cls = row.panels.length > 1 ? 'manga__row manga__row--pair' : 'manga__row';
      const panels = row.panels.map((p) => {
        n += 1;
        return panelTemplate({ ...p, h: row.h }, n, c);
      }).join('');
      return `<div class="${cls}">${panels}</div>`;
    })
    .join('')}</div>`;
}

/* ───── История ───── */
function storyTemplate(c, story, s) {
  const situation = getSituation(s.situationId);
  const choice = s.initial[c.id];
  const reason = getReason(s.reasons[c.id]);
  const answer = s.answers[c.id];
  const missing = story.rows.flatMap((r) => r.panels).filter((p) => !p.ready).length;
  const idx = CHARACTERS.findIndex((x) => x.id === c.id);
  const isLast = idx === CHARACTERS.length - 1;

  return `
    <div class="story__grid">
      <aside class="story__person" aria-label="${c.name}, первый выбор">
        <div class="story__portrait">
          <div class="profile__oval${c.flip ? ' profile__oval--flip' : ''}">
            <img src="${c.portrait}" alt="" style="${imgVars(c.profileImg)}" loading="lazy" decoding="async">
          </div>
          <img class="profile__frame" src="assets/images/decorations/frame-ornate.webp" alt="" aria-hidden="true" loading="lazy">
        </div>
        <h3 class="story__name" id="story-name">${c.name}, ${c.ageLabel}</h3>
        <div class="story__plaques">
          <div class="info-plaque">
            <p class="info-plaque__label">Твой первый выбор</p>
            <p class="info-plaque__value">${choice === 'continue' ? 'Познакомиться' : choice === 'skip' ? 'Пропустить' : 'Не выбрано'}</p>
          </div>
          <div class="info-plaque">
            <p class="info-plaque__label">Причина</p>
            <p class="info-plaque__value${reason ? '' : ' info-plaque__value--empty'}">${reason ? reason.label : 'Причина не указана'}</p>
          </div>
        </div>
      </aside>

      <div class="story__main">
        <h3 class="story__title">${situation.storyTitle}</h3>
        <p class="story__intro">${introLine(c, s)}</p>
        ${missing ? `<p class="visually-hidden">Иллюстрации к этой истории ещё готовятся: на месте кадров — описания сцен, реплики сохранены.</p>` : ''}
        ${mangaTemplate(story, c)}
        <p class="story__closing">${story.closing}</p>
      </div>
    </div>

    <section class="story__question" aria-labelledby="q-title">
      <h3 id="q-title">Хочешь продолжить знакомство?</h3>
      <div class="answer-row" role="group" aria-labelledby="q-title">
        ${[
          ['yes', 'Да'],
          ['no', 'Нет'],
          ['unsure', 'Не знаю'],
        ]
          .map(
            ([id, label]) =>
              `<button class="btn-plaque" type="button" data-answer="${id}" aria-pressed="${answer === id}"><span>${label}</span></button>`
          )
          .join('')}
      </div>
      <p class="story__prompt">Что в этой сцене могло вызвать желание общаться дальше?</p>
      <p class="story__hint" data-hint aria-live="polite">${answer ? story.hints[answer] : ''}</p>
    </section>

    <section class="story__comment" aria-labelledby="comment-title">
      <p class="story__comment-label">Авторский комментарий</p>
      <h3 class="story__comment-title" id="comment-title">Что могло повлиять на твоё впечатление ${c.forms.about}?</h3>
      <p class="story__personal">${personalNote(c, s)}</p>
      <div class="observations">
        ${story.comments
          .map((o) => `<div class="observation"><h4 class="observation__head">${o.title}</h4><p>${o.text}</p></div>`)
          .join('')}
      </div>
      <nav class="story__nav" aria-label="Дальше">
        <button class="btn-plaque btn-plaque--fill" type="button" data-next-story><span>${isLast ? 'К статьям' : 'Следующая история'}</span></button>
        <button class="btn-plaque" type="button" data-skip-stories><span>Пропустить истории</span></button>
      </nav>
    </section>`;
}

function renderStory({ scroll = false } = {}) {
  const s = getState();
  const c = getCharacter(s.currentStory);
  const story = getStory(s.situationId, c.id);
  const root = $('[data-story-root]');
  if (!story) {
    root.innerHTML = '<p class="body-text">История не найдена.</p>';
    return;
  }
  const seenBefore = s.viewed.includes(c.id);
  disconnectPanels();
  root.setAttribute('aria-labelledby', 'story-name');
  root.innerHTML = storyTemplate(c, story, s);
  disconnectPanels = observePanels(root.querySelector('[data-manga]'), { seen: seenBefore });
  if (!seenBefore) update((st) => { st.viewed.push(c.id); });
  renderIcons();
  if (scroll) goTo(root, { focus: true });
}

async function openStory(id, { scroll = true } = {}) {
  const root = $('[data-story-root]');
  if (getState().currentStory === id && root.childElementCount) {
    if (scroll) goTo(root);
    return;
  }
  root.classList.add('is-switching');
  await wait(250);
  update((s) => { s.currentStory = id; });
  renderStory({ scroll });
  root.classList.remove('is-switching');
}

function setAnswer(btn) {
  const s = getState();
  const id = s.currentStory;
  const value = btn.dataset.answer;
  const story = getStory(s.situationId, id);
  update((st) => { st.answers[id] = value; });
  document.querySelectorAll('[data-answer]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  const hint = document.querySelector('[data-hint]');
  hint.classList.add('is-updating');
  setTimeout(() => {
    hint.textContent = story.hints[value];
    hint.classList.remove('is-updating');
  }, 180);
}

export function setReturnTarget(id) {
  returnTarget = id;
  $('[data-return-bar]').hidden = !id;
}

export function openFromReview(id) {
  setReturnTarget(id);
  openStory(id, { scroll: true });
}

export function initStories(h) {
  handlers = { ...handlers, ...h };
  const section = document.getElementById('stories');

  section.addEventListener('click', (e) => {
    const icon = e.target.closest('[data-open-story]');
    if (icon) { openStory(icon.dataset.openStory); return; }

    const ans = e.target.closest('[data-answer]');
    if (ans) { setAnswer(ans); return; }

    if (e.target.closest('[data-next-story]')) {
      const i = CHARACTERS.findIndex((c) => c.id === getState().currentStory);
      if (i < CHARACTERS.length - 1) openStory(CHARACTERS[i + 1].id);
      else handlers.onArticles();
      return;
    }
    if (e.target.closest('[data-skip-stories]')) { handlers.onArticles(); return; }
    if (e.target.closest('[data-return-review]')) {
      const id = returnTarget;
      setReturnTarget(null);
      handlers.onReturnToReview(id);
    }
  });
}

/** Отрисовать раздел (при открытии или после нового прохождения). */
export function renderStories() {
  renderIcons();
  renderStory();
}

export { choiceLabel };
