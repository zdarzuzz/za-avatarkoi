// Состояние прохождения. Первоначальный выбор, ответ после манги и итоговое решение
// хранятся раздельно и не перезаписывают друг друга.

import { readState, writeState } from './storage.js';
import { CHARACTER_IDS, REASONS } from '../data/characters.js';
import { SITUATION_IDS } from '../data/situations.js';

const VERSION = 3;
const STAGES = ['intro', 'context', 'selection', 'stories', 'articles', 'review'];
const ANSWERS = ['yes', 'no', 'unsure'];
const DECISIONS = ['continue', 'skip'];
const REASON_IDS = REASONS.map((r) => r.id);

const listeners = new Set();
let state = null;

const uid = () =>
  (window.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Следующая ситуация из перемешанной очереди: показать все три, затем перемешать снова, без повтора подряд. */
function takeSituation(queue, previous) {
  let q = Array.isArray(queue) ? queue.filter((id) => SITUATION_IDS.includes(id)) : [];
  if (!q.length) {
    q = shuffle(SITUATION_IDS);
    if (previous && q[0] === previous && q.length > 1) {
      [q[0], q[1]] = [q[1], q[0]];
    }
  }
  const [next, ...rest] = q;
  return { next, rest };
}

function freshRun(prev = {}) {
  const { next, rest } = takeSituation(prev.situationQueue, prev.situationId);
  return {
    version: VERSION,
    runId: uid(),
    runNumber: (prev.runNumber ?? 0) + 1,
    situationId: next,
    situationQueue: rest,
    stage: prev.introSeen ? 'context' : 'intro',
    introSeen: Boolean(prev.introSeen),
    profileIndex: 0,
    initial: {},   // characterId → 'continue' | 'skip' — первоначальный выбор, не меняется
    reasons: {},   // characterId → reasonId (только для 'continue')
    viewed: [],    // characterId[] — просмотренные истории
    answers: {},   // characterId → 'yes' | 'no' | 'unsure' — ответ после манги
    final: {},     // characterId → 'continue' | 'skip' | null — явное итоговое решение на финале
    currentStory: CHARACTER_IDS[0],
  };
}

function pickMap(obj, valid) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const id of CHARACTER_IDS) {
    if (valid.includes(obj[id])) out[id] = obj[id];
  }
  return out;
}

/** Проверка сохранённых данных. Повреждённые или устаревшие поля отбрасываются. */
function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== VERSION) return null;
  if (!SITUATION_IDS.includes(raw.situationId)) return null;
  const s = freshRun();
  s.runId = typeof raw.runId === 'string' ? raw.runId : s.runId;
  s.runNumber = Number.isInteger(raw.runNumber) ? raw.runNumber : 1;
  s.situationId = raw.situationId;
  s.situationQueue = Array.isArray(raw.situationQueue)
    ? raw.situationQueue.filter((id) => SITUATION_IDS.includes(id) && id !== raw.situationId)
    : [];
  s.introSeen = Boolean(raw.introSeen);
  s.stage = STAGES.includes(raw.stage) ? raw.stage : 'intro';
  s.initial = pickMap(raw.initial, DECISIONS);
  s.reasons = pickMap(raw.reasons, REASON_IDS);
  for (const id of Object.keys(s.reasons)) {
    if (s.initial[id] !== 'continue') delete s.reasons[id];
  }
  s.answers = pickMap(raw.answers, ANSWERS);
  s.final = {};
  if (raw.final && typeof raw.final === 'object') {
    for (const id of CHARACTER_IDS) {
      if (id in raw.final && (raw.final[id] === null || DECISIONS.includes(raw.final[id]))) s.final[id] = raw.final[id];
    }
  }
  s.viewed = Array.isArray(raw.viewed) ? CHARACTER_IDS.filter((id) => raw.viewed.includes(id)) : [];
  s.currentStory = CHARACTER_IDS.includes(raw.currentStory) ? raw.currentStory : CHARACTER_IDS[0];
  // Индекс анкеты — первая анкета без завершённого решения
  const firstOpen = CHARACTER_IDS.findIndex((id) => !s.initial[id] || (s.initial[id] === 'continue' && !s.reasons[id]));
  s.profileIndex = firstOpen === -1 ? CHARACTER_IDS.length : firstOpen;
  // Нельзя оказаться дальше анкет, если они не пройдены
  if (s.profileIndex < CHARACTER_IDS.length && STAGES.indexOf(s.stage) > STAGES.indexOf('selection')) {
    s.stage = 'selection';
  }
  return s;
}

export function initState() {
  state = sanitize(readState()) ?? freshRun();
  writeState(state);
  return state;
}

export const getState = () => state;

export function update(mutator) {
  mutator(state);
  writeState(state);
  listeners.forEach((fn) => fn(state));
}

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function setStage(stage) {
  if (!STAGES.includes(stage)) return;
  update((s) => {
    // этап только растёт, кроме явных возвратов (обрабатываются вызывающим кодом)
    if (STAGES.indexOf(stage) > STAGES.indexOf(s.stage)) s.stage = stage;
  });
}

export function forceStage(stage) {
  if (!STAGES.includes(stage)) return;
  update((s) => { s.stage = stage; });
}

export const stageReached = (stage) => STAGES.indexOf(state.stage) >= STAGES.indexOf(stage);

/** Начать новое прохождение: другая ситуация, сброс решений, без повторной вступительной анимации. */
export function restart() {
  const prev = { ...state, introSeen: true };
  state = freshRun(prev);
  state.stage = 'context';
  writeState(state);
  listeners.forEach((fn) => fn(state));
  return state;
}

/** Итоговое решение: явное, если пользователь менял его на финале, иначе — по ответу после манги, иначе — первоначальный выбор. */
export function finalDecision(characterId, s = state) {
  if (characterId in s.final) return s.final[characterId];
  const answer = s.answers[characterId];
  if (answer === 'yes') return 'continue';
  if (answer === 'no') return 'skip';
  if (answer === 'unsure') return null;
  return s.initial[characterId] ?? null;
}
