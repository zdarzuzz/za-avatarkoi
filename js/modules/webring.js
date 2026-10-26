// Кнопки «Предыдущий сайт» / «Следующий сайт» в подвале.
import { WEBRING } from '../data/webring.js';

export function initWebring() {
  for (const side of ['prev', 'next']) {
    const a = document.querySelector(`[data-webring-${side}]`);
    const name = document.querySelector(`[data-webring-${side}-name]`);
    const { url, name: title } = WEBRING[side] ?? {};
    if (!a) continue;
    if (name) name.textContent = title || '';
    if (url) {
      a.href = url;
      a.rel = 'noopener';
    } else {
      a.removeAttribute('href');
      a.setAttribute('aria-disabled', 'true');
      a.title = 'Адрес появится позже';
    }
  }
}
