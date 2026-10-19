// Шесть анкет. Одинаковы во всех ситуациях.
// Тексты анкет и портреты взяты из Figma (фреймы MacBook Air 5, 7–11).
// `forms` — падежные формы имени для персонализированных фраз.
// `look` — описание внешности, которое используется как референс в промптах иллюстраций.

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
    look: 'девушка 20 лет, тёмные волосы чуть ниже подбородка с боковым пробором, прямоугольные очки в тонкой оправе, бретельный топ или свободная рубашка, наушники на шее, спокойное немного отстранённое лицо',
    lookEn: 'a 20-year-old young woman, dark chin-length bob with side part, thin rectangular glasses, strappy top or loose shirt, headphones around neck, calm slightly detached face',
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
    look: 'девушка 19 лет, длинные волнистые волосы с двумя заколками, большие выразительные глаза, свитер с норвежским узором, телефон в руке, живая мимика',
    lookEn: 'a 19-year-old young woman, long wavy hair with two hair clips, big expressive eyes, Nordic-pattern knit sweater, phone in hand, lively facial expressions',
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
    look: 'молодой человек 25 лет, взъерошенные волосы средней длины, белая рубашка, тёмный жилет и свободно завязанный галстук, спокойная лёгкая полуулыбка',
    lookEn: 'a 25-year-old young man, tousled medium-length hair, white shirt, dark vest and loosely knotted tie, calm slight half-smile',
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
    look: 'женщина 47 лет, короткое волнистое каре с седыми прядями, круглые серьги, светлый тренч, холщовая сумка с картонной папкой билетов, живое любопытное лицо (на аватарке у неё не она, а рисованный пушистый зверёк — в манге она сама)',
    lookEn: 'a 47-year-old woman, short wavy bob with grey streaks, round earrings, light trench coat, canvas tote with a cardboard folder of tickets, lively curious face',
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
    portrait: P + 'mark.webp',
    icon: P + 'mark-icon.webp',
    iconMono: P + 'mark-mono.webp',
    profileImg: { w: 99.86, h: 89.05, l: 0.19, t: 8.09 },
    iconImg: { w: 87.88, h: 117.17, l: 6.03, t: 6.53 },
    look: 'мужчина 29 лет, длинные растрёпанные волнистые волосы до плеч, расстёгнутая спортивная куртка на молнии, тёмная футболка, кулон на цепочке, задумчивый взгляд в сторону, иногда камера в руках',
    lookEn: 'a 29-year-old man, long messy wavy shoulder-length hair, unzipped sports track jacket, dark t-shirt, pendant on a chain, thoughtful sideways glance, sometimes holds a camera',
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
    look: 'женщина 67 лет азиатской внешности, волосы убраны в косу вокруг головы, серьги-капли, слоистая винтажная одежда с вышитым воротником, морщинки, внимательный прямой взгляд, блокнот для скетчей',
    lookEn: 'a 67-year-old East Asian woman, hair braided in a crown around her head, drop earrings, layered vintage clothes with an embroidered collar, fine wrinkles, attentive direct gaze, sketchbook',
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
