// Состояние прохождения «Человек в твоих глазах».
// Первоначальный выбор, причина, уверенность, ответ после манги и итоговое решение хранятся раздельно.

import { readState, writeState } from './storage.js';
import { CHARACTER_IDS, REASONS, CONFIDENCE } from '../data/characters.js';
import { SITUATIONS } from '../data/situations.js';
import { availableSituations, storiesIn } from '../data/stories.js';

const VERSION = 4;
export const STAGES = ['cover', 'ticket', 'profiles', 'confidence', 'stories', 'observations', 'analysis', 'review'];
const ANSWERS = ['yes', 'no', 'unsure'];
const DECISIONS = ['continue', 'skip'];
const REASON_IDS = REASONS.map((r) => r.id);
const CONF_IDS = CONFIDENCE.map((c) => c.id);

const listeners = new Set();
let state = null;

const uid = () => window.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Ситуации, которые можно выдать: только с двумя и более готовыми историями. */
export const playableSituations = () => availableSituations(SITUATIONS.map((s) => s.id));

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Очередь ситуаций: все доступные по разу, затем новая перетасовка; без повтора подряд, если есть выбор. */
function takeSituation(queue, previous) {
  const pool = playableSituations();
  let q = Array.isArray(queue) ? queue.filter((id) => pool.includes(id)) : [];
  if (!q.length) {
    q = shuffle(pool);
    if (previous && q[0] === previous && q.length > 1) [q[0], q[1]] = [q[1], q[0]];
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
    stage: prev.coverSeen ? 'ticket' : 'cover',
    coverSeen: Boolean(prev.coverSeen),
    ticketShown: false,      // билет уже «выпал» в этом прохождении — повторно не вращается
    profileIndex: 0,
    pending: null,           // { id, choice, reason } — решение принято, причина ещё не подтверждена
    initial: {},             // characterId → 'continue' | 'skip' — не меняется до нового прохождения
    reasons: {},             // characterId → reasonId (после каждого решения)
    confidence: null,        // один раз, после всех анкет
    mandatory: [],           // две обязательные истории
    viewed: [],
    answers: {},             // ответ после манги
    final: {},               // явное итоговое решение на финальном этапе
    currentStory: null,
    profilesSkipped: false,  // читатель пропустил оставшиеся анкеты (после двух просмотренных)
  };
}

const pickMap = (obj, valid) => {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const id of CHARACTER_IDS) if (valid.includes(obj[id])) out[id] = obj[id];
  return out;
};

/** Проверка сохранённых данных: повреждённые или устаревшие поля отбрасываются, сценарий не ломается. */
function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== VERSION) return null;
  if (!playableSituations().includes(raw.situationId)) return null;
  const s = freshRun();
  Object.assign(s, {
    runId: typeof raw.runId === 'string' ? raw.runId : s.runId,
    runNumber: Number.isInteger(raw.runNumber) ? raw.runNumber : 1,
    situationId: raw.situationId,
    situationQueue: Array.isArray(raw.situationQueue) ? raw.situationQueue.filter((id) => playableSituations().includes(id) && id !== raw.situationId) : [],
    stage: STAGES.includes(raw.stage) ? raw.stage : 'cover',
    coverSeen: Boolean(raw.coverSeen),
    ticketShown: Boolean(raw.ticketShown),
    initial: pickMap(raw.initial, DECISIONS),
    reasons: pickMap(raw.reasons, REASON_IDS),
    answers: pickMap(raw.answers, ANSWERS),
    confidence: CONF_IDS.includes(raw.confidence) ? raw.confidence : null,
    profilesSkipped: Boolean(raw.profilesSkipped),
  });
  for (const id of Object.keys(s.reasons)) if (!s.initial[id]) delete s.reasons[id];
  if (raw.final && typeof raw.final === 'object') {
    for (const id of CHARACTER_IDS) if (id in raw.final && (raw.final[id] === null || DECISIONS.includes(raw.final[id]))) s.final[id] = raw.final[id];
  }
  const avail = storiesIn(s.situationId).map((x) => x.characterId);
  s.viewed = Array.isArray(raw.viewed) ? CHARACTER_IDS.filter((id) => raw.viewed.includes(id) && avail.includes(id)) : [];
  s.mandatory = Array.isArray(raw.mandatory) ? raw.mandatory.filter((id) => avail.includes(id)).slice(0, 2) : [];
  s.currentStory = avail.includes(raw.currentStory) ? raw.currentStory : null;
  const p = raw.pending;
  if (p && CHARACTER_IDS.includes(p.id) && DECISIONS.includes(p.choice) && !s.initial[p.id]) {
    s.pending = { id: p.id, choice: p.choice, reason: REASON_IDS.includes(p.reason) ? p.reason : null };
  }
  // индекс анкеты — первая без подтверждённого решения
  const firstOpen = CHARACTER_IDS.findIndex((id) => !s.initial[id]);
  s.profileIndex = firstOpen === -1 || (s.profilesSkipped && firstOpen >= 2) ? CHARACTER_IDS.length : firstOpen;
  if (s.profileIndex < CHARACTER_IDS.length) s.profilesSkipped = false;
  if (s.pending && s.pending.id !== CHARACTER_IDS[s.profileIndex]) s.pending = null;
  // дальше незавершённого этапа не пускаем
  const cap = s.profileIndex < CHARACTER_IDS.length ? 'profiles' : !s.confidence ? 'confidence' : null;
  if (cap && STAGES.indexOf(s.stage) > STAGES.indexOf(cap)) s.stage = cap;
  if (s.mandatory.length < 2 && STAGES.indexOf(s.stage) > STAGES.indexOf('stories') && s.confidence) s.stage = 'stories';
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

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export const stageIndex = (stage) => STAGES.indexOf(stage);
export const reached = (stage) => stageIndex(state.stage) >= stageIndex(stage);

/** Этап только растёт; явные возвраты задаются через setStageExact. */
export function advanceStage(stage) {
  if (stageIndex(stage) > stageIndex(state.stage)) update((s) => { s.stage = stage; });
}
export function setStageExact(stage) {
  if (STAGES.includes(stage)) update((s) => { s.stage = stage; });
}

/** Новое прохождение: другая ситуация (если есть), сброс решений, без повторной обложки. */
export function restart() {
  state = freshRun({ ...state, coverSeen: true });
  writeState(state);
  listeners.forEach((fn) => fn(state));
  return state;
}

/** Итоговое решение: явное → ответ после истории → первоначальный выбор. «Не знаю» — не выбрано. */
export function finalDecision(characterId, s = state) {
  if (characterId in s.final) return s.final[characterId];
  const a = s.answers[characterId];
  if (a === 'yes') return 'continue';
  if (a === 'no') return 'skip';
  if (a === 'unsure') return null;
  return s.initial[characterId] ?? null;
}
