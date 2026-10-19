// Манифест готовых изображений. Плейсхолдеры заменяются без изменения вёрстки:
// положите файл по ожидаемому пути и впишите путь сюда.
// Полный список ожидаемых файлов — docs/expected-assets.md и docs/expected-assets.json.

// Сгенерированные кадры манги, которые уже лежат в проекте.
// Пример: 'assets/images/manga/trip/danya-1.webp'
export const MANGA_READY = [];

// Отдельные иллюстрации статей. null — файла пока нет, показывается плейсхолдер.
export const ILLUSTRATIONS = {
  // Раскрытый блокнот с маршрутом и карандашом — глава «Первое впечатление продолжается».
  // Когда файл будет добавлен, замените null на путь:
  // travelNotebook: 'assets/images/illustrations/travel-notebook.png',
  travelNotebook: null,
};
