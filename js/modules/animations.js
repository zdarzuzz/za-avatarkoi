// Общие помощники анимаций: уменьшенное движение, появление при прокрутке, плавный переход к разделу.

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => motionQuery.matches;
export const onMotionChange = (fn) => motionQuery.addEventListener('change', fn);

export const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? Math.min(ms, 120) : ms));

/** Плавное появление элементов [data-reveal] по мере прокрутки. */
export function observeReveal(root = document) {
  const items = root.querySelectorAll('[data-reveal]:not(.is-visible)');
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      let i = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.transitionDelay = `${Math.min(i * 0.12, 0.36)}s`;
        el.classList.add('is-visible');
        io.unobserve(el);
        i += 1;
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
}

/** Последовательное появление кадров манги: только те, что вошли в экран, с короткой задержкой внутри группы. */
export function observePanels(container, { seen = false } = {}) {
  const panels = [...container.querySelectorAll('[data-panel]')];
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    panels.forEach((p) => p.classList.add('is-visible'));
    return () => {};
  }
  if (seen) container.classList.add('manga--seen');
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      visible
        .sort((a, b) => Number(a.dataset.panel) - Number(b.dataset.panel))
        .forEach((el, i) => {
          // 0,15 → 0,5 с внутри видимой группы; при повторном просмотре — без ожидания
          const delay = seen ? 0 : Math.min(0.15 + i * 0.18, 0.5);
          el.style.setProperty('--delay', `${i === 0 && !seen ? 0.05 : delay}s`);
          el.classList.add('is-visible');
          io.unobserve(el);
        });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.2 }
  );
  panels.forEach((p) => io.observe(p));
  return () => io.disconnect();
}

/** Прокрутка к элементу с учётом уменьшенного движения и перенос фокуса для клавиатуры. */
export function goTo(el, { focus = true, block = 'start' } = {}) {
  if (!el) return;
  el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block });
  if (focus) {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
}

/** Скрыть раздел после короткой анимации, чтобы он не занимал высоту и не держал фокус. */
export async function hideSection(section) {
  if (section.hidden) return;
  section.classList.add('is-leaving');
  await wait(450);
  section.hidden = true;
  section.classList.remove('is-leaving');
}

/** Показать раздел с мягким появлением. */
export async function showSection(section) {
  if (!section.hidden) return;
  section.classList.add('is-entering');
  section.hidden = false;
  // два кадра — чтобы стартовое состояние применилось до перехода
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  section.classList.remove('is-entering');
}
