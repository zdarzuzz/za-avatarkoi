// Билет с контекстом. Ситуация выбрана при старте прохождения и не меняется.
// Когда блок впервые достигнут прокруткой, билет несколько раз быстро пролетает справа налево
// (на пролётах мелькают другие контексты), затем въезжает и плавно останавливается на своём.

import { getSituation, SITUATIONS } from '../data/situations.js';
import { getState, update } from './state.js';
import { reducedMotion } from './animations.js';

let io = null;

function fill(s) {
  document.querySelectorAll('#ticket [data-t]').forEach((el) => {
    el.textContent = s[el.dataset.t] ?? '';
  });
}

export function renderTicket() {
  fill(getSituation(getState().situationId));
}

const PASSES = [520, 420, 360];   // мс на пролёт: каждый следующий быстрее

async function spin(block) {
  const ticket = block.querySelector('[data-ticket]');
  const el = ticket.querySelector('[data-ticket-spin]');
  const done = () => { block.classList.remove('is-spinning'); ticket.classList.remove('is-spinning'); update((st) => { st.ticketShown = true; }); };
  if (reducedMotion() || !el.animate) { done(); return; }
  block.classList.add('is-spinning');
  ticket.classList.add('is-spinning');
  ticket.setAttribute('aria-busy', 'true');
  const own = getState().situationId;
  const others = SITUATIONS.filter((x) => x.id !== own);
  const off = '115vw';
  try {
    for (let i = 0; i < PASSES.length; i += 1) {
      fill(others[i % others.length] ?? getSituation(own));
      await el.animate([
        { transform: `translateX(${off}) skewX(-8deg)`, filter: 'blur(0)' },
        { transform: 'translateX(0) skewX(-8deg)', filter: 'blur(3px)', offset: 0.5 },
        { transform: `translateX(-${off}) skewX(-8deg)`, filter: 'blur(0)' },
      ], { duration: PASSES[i], easing: 'linear' }).finished;
    }
    fill(getSituation(own));
    await el.animate([
      { transform: `translateX(${off}) skewX(-6deg)`, filter: 'blur(2px)' },
      { transform: 'translateX(-2.5%) skewX(1deg)', filter: 'blur(0)', offset: 0.72 },
      { transform: 'translateX(0.6%) skewX(0deg)', offset: 0.88 },
      { transform: 'none' },
    ], { duration: 1500, easing: 'cubic-bezier(0.16, 0.84, 0.3, 1)' }).finished;
  } catch (e) { /* анимация прервана — просто показываем свой билет */ }
  fill(getSituation(own));
  ticket.removeAttribute('aria-busy');
  done();
}

/** Подготовить вращение для текущего прохождения. */
export function armTicket() {
  const block = document.getElementById('ticket');
  const ticket = block.querySelector('[data-ticket]');
  io?.disconnect();
  block.classList.remove('is-spinning');
  ticket.classList.remove('is-spinning');
  renderTicket();
  if (getState().ticketShown || !('IntersectionObserver' in window)) return;
  io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      spin(block);
    }
  }, { threshold: 0.55 });
  io.observe(ticket);
}
