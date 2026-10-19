// Обложка, управляемая обычной вертикальной прокруткой.
// Сцена закреплена (position: sticky), прогресс нормализован 0…1 и работает в обе стороны.
// Координаты зрачка заданы в системе изображения из Figma (1440 × 1148): соринка Ellipse 2
// лежит в (736, 574) Ø22 → центр (747, 585); зрачок с бревном в image 23 — центр ≈ (757, 591), Ø ≈ 205.
// Положение пересчитывается от текущего размера окна, а не от координат документа.

import { reducedMotion, onMotionChange } from './animations.js';

const IMG_W = 1440;
const IMG_H = 1148;
const FRAME_H = 999;                 // высота фрейма MacBook Air 2: изображение упирается в его низ
const PUPIL = { x: 754, y: 589 };    // центр зрачка
const PUPIL_D = 205;                 // диаметр зрачка в координатах изображения
const MOTE_D = 22;                   // соринка
const LOG_FINAL = 198;               // спил в MacBook Air 3/4, при ширине 1440

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => 1 - (1 - t) ** 3;
const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a, b, t) => a + (b - a) * t;

export function initIntro({ onPassed } = {}) {
  const section = document.getElementById('intro');
  if (!section) return;
  const stage = section.querySelector('.intro__stage');
  const face = section.querySelector('.intro__face');
  const title = section.querySelector('.intro__title');
  const mote = section.querySelector('.intro__mote');
  const log = section.querySelector('.intro__log');
  const hint = section.querySelector('.intro__hint');
  // Спил из блока контекста: на десктопе блок наезжает на закреплённую сцену,
  // и спил обложки «передаётся» ему ровно в центре экрана.
  const ctxLog = document.querySelector('.context .log-mark');
  const handoff = () => W > 1024 && !reducedMotion();

  let W = 0;
  let H = 0;
  let geo = null;
  let ticking = false;
  let passed = false;

  function measure() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    const shift = Math.min(W * 0.06, 90); // «смещение вправо»
    // запас по ширине, чтобы при сдвиге вправо не открывался край изображения
    const s = Math.max((W + shift) / IMG_W, H / FRAME_H);
    const imgW = IMG_W * s;
    const imgH = IMG_H * s;
    // По горизонтали — по центру, но на узких экранах держим зрачок в кадре
    let baseX = (W - imgW) / 2 - shift / 2;
    if (W / H < IMG_W / FRAME_H) baseX = clamp(W * 0.5 - PUPIL.x * s, W - imgW, -shift);
    const baseY = H - imgH;          // как в макете: низ картинки = низ экрана
    const u = Math.min(W, 1440) / 1440;
    geo = { s, baseX, baseY, shift, logFinal: Math.max(LOG_FINAL * u, 96) };
  }

  function render() {
    ticking = false;
    if (!geo) measure();
    const rect = section.getBoundingClientRect();
    const track = section.offsetHeight - H;
    const raw = track > 0 ? clamp(-rect.top / track) : 1;
    // последние 22 % дорожки — пауза: на кремовом экране остаётся только спил
    const p = clamp(raw / 0.78);
    const rm = reducedMotion();
    const { s, baseX, baseY, shift, logFinal } = geo;

    // 1–2. Сдвиг композиции вправо и уход заголовка вверх
    const tShift = ease(range(p, 0, 0.3));
    const tTitle = easeInOut(range(p, 0.02, 0.28));
    // 4–5. Приближение к зрачку, соринка → спил
    const tZoom = easeInOut(range(p, 0.24, 0.66));
    const zoom = rm ? 1 : lerp(1, 1.35, tZoom);

    const pupilX = baseX + (rm ? 0 : shift * tShift) + PUPIL.x * s;
    const pupilY = baseY + PUPIL.y * s;
    const faceX = pupilX - PUPIL.x * s * zoom;
    const faceY = pupilY - PUPIL.y * s * zoom;

    // 6. Лицо исчезает
    const faceOpacity = 1 - range(p, 0.56, 0.8);
    face.style.transform = `translate3d(${faceX}px, ${faceY}px, 0) scale(${s * zoom})`;
    face.style.opacity = faceOpacity;

    title.style.transform = rm ? 'none' : `translate3d(${shift * tShift * 0.3}px, ${-tTitle * H * 0.42}px, 0)`;
    title.style.opacity = 1 - tTitle;
    hint.style.opacity = 1 - range(p, 0, 0.05);

    // Соринка появляется в зрачке и растёт
    const tMote = range(p, 0.24, 0.36);
    const tGrow = easeInOut(range(p, 0.34, 0.62));
    const pupilD = PUPIL_D * s * zoom;
    const moteD = rm ? pupilD : lerp(MOTE_D * s * zoom, pupilD, tGrow);
    // 7. Спил переезжает в центр экрана и уменьшается до размера из MacBook Air 3
    const tCenter = easeInOut(range(p, 0.72, 0.94));
    let targetX = W / 2;
    let targetD = logFinal;
    let ctxRect = null;
    if (handoff() && ctxLog) {
      ctxRect = ctxLog.getBoundingClientRect();
      targetX = ctxRect.left + ctxRect.width / 2;
      targetD = ctxRect.width;
    }
    const cx = rm ? W / 2 : lerp(pupilX, targetX, tCenter);
    const cy = rm ? H / 2 : lerp(pupilY, H / 2, tCenter);
    const d = rm ? logFinal : lerp(moteD, targetD, tCenter);

    const moteOpacity = rm ? 0 : tMote * (1 - range(p, 0.4, 0.52));
    mote.style.opacity = moteOpacity;
    mote.style.transform = `translate3d(${cx - 11}px, ${cy - 11}px, 0) scale(${moteD / 22})`;

    let logOpacity = rm ? range(p, 0.55, 0.8) : range(p, 0.38, 0.52);
    if (ctxRect) {
      // когда спил контекста дошёл до центра экрана — он заменяет спил обложки
      const reached = ctxRect.top + ctxRect.height / 2 <= H / 2 + 1;
      if (reached) logOpacity = 0;
      ctxLog.style.opacity = reached ? 1 : 0;
    } else if (ctxLog) {
      ctxLog.style.opacity = '';
    }
    log.style.opacity = logOpacity;
    log.style.transform = `translate3d(${cx - 50}px, ${cy - 50}px, 0) scale(${d / 100})`;

    if (!passed && raw >= 0.99) {
      passed = true;
      onPassed?.();
    }
  }

  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  };

  const onResize = () => {
    measure();
    request();
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', onResize);
  onMotionChange(onResize);
  const eye = face.querySelector('img');
  if (eye && !eye.complete) eye.addEventListener('load', onResize, { once: true });
  measure();
  render();
}
