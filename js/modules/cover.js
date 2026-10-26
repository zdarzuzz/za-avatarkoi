// Обложка. Заголовок уходит вверх вместе с обычной прокруткой (он не закреплён),
// изображение закреплено и затухает по прогрессу прокрутки, затем появляется билет.
// Всё зависит от положения прокрутки, таймеров нет.

import { reducedMotion } from './animations.js';

const clamp = (v) => Math.min(1, Math.max(0, v));

export function initCover({ onPassed } = {}) {
  const section = document.getElementById('cover');
  const sticky = section.querySelector('.cover__sticky');
  let ticking = false;
  let passed = false;

  function render() {
    ticking = false;
    const vh = window.innerHeight;
    const rect = section.getBoundingClientRect();
    // участок, на котором картинка закреплена; на телефоне обложка ниже экрана — берём долю её высоты
    const track = Math.max(section.offsetHeight - vh, section.offsetHeight * 0.45);
    const p = track > 0 ? clamp(-rect.top / track) : 1;
    // первые 35 % — картинка держится, затем затухает до конца участка
    const fade = reducedMotion() ? 1 : 1 - clamp((p - 0.35) / 0.65);
    sticky.style.setProperty('--cover-fade', fade.toFixed(3));
    if (!passed && p >= 0.98) { passed = true; onPassed?.(); }
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  render();
}
