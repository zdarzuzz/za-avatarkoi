// Точка входа: связывает разделы и восстанавливает прохождение после обновления страницы.

import { getSituation } from './data/situations.js';
import { initState, getState, update, setStage, forceStage, restart, stageReached } from './modules/state.js';
import { initIntro } from './modules/intro.js';
import { initSelection, render as renderSelection } from './modules/selection.js';
import { initStories, renderStories, openFromReview, setReturnTarget } from './modules/stories.js';
import { initArticles, revealArticles } from './modules/articles.js';
import { initReview, renderReview, focusCard } from './modules/review.js';
import { goTo, hideSection, showSection, wait } from './modules/animations.js';

const el = {
  context: document.getElementById('context'),
  selection: document.getElementById('selection'),
  stories: document.getElementById('stories'),
  articles: document.getElementById('articles'),
  review: document.getElementById('review'),
};

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function renderContext() {
  const situation = getSituation(getState().situationId);
  document.querySelector('[data-situation-title]').textContent = situation.title;
  document.querySelector('[data-situation-text]').textContent = situation.description;
}

/* ───── Переходы между разделами ───── */
function openStories({ scroll }) {
  setStage('stories');
  const wasHidden = el.stories.hidden;
  el.stories.hidden = false;
  if (wasHidden) renderStories();
  if (scroll) goTo(el.stories);
}

async function openArticles() {
  setStage('articles');
  if (getState().stage === 'review') forceStage('articles');
  setReturnTarget(null);
  if (!el.review.hidden) await hideSection(el.review);
  await showSection(el.articles);
  revealArticles();
  goTo(el.articles);
}

async function openReview() {
  forceStage('review');
  await hideSection(el.articles);       // скрытые статьи не занимают высоту и не держат фокус
  renderReview();
  await showSection(el.review);
  goTo(el.review);
}

async function backToArticles() {
  forceStage('articles');
  await hideSection(el.review);
  await showSection(el.articles);
  revealArticles();
  goTo(el.articles);
}

function openStoryFromReview(id) {
  // итоги остаются на месте; история открывается выше, рядом — кнопка «Вернуться к итогам»
  openFromReview(id);
}

function returnToReview(id) {
  if (el.review.hidden) {
    el.review.hidden = false;
    renderReview();
  }
  if (!id || !focusCard(id)) goTo(el.review);
}

async function startOver() {
  restart();
  setReturnTarget(null);
  el.stories.hidden = true;
  el.articles.hidden = true;
  el.review.hidden = true;
  document.querySelector('[data-story-root]').innerHTML = '';
  renderContext();
  renderSelection();
  await wait(50);
  goTo(el.context);
}

/* ───── Подвал и панели ───── */
function initFooter() {
  document.querySelectorAll('[data-panel-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dialog = document.getElementById(`panel-${btn.dataset.panelOpen}`);
      if (dialog?.showModal) dialog.showModal();
      else dialog?.setAttribute('open', '');
    });
  });
  document.querySelectorAll('dialog.panel').forEach((d) => {
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  });
  document.querySelector('[data-to-top]')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    document.getElementById('intro-title').setAttribute('tabindex', '-1');
    document.getElementById('intro-title').focus({ preventScroll: true });
  });
}

/* ───── Восстановление ───── */
function restoreView() {
  const s = getState();
  if (stageReached('stories')) {
    el.stories.hidden = false;
    renderStories();
  }
  if (s.stage === 'articles') {
    el.articles.hidden = false;
    revealArticles();
  }
  if (s.stage === 'review') {
    el.articles.hidden = true;
    renderReview();
    el.review.hidden = false;
  }
  // вернуть пользователя к месту, где он остановился
  const target = {
    context: s.introSeen ? el.context : null,
    selection: el.selection,
    stories: el.stories,
    articles: el.articles,
    review: el.review,
  }[s.stage];
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}

function boot() {
  initState();
  renderContext();

  initIntro({
    onPassed: () => {
      if (!getState().introSeen) update((s) => { s.introSeen = true; });
      setStage('context');
    },
  });
  initStories({ onArticles: openArticles, onReturnToReview: returnToReview });
  initArticles({ onNext: openReview });
  initReview({ onOpenStory: openStoryFromReview });
  document.querySelector('[data-back-articles]').addEventListener('click', backToArticles);
  document.querySelector('[data-restart]').addEventListener('click', startOver);
  initFooter();

  restoreView();
  initSelection({
    onDone: ({ scroll }) => openStories({ scroll }),
  });
  // как только пользователь дошёл до анкет — этап «selection»
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setStage('selection');
    }, { threshold: 0.3 });
    io.observe(el.selection);
  }
}

boot();
