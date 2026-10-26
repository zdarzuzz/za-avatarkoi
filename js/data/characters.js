// Шесть анкет. Одинаковы во всех ситуациях.
// Тексты анкет и портреты — из Figma (MacBook Air 5, 7–11, 18).
// `forms` — падежные формы имени для персонализированных фраз.
// `anonymous` — у человека нет фотографии в анкете: внешность раскрывается только в манге,
//               а пункт «Аватар» в вопросе о причине не показывается.

const P = 'assets/images/portraits/';

export const CHARACTERS = [
  {
    id: 'sonya',
    name: 'Соня',
    age: 20,
    ageLabel: '20 лет',
    gender: 'f',
    forms: { gen: 'Сони', dat: 'Соне', acc: 'Соню', about: 'о Соне', ins: 'Соней' },
    bio: 'Учусь на дизайнера. Слушаю один трек, пока не возненавижу. люблю аниме и гулять куда глаза глядят. сначала молчу, потом рассказываю какую‑то ерунду. вы предупреждены…',
    interests: 'музыка · аниме · фотография',
    portrait: P + 'sonya.webp',
    icon: P + 'sonya.webp',
    iconMono: P + 'sonya-mono.webp',
    // положение портрета внутри овальной маски анкеты (из Figma, в % от овала 323.551×483.774)
    profileImg: { w: 99.86, h: 89.05, l: 0.19, t: 8.09 },
    iconImg: { w: 85.49, h: 113.99, l: 7.54, t: 6.03 },
  },
  {
    id: 'alina',
    name: 'Алина',
    age: 19,
    ageLabel: '19 лет',
    gender: 'f',
    forms: { gen: 'Алины', dat: 'Алине', acc: 'Алину', about: 'об Алине', ins: 'Алиной' },
    bio: 'Давайте уже куда‑нибудь сходим! танцую, снимаю видосы, знакомых нахожу даже в очереди. Если прочитала и пропала — я ответила тебе в голове ахах. лучше пни ещё раз',
    interests: 'танцы · концерты · мода',
    portrait: P + 'alina.webp',
    icon: P + 'alina-icon.webp',
    iconMono: P + 'alina-mono.webp',
    profileImg: { w: 103.54, h: 103.77, l: -1.98, t: 5 },
    iconImg: { w: 77.89, h: 116.58, l: 7.54, t: 9.55 },
  },
  {
    id: 'danya',
    name: 'Даня',
    age: 25,
    ageLabel: '25 лет',
    gender: 'm',
    forms: { gen: 'Дани', dat: 'Дане', acc: 'Даню', about: 'о Дане', ins: 'Даней' },
    bio: 'Код, игры, готовка. Только не надо «привет» и потом ждать, пока я вытяну весь разговор. Есть что сказать — пишите сразу. На ночную катку тоже можно.',
    interests: 'программирование · игры · кулинария',
    portrait: P + 'danya.webp',
    icon: P + 'danya-icon.webp',
    iconMono: P + 'danya-mono.webp',
    profileImg: { w: 132.9, h: 125.06, l: -16.51, t: 9.96 },
    iconImg: { w: 119.1, h: 167.34, l: -9.05, t: 10.05 },
  },
  {
    id: 'varya',
    name: 'Варя',
    age: 47,
    ageLabel: '47 лет',
    gender: 'f',
    forms: { gen: 'Вари', dat: 'Варе', acc: 'Варю', about: 'о Варе', ins: 'Варей' },
    bio: 'У меня есть список будущих поездок, папка с билетами и привычка менять планы перед выходом. Да, всё сразу. На аватарке опять не я. Мне просто нравится этот кадр.',
    interests: 'путешествия · архитектура · книги',
    portrait: P + 'varya.webp',
    icon: P + 'varya-icon.webp',
    iconMono: P + 'varya-mono.webp',
    // на аватарке Вари — не она сама, а рисованный зверёк; изображение отражено по горизонтали
    flip: true,
    profileImg: { w: 106.63, h: 74, l: -3.22, t: 26.08 },
    iconImg: { w: 89.25, h: 92.66, l: 6.22, t: 14.57 },
  },
  {
    id: 'mark',
    name: 'Марк',
    age: 29,
    ageLabel: '29 лет',
    gender: 'm',
    forms: { gen: 'Марка', dat: 'Марку', acc: 'Марка', about: 'о Марке', ins: 'Марком' },
    bio: 'Инженер. По выходным — баскетбол. Иногда снимаю видео с друзьями. О себе писать не умею, переписываться неделями тоже не люблю. Лучше созвониться и всё обсудить.',
    interests: 'спорт · техника · видеосъёмка',
    portrait: P + 'anonymous.webp',   // силуэт с Яндекс Диска (photo_5402266786570378778_y.jpg)
    revealPortrait: P + 'mark.webp',
    anonymous: true,
    icon: P + 'anonymous.webp',
    revealIcon: P + 'mark-icon.webp',
    iconMono: P + 'anonymous-mono.webp',
    // силуэт 282×312 вписан в овал 323.55×483.77 по ширине, без растяжения
    profileImg: { w: 100, h: 74, l: 0, t: 13 },
    revealProfileImg: { w: 99.86, h: 89.05, l: 0.19, t: 8.09 },
    iconImg: { w: 100, h: 110.6, l: 0, t: -5.3 },
    revealIconImg: { w: 87.88, h: 117.17, l: 6.03, t: 6.53 },
  },
  {
    id: 'nika',
    name: 'Ника',
    age: 67,
    ageLabel: '67 лет',
    gender: 'f',
    forms: { gen: 'Ники', dat: 'Нике', acc: 'Нику', about: 'о Нике', ins: 'Никой' },
    bio: 'Да, я купила эту штуку на барахолке. Нет, не знаю, зачем она мне. Рисую комиксы, смотрю анимацию, спорю о персонажах, будто они мои родственники. Не согласны? Отлично, обсудим.',
    interests: 'комиксы · винтаж · анимация',
    portrait: P + 'nika.webp',
    icon: P + 'nika-icon.webp',
    iconMono: P + 'nika-mono.webp',
    profileImg: { w: 109.1, h: 97.15, l: -11.25, t: 4.38 },
    iconImg: { w: 86.37, h: 115.16, l: 0, t: 11.06 },
  },
];

export const CHARACTER_IDS = CHARACTERS.map((c) => c.id);

export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id);

// Варианты ответа в опросе после «Продолжить общение» (MacBook Air 12)
export const REASONS = [
  { id: 'avatar', label: 'Аватар' },
  { id: 'bio', label: 'Описание' },
  { id: 'interests', label: 'Общие интересы' },
  { id: 'little', label: 'Мало информации' },
  { id: 'style', label: 'Стиль речи' },
  { id: 'feeling', label: 'Просто ощущение' },
];

export const getReason = (id) => REASONS.find((r) => r.id === id);

/** Варианты причины для конкретного человека: без «Аватара», если фотографии не было. */
export const reasonsFor = (character) =>
  REASONS.filter((r) => !(r.id === 'avatar' && character.anonymous));

// Вопрос об уверенности — один раз, после всех анкет
export const CONFIDENCE = [
  { id: 'sure', label: 'Почти во всех' },
  { id: 'some', label: 'В некоторых' },
  { id: 'unsure', label: 'Почти ни в каких' },
  { id: 'unknown', label: 'Сложно сказать' },
];
