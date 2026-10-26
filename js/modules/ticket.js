// Билет с контекстом. Ситуация выбрана при старте прохождения и не меняется.
// Билет вращается один раз — когда блок впервые достигнут прокруткой в этом прохождении.

import { getSituation } from '../data/situations.js';
import { getState, update } from './state.js';
import { reducedMotion } from './animations.js';

let io = null;

export function renderTicket() {
  const s = getSituation(getState().situationId);
  document.querySelectorAll('#ticket [data-t]').forEach((el) => {
    el.textContent = s[el.dataset.t] ?? '';
  });
}

function spin(block) {
  const ticket = block.querySelector('[data-ticket]');
  if (reducedMotion()) { update((st) => { st.ticketShown = true; }); return; }
  block.classList.add('is-spinning');
  ticket.classList.add('is-spinning');
  ticket.querySelector('[data-ticket-spin]').addEventListener('animationend', () => {
    block.classList.remove('is-spinning');
    update((st) => { st.ticketShown = true; });
  }, { once: true });
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
