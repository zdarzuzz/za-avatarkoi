// Мягкая прокрутка колесом мыши / тачпадом: шаг немного короче обычного и с плавным торможением,
// чтобы лонгрид читался неторопливо. Клавиатура, полоса прокрутки и касания остаются системными.
// Не включается при prefers-reduced-motion, при зуме (Ctrl/⌘ + колесо) и внутри прокручиваемых элементов.

const SPEED = 0.62;   // доля обычного шага колеса
const EASE = 0.09;    // доля оставшегося пути за кадр (меньше — плавнее)

export function initSmoothScroll() {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches || !('requestAnimationFrame' in window)) return;

  let target = window.scrollY;
  let current = window.scrollY;
  let raf = 0;
  let lastSet = -1;

  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  const scrollableInside = (el) => {
    for (let x = el; x && x !== document.body && x !== document.documentElement; x = x.parentElement) {
      const cs = getComputedStyle(x);
      if (/(auto|scroll)/.test(cs.overflowY) && x.scrollHeight > x.clientHeight + 1) return true;
    }
    return false;
  };

  function frame() {
    // прокрутку перехватил кто‑то ещё (переход к разделу, клавиатура) — уступаем
    if (lastSet >= 0 && Math.abs(window.scrollY - lastSet) > 3) { raf = 0; lastSet = -1; target = current = window.scrollY; return; }
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.5) current = target;
    window.scrollTo(0, current);
    lastSet = window.scrollY;
    if (current !== target) raf = requestAnimationFrame(frame);
    else { raf = 0; lastSet = -1; }
  }

  window.addEventListener('wheel', (e) => {
    if (mq.matches || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (scrollableInside(e.target)) return;
    e.preventDefault();
    if (!raf) target = current = window.scrollY;
    const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1;
    target = Math.max(0, Math.min(maxY(), target + e.deltaY * unit * SPEED));
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: false });
}
