// Безопасная работа с localStorage: приватный режим, переполнение и повреждённые данные
// не должны ломать запуск сайта.

const KEY = 'za-avatarkoi:state';

export function readState() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeState(state) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ничего: хранилище недоступно */
  }
}
