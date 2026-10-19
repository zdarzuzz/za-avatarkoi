// Генерирует сценарии и промпты для новых историй из js/data/stories.js.
// Запуск из корня проекта:  node tools/build-storyboards.mjs
// Результат: docs/storyboards/<situation>-<character>.md, docs/expected-assets.md, docs/expected-assets.json.
// Сайт этот скрипт не использует — он нужен только для подготовки иллюстраций.

import { mkdirSync, writeFileSync } from 'node:fs';
import { STORIES } from '../js/data/stories.js';
import { getCharacter } from '../js/data/characters.js';
import { getSituation } from '../js/data/situations.js';

const STYLE =
  'Single manga panel. Monochrome crimson-red ink (#C03740) on warm cream paper (#FBEED5): fine seinen-manga linework, ' +
  'halftone screentone and dot-gradient shading, only red and cream, no other colours. No text, no letters, no speech bubbles, ' +
  'no panel border, no watermark.';
const COMPANION =
  'The companion (the reader) appears only from behind or partially — back of the head, shoulder or hands, short hair, plain hoodie — face never visible.';

const zone = (b) => {
  const v = b.y < 40 ? 'top' : b.y > 55 ? 'bottom' : 'middle';
  const cx = b.x + b.w / 2;
  const h = cx < 40 ? 'left' : cx > 60 ? 'right' : 'centre';
  return `${v}-${h}`;
};

const size = (w, h) => {
  // рекомендуемый размер файла: ширина 1600 для широких кадров, 1200 для узких, высота по пропорции кадра
  const W = w > 600 ? 1600 : 1200;
  return { w: W, h: Math.round((W * h) / w) };
};

mkdirSync('docs/storyboards', { recursive: true });

const expected = [];
const index = [];

for (const story of STORIES) {
  const c = getCharacter(story.characterId);
  const sit = getSituation(story.situationId);
  if (story.source === 'figma') {
    index.push(`- ${sit.title} · ${c.name} — готовая история из Figma (кадры в assets/images/manga/${sit.id}/${c.id}-1…7.webp)`);
    continue;
  }
  const file = `docs/storyboards/${sit.id}-${c.id}.md`;
  index.push(`- [${sit.title} · ${c.name}](storyboards/${sit.id}-${c.id}.md)`);
  let md = `# ${sit.title} · ${c.name}, ${c.ageLabel}\n\n`;
  md += `**Заголовок в истории:** ${sit.storyTitle}  \n`;
  md += `**Ситуация:** ${sit.description}\n\n`;
  md += c.id === 'varya'
    ? `**Внешность:** ${c.look}. Аватар \`${c.portrait}\` — не она, его не рисовать.  \n`
    : `**Внешность (референс — \`${c.portrait}\`):** ${c.look}.  \n`;
  md += `**Appearance reference:** ${c.lookEn}.\n\n`;
  md += `**Анкета:** ${c.bio} Интересы: ${c.interests}.\n\n`;
  md += `**Подпись после манги:** ${story.closing}\n\n`;
  md += `## Кадры\n\n`;
  let n = 0;
  for (const row of story.rows) {
    for (const p of row.panels) {
      n += 1;
      const ratio = (p.w / row.h).toFixed(2);
      const sz = size(p.w, row.h);
      const kind = row.panels.length > 1 ? 'узкий (пара в ряду)' : 'широкий';
      const lines = p.bubbles.length
        ? p.bubbles.map((b) => `  - ${b.you ? 'Ты' : c.name}: «${b.text}» — зона ${zone(b)}`).join('\n')
        : '  - без реплик';
      const zones = [...new Set(p.bubbles.map(zone))];
      const prompt = [
        STYLE,
        c.id === 'varya'
          ? `Character: ${c.lookEn}. Her profile avatar (${c.portrait}) is a drawn fluffy creature, not her — do not draw the creature; draw the woman described and keep her consistent across all frames.`
          : `Character: ${c.lookEn}. Keep the same face, hair and outfit as the reference portrait ${c.portrait}.`,
        `Scene (Russian description): ${p.scene}`,
        COMPANION,
        `Aspect ratio ${p.w}:${row.h} (≈${ratio}:1), output ${sz.w}×${sz.h}.`,
        zones.length
          ? `Keep the ${zones.join(', ')} area calm and uncluttered for speech bubbles that will be added later as HTML.`
          : 'Full-bleed composition, no empty area needed.',
      ].join(' ');
      md += `### Кадр ${n} — ${kind}, ${p.w}×${row.h} (≈${ratio}:1)\n\n`;
      md += `- **Файл:** \`${p.img}\` — рекомендуемый размер ${sz.w}×${sz.h} px, WebP\n`;
      md += `- **Сцена и действие:** ${p.scene}\n`;
      md += `- **Реплики (накладываются HTML-текстом, на изображении текста нет):**\n${lines}\n`;
      md += `- **Промпт:**\n\n\`\`\`text\n${prompt}\n\`\`\`\n\n`;
      expected.push({
        file: p.img,
        situation: sit.id,
        character: c.id,
        frame: n,
        layout: row.panels.length > 1 ? 'half' : 'full',
        aspect: `${p.w}:${row.h}`,
        recommendedSize: `${sz.w}x${sz.h}`,
        ready: Boolean(p.ready),
      });
    }
  }
  md += `## Авторский комментарий (для сверки сцен)\n\n`;
  md += story.comments.map((o) => `- **${o.title}.** ${o.text}`).join('\n') + '\n';
  writeFileSync(file, md);
}

expected.push({
  file: 'assets/images/illustrations/travel-notebook.png',
  section: 'Статьи → «Первое впечатление продолжается»',
  aspect: '1290:480',
  recommendedSize: '2580x960 (или любой размер с прозрачным/кремовым фоном — вписывается целиком)',
  ready: false,
});

writeFileSync('docs/expected-assets.json', JSON.stringify(expected, null, 2) + '\n');

const missing = expected.filter((e) => !e.ready);
let list = `# Ожидаемые файлы\n\n`;
list += `Плейсхолдеры на сайте уже занимают точный размер и пропорции будущих кадров. `;
list += `Чтобы заменить плейсхолдер, положи файл по указанному пути и впиши путь в \`js/data/manga-manifest.js\` (\`MANGA_READY\` для кадров, \`ILLUSTRATIONS\` для блокнота). Вёрстку менять не нужно.\n\n`;
list += `Всего ожидается: ${expected.length} файлов, не хватает: ${missing.length}.\n\n`;
list += `## Сценарии\n\n${index.join('\n')}\n\n`;
list += `## Файлы\n\n| Файл | Кадр | Пропорция | Рекомендуемый размер | Готов |\n|---|---|---|---|---|\n`;
list += expected
  .map((e) => `| \`${e.file}\` | ${e.frame ? `${e.situation}/${e.character} · ${e.frame} · ${e.layout}` : e.section} | ${e.aspect} | ${e.recommendedSize} | ${e.ready ? 'да' : 'нет'} |`)
  .join('\n');
list += '\n';
writeFileSync('docs/expected-assets.md', list);

console.log(`storyboards: ${index.length - 2} new, expected files: ${expected.length}, missing: ${missing.length}`);
