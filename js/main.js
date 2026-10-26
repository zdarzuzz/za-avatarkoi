// Точка входа. Управляет этапами и восстанавливает прохождение после обновления страницы.
//
// Сценарий: обложка → билет → анкеты → уверенность → истории → «А что добавил ты?»  (одна длинная страница)
//           → психологический разбор (отдельное состояние) → «Что теперь ты видишь иначе?» (отдельное состояние)
// Отдельные состояния открываются без перезагрузки и смены адреса: предыдущие этапы скрываются,
// перестают занимать место и выпадают из фокуса клавиатуры (hidden + inert).

import { initState, getState, update, advanceStage, setStageExact, reached, restart } from './modules/state.js';
import { initCover } from './modules/cover.js';
import { armTicket } from './modules/ticket.js';
import { initProfiles, renderProfiles } from './modules/profiles.js';
import { initConfidence } from './modules/confidence.js';
import { initStories, renderStories, openFromReview, setReturnTarget, mandatoryDone } from './modules/stories.js';
import { initObservations } from './modules/observations.js';
import { initAnalysis, onAnalysisOpen } from './modules/analysis.js';
import { initReview, renderReview, focusCard } from './modules/review.js';
import { initTyping, initReveal, refreshTyping } from './modules/reveal.js';
import { goTo, reducedMotion } from './modules/animations.js';

const $ = (id) => document.getElementById(id);
const el = {
  cover: $('cover'), ticket: $('ticket'), profiles: $('profiles'), confidence: $('confidence'),
  stories: $('stories'), observations: $('observations'), analysis: $('analysis'), review: $('review'),
};
const JOURNEY = ['cover', 'ticket', 'profiles', 'confidence', 'stories', 'observations'];

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function show(node, on) {
  node.hidden = !on;
  node.inert = !on;
  if (on) node.dataset.shown = ''; else delete node.dataset.shown;
}

/** Какие части сценария видны. mode: journey | analysis | review | story */
let mode = 'journey';
function setMode(next) {
  mode = next;
  const s = getState();
  if (next === 'journey') {
    show(el.cover, true); show(el.ticket, true); show(el.profiles, true);
    show(el.confidence, reached('confidence'));
    show(el.stories, reached('stories'));
    show(el.observations, reached('observations'));
    show(el.analysis, false); show(el.review, false);
  } else {
    JOURNEY.forEach((k) => show(el[k], next === 'story' && k === 'stories'));
    show(el.analysis, next === 'analysis');
    show(el.review, next === 'review');
  }
  document.body.dataset.mode = next;
  if (next !== 'story') setReturnTarget(null);
  refreshTyping();
  return s;
}

function enter(node) {
  if (!reducedMotion()) { node.classList.remove('stage-enter'); void node.offsetWidth; node.classList.add('stage-enter'); }
}

/* ───── Переходы ───── */
function toConfidence() {
  advanceStage('confidence');
  show(el.confidence, true);
  enter(el.confidence);
  goTo(el.confidence);
}

function toStories() {
  advanceStage('stories');
  show(el.stories, true);
  renderStories();
  enter(el.stories);
  goTo(el.stories);
}

function toObservations() {
  if (!mandatoryDone()) return;
  advanceStage('observations');
  show(el.observations, true);
  enter(el.observations);
  initReveal(el.observations);
  initTyping(el.observations);
  goTo(el.observations);
}

function toAnalysis() {
  advanceStage('analysis');
  setMode('analysis');
  onAnalysisOpen();
  window.scrollTo(0, 0);                 // разбор открывается с начала
  enter(el.analysis);
  initReveal(el.analysis);
  initTyping(el.analysis);
  el.analysis.focus({ preventScroll: true });
}

function backToObservations() {
  setMode('journey');
  initReveal(el.observations);
  initTyping(el.observations);
  goTo(el.observations);
}

function toReview() {
  advanceStage('review');
  setMode('review');
  renderReview();
  window.scrollTo(0, 0);
  enter(el.review);
  el.review.focus({ preventScroll: true });
}

function backToAnalysis() {
  setMode('analysis');
  window.scrollTo(0, 0);
  initReveal(el.analysis);
  initTyping(el.analysis);
  el.analysis.focus({ preventScroll: true });
}

function storyFromReview(id) {
  setMode('story');
  window.scrollTo(0, 0);
  openFromReview(id);
}

function returnToReview(id) {
  setMode('review');
  renderReview();
  if (!id || !focusCard(id)) { window.scrollTo(0, 0); el.review.focus({ preventScroll: true }); }
}

function startOver() {
  restart();
  document.querySelector('[data-story-root]').innerHTML = '';
  setMode('journey');
  armTicket();
  renderProfiles();
  confidence.render();
  window.scrollTo(0, el.ticket.offsetTop);
  el.ticket.focus({ preventScroll: true });
}

/* ───── Восстановление ───── */
function restore() {
  const s = getState();
  if (reached('stories')) renderStories();
  if (s.stage === 'analysis') { toAnalysis(); return; }
  if (s.stage === 'review') { toReview(); return; }
  setMode('journey');
  if (reached('observations')) { initReveal(el.observations); initTyping(el.observations); }
  const target = { cover: null, ticket: el.ticket, profiles: el.profiles, confidence: el.confidence, stories: el.stories, observations: el.observations }[s.stage];
  if (target) requestAnimationFrame(() => window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY));
}

let confidence;
function boot() {
  initState();
  initCover({ onPassed: () => { if (!getState().coverSeen) update((s) => { s.coverSeen = true; }); advanceStage('ticket'); } });
  armTicket();
  initProfiles({ onComplete: toConfidence });
  confidence = initConfidence({ onNext: toStories });
  initStories({ onObservations: toObservations, onReturnToReview: returnToReview });
  initObservations({ onAnalysis: toAnalysis });
  initAnalysis({ onReview: toReview, onBack: backToObservations });
  initReview({ onOpenStory: storyFromReview });
  document.querySelector('[data-back-analysis]').addEventListener('click', backToAnalysis);
  document.querySelector('[data-restart]').addEventListener('click', startOver);
  document.querySelector('[data-to-top]').addEventListener('click', (e) => {
    e.preventDefault();
    if (mode !== 'journey') setMode('journey');
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  });
  // отметить достижение анкет при прокрутке
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((en) => { if (en.some((e) => e.isIntersecting)) advanceStage('profiles'); }, { threshold: 0.25 }).observe(el.profiles);
  }
  restore();
  document.documentElement.classList.add('is-ready');
}

boot();
export { setStageExact };
