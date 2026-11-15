// Interface strings in every supported language.
// To add a string: add the key to every language (en, ru, kk), then use
//   data-i18n="key"            -> element text
//   data-i18n-aria-label="key" -> aria-label attribute
// or t('key') in JS.

const STRINGS = {
  en: {
    'brand.sub': 'Abandoned but not forgotten',
    'nav.world': 'Choose a world',
    'nav.lang': 'Language',
    'body.moon': 'Moon',
    'body.mars': 'Mars',
    'body.earth': 'Earth',
    'body.ceres': 'Ceres',
    'body.eros': '433 Eros',
    'body.solar_system': 'Deep Space',
    'scene.label': '3D view of the Moon and Mars. Drag to rotate, scroll or pinch to zoom.',
    'scene.hint': 'Drag to rotate · scroll or pinch to zoom',
    'credits.title': 'Surface maps',
    'error.texture': 'Could not load the {body} surface map. Showing a plain sphere instead.',
    'fallback.nowebgl': 'Your browser cannot show the 3D view (WebGL is unavailable).',
    'fallback.soon': 'A text version of the museum will appear here soon.',
    'panel.title': 'Objects',
    'panel.collapse': 'Collapse the list',
    'panel.expand': 'Expand the list',
    'panel.empty': 'No objects yet',
    'focus.more': 'Learn more',
    'focus.close': 'Close the tour',
    'museum.back3d': '3D version',
    'card.location': 'Location',
    'card.launch': 'Launch',
    'card.landing': 'Touchdown',
    'card.end': 'Mission End',
    'card.fleet': 'Sister Craft & Fleet Sites',
    'card.facts': 'Key Scientific and Engineering Facts',
    'card.sources': 'Official NASA Master Sources',
    'card.story_title': 'First-Person Narrative',
    'card.table_mission': 'Mission',
    'card.table_site': 'Site / Trajectory',
    'card.table_coords': 'Coordinates / Lifespan',
    'card.table_date': 'Date',
    'card.orbital_or_deep': 'Orbital / Deep Space',
    'card.ask_btn': 'Ask the guide about this object',
    'chat.ask_prompt': 'Tell me about the history and mission of {name}.',
    'card.meta.radius': 'Radius',
    'card.meta.gravity': 'Surface Gravity',
    'card.meta.day_length': 'Day / Sol',
    'card.meta.temperature': 'Surface Temp',
    'planet.facts_title': 'Key Scientific & Astronomical Facts',
    'artifact.type.lander': 'Lander',
    'artifact.type.rover': 'Rover',
    'artifact.type.helicopter': 'Helicopter',
    'artifact.type.scientific_package': 'Science package',
    'artifact.type.orbiter': 'Orbiter',
    'artifact.type.probe': 'Probe',
    'artifact.type.space_telescope': 'Space telescope',
    'artifact.type.equipment': 'Equipment',
    'card.image_credit': 'Photo: NASA',
    'museum.also_here': '{body}: other objects',
    'museum.about_body': '{body}: history and facts',
    'error.catalog': 'Could not load the equipment catalog.',
    'nav.about': 'About ReStory',
    'museum.then_now': 'Then and now',
    'museum.then': 'Then',
    'museum.now': 'Now',
    'museum.open_nasa': 'Open the image on the NASA website',
    'about.kicker': 'NASA Space Apps Challenge',
    'about.lead': 'ReStory is an interactive museum of NASA equipment that stayed forever on the Moon and Mars. Landers, rovers and a helicopter tell their own stories: why they were built, what they went through and why they fell silent.',
    'about.case_title': 'The challenge',
    'about.case': 'Abandoned but not Forgotten: storytelling about discarded NASA equipment on the Moon and Mars. The name ReStory joins three ideas: telling the story again (re-story), bringing it back from oblivion (restore) and history itself.',
    'about.how_title': 'How to explore',
    'about.how1': 'Choose the Moon or Mars at the top of the screen.',
    'about.how2': 'Pick an object in the list on the left: the camera flies to the place where it rests.',
    'about.how3': 'Press "Learn more" to open its museum page: its story, facts, NASA sources, then and now.',
    'about.how4': 'Ask the AIstronaut guide in the corner anything about the missions.',
    'about.data_title': 'NASA data we use',
    'about.data.maps': 'Surface maps',
    'about.data.catalog': 'Equipment catalog and facts',
    'about.data.photos': 'Photographs',
    'about.data.now': 'Then and now views',
    'about.chat': 'The AIstronaut guide answers only from the museum texts and the NASA sources listed here.',
    'about.team_title': 'Team',
    'about.role.scene': '3D scene and interface',
    'about.role.chat': 'AIstronaut guide',
    'about.role.catalog': 'Catalog and museum texts',
    'tour.sys': 'Mission data',
    'about.role.tour': 'Automatic tour',
    'panel.tour_short': 'Tour',
    'tour.mode.off': 'Automatic tour is off. Click to start (one object every 15 s).',
    'tour.mode.1x': 'Automatic tour: one object every 15 s. Click to speed up.',
    'tour.mode.2x': 'Automatic tour: one object every 5 s. Click to stop.',
  },
  ru: {
    'brand.sub': 'Оставлены, но не забыты',
    'nav.world': 'Выберите мир',
    'nav.lang': 'Язык',
    'body.moon': 'Луна',
    'body.mars': 'Марс',
    'body.earth': 'Земля',
    'body.ceres': 'Церера',
    'body.eros': '433 Эрос',
    'body.solar_system': 'Дальний космос',
    'scene.label': '3D-вид Луны и Марса. Перетаскивайте, чтобы вращать. Колесо мыши или два пальца меняют масштаб.',
    'scene.hint': 'Перетаскивайте, чтобы вращать · колесо или два пальца для масштаба',
    'credits.title': 'Карты поверхности',
    'error.texture': 'Не удалось загрузить карту поверхности ({body}). Показан однотонный шар.',
    'fallback.nowebgl': 'Ваш браузер не может показать 3D-сцену (WebGL недоступен).',
    'fallback.soon': 'Скоро здесь появится текстовая версия музея.',
    'panel.title': 'Объекты',
    'panel.collapse': 'Свернуть список',
    'panel.expand': 'Развернуть список',
    'panel.empty': 'Пока нет объектов',
    'focus.more': 'Узнать больше',
    'focus.close': 'Закрыть экскурсию',
    'museum.back3d': '3D-версия',
    'card.location': 'Местоположение',
    'card.launch': 'Запуск',
    'card.landing': 'Посадка',
    'card.end': 'Конец миссии',
    'card.fleet': 'Аппараты серии и места посадки',
    'card.facts': 'Ключевые факты и цифры',
    'card.sources': 'Официальные источники NASA',
    'card.story_title': 'Рассказ от первого лица',
    'card.table_mission': 'Миссия',
    'card.table_site': 'Место / Траектория',
    'card.table_coords': 'Координаты / Срок',
    'card.table_date': 'Дата',
    'card.orbital_or_deep': 'Орбита / Дальний космос',
    'card.ask_btn': 'Спросить гида об этом аппарате',
    'chat.ask_prompt': 'Расскажи об истории и миссии аппарата {name}.',
    'card.meta.radius': 'Радиус',
    'card.meta.gravity': 'Гравитация',
    'card.meta.day_length': 'Сутки / Сол',
    'card.meta.temperature': 'Температура',
    'planet.facts_title': 'Ключевые научные и астрономические факты',
    'artifact.type.lander': 'Посадочный модуль',
    'artifact.type.rover': 'Ровер',
    'artifact.type.helicopter': 'Вертолёт',
    'artifact.type.scientific_package': 'Научный комплекс',
    'artifact.type.orbiter': 'Орбитальный аппарат',
    'artifact.type.probe': 'Зонд',
    'artifact.type.space_telescope': 'Космический телескоп',
    'artifact.type.equipment': 'Оборудование',
    'card.image_credit': 'Фото: NASA',
    'museum.also_here': '{body}: другие объекты',
    'museum.about_body': '{body}: история и факты',
    'error.catalog': 'Не удалось загрузить каталог оборудования.',
    'nav.about': 'О проекте ReStory',
    'museum.then_now': 'Тогда и сейчас',
    'museum.then': 'Тогда',
    'museum.now': 'Сейчас',
    'museum.open_nasa': 'Открыть снимок на сайте NASA',
    'about.kicker': 'NASA Space Apps Challenge',
    'about.lead': 'ReStory: интерактивный музей техники NASA, которая навсегда осталась на Луне и Марсе. Посадочные модули, роверы и вертолёт сами рассказывают свои истории: зачем их создали, что они пережили и почему замолчали.',
    'about.case_title': 'Задача',
    'about.case': 'Abandoned but not Forgotten: рассказать историю оставленной техники NASA на Луне и Марсе. Название ReStory соединяет три смысла: рассказать историю заново (re-story), вернуть её из забвения (restore) и саму историю (history).',
    'about.how_title': 'Как пользоваться',
    'about.how1': 'Выберите Луну или Марс вверху экрана.',
    'about.how2': 'Выберите объект в списке слева: камера подлетит к месту, где он стоит.',
    'about.how3': 'Нажмите «Узнать больше», чтобы открыть его страницу в музее: историю, факты, источники NASA, «Тогда и сейчас».',
    'about.how4': 'Задайте гиду AIstronaut в углу любой вопрос о миссиях.',
    'about.data_title': 'Данные NASA, которые мы используем',
    'about.data.maps': 'Карты поверхности',
    'about.data.catalog': 'Каталог техники и факты',
    'about.data.photos': 'Фотографии',
    'about.data.now': 'Снимки «Тогда и сейчас»',
    'about.chat': 'Гид AIstronaut отвечает только по текстам музея и перечисленным здесь источникам NASA.',
    'about.team_title': 'Команда',
    'about.role.scene': '3D-сцена и интерфейс',
    'about.role.chat': 'Гид AIstronaut',
    'about.role.catalog': 'Каталог и тексты музея',
    'tour.sys': 'Данные миссии',
    'about.role.tour': 'Автоэкскурсия',
    'panel.tour_short': 'Экскурсия',
    'tour.mode.off': 'Автоэкскурсия выключена. Нажмите, чтобы начать (объект каждые 15 с).',
    'tour.mode.1x': 'Автоэкскурсия: объект каждые 15 с. Нажмите, чтобы ускорить.',
    'tour.mode.2x': 'Автоэкскурсия: объект каждые 5 с. Нажмите, чтобы выключить.',
  },
  kk: {
    'brand.sub': 'Тасталған, бірақ ұмытылмаған',
    'nav.world': 'Әлемді таңдаңыз',
    'nav.lang': 'Тіл',
    'body.moon': 'Ай',
    'body.mars': 'Марс',
    'body.earth': 'Жер',
    'body.ceres': 'Церера',
    'body.eros': '433 Эрос',
    'body.solar_system': 'Терең ғарыш',
    'scene.label': 'Ай мен Марстың 3D көрінісі. Айналдыру үшін сүйреңіз. Масштабты дөңгелекпен немесе екі саусақпен өзгертіңіз.',
    'scene.hint': 'Айналдыру үшін сүйреңіз · масштаб: дөңгелек немесе екі саусақ',
    'credits.title': 'Беткі қабат карталары',
    'error.texture': '{body} беткі картасын жүктеу мүмкін болмады. Бір түсті шар көрсетілді.',
    'fallback.nowebgl': 'Браузеріңіз 3D көріністі көрсете алмайды (WebGL қолжетімсіз).',
    'fallback.soon': 'Мұнда жақында мұражайдың мәтіндік нұсқасы пайда болады.',
    'panel.title': 'Нысандар',
    'panel.collapse': 'Тізімді жию',
    'panel.expand': 'Тізімді ашу',
    'panel.empty': 'Әзірге нысандар жоқ',
    'focus.more': 'Толығырақ',
    'focus.close': 'Экскурсияны жабу',
    'museum.back3d': '3D нұсқасы',
    'card.location': 'Орналасқан жері',
    'card.launch': 'Ұшыру',
    'card.landing': 'Қону',
    'card.end': 'Миссияның аяқталуы',
    'card.fleet': 'Сериялық аппараттар және қону орындары',
    'card.facts': 'Негізгі фактілер мен деректер',
    'card.sources': 'NASA ресми дереккөздері',
    'card.story_title': 'Бірінші жақтан баяндау',
    'card.table_mission': 'Миссия',
    'card.table_site': 'Орын / Траектория',
    'card.table_coords': 'Координаттар / Мерзім',
    'card.table_date': 'Күн',
    'card.orbital_or_deep': 'Орбита / Терең ғарыш',
    'card.ask_btn': 'Гидтен осы аппарат туралы сұрау',
    'chat.ask_prompt': '{name} аппаратының тарихы мен миссиясы туралы айтып беріңізші.',
    'card.meta.radius': 'Радиусы',
    'card.meta.gravity': 'Тартылыс күші',
    'card.meta.day_length': 'Тәулік / Сол',
    'card.meta.temperature': 'Беткі температура',
    'planet.facts_title': 'Негізгі ғылыми және астрономиялық фактілер',
    'artifact.type.lander': 'Қону модулі',
    'artifact.type.rover': 'Ровер',
    'artifact.type.helicopter': 'Тікұшақ',
    'artifact.type.scientific_package': 'Ғылыми кешен',
    'artifact.type.orbiter': 'Орбиталық аппарат',
    'artifact.type.probe': 'Зонд',
    'artifact.type.space_telescope': 'Ғарыш телескопы',
    'artifact.type.equipment': 'Жабдық',
    'card.image_credit': 'Фото: NASA',
    'museum.also_here': '{body}: басқа нысандар',
    'museum.about_body': '{body}: тарихы мен деректері',
    'error.catalog': 'Жабдық каталогын жүктеу мүмкін болмады.',
    'nav.about': 'ReStory жобасы туралы',
    'museum.then_now': 'Сол кезде және қазір',
    'museum.then': 'Сол кезде',
    'museum.now': 'Қазір',
    'museum.open_nasa': 'Суретті NASA сайтында ашу',
    'about.kicker': 'NASA Space Apps Challenge',
    'about.lead': 'ReStory: Ай мен Марста мәңгі қалған NASA техникасының интерактивті мұражайы. Қону модульдері, роверлер мен тікұшақ өз тарихын өздері айтады: не үшін жасалды, нені басынан өткерді және неге үнсіз қалды.',
    'about.case_title': 'Тапсырма',
    'about.case': 'Abandoned but not Forgotten: Ай мен Марста қалған NASA техникасы туралы әңгімелеу. ReStory атауы үш мағынаны біріктіреді: тарихты қайта айту (re-story), оны ұмытудан қайтару (restore) және тарихтың өзі (history).',
    'about.how_title': 'Қалай пайдалану керек',
    'about.how1': 'Экранның жоғарғы жағынан Айды немесе Марсты таңдаңыз.',
    'about.how2': 'Сол жақтағы тізімнен нысанды таңдаңыз: камера ол тұрған жерге ұшып барады.',
    'about.how3': '«Толығырақ» батырмасын басып, оның мұражайдағы бетін ашыңыз: тарихы, деректері, NASA дереккөздері, «Сол кезде және қазір».',
    'about.how4': 'Бұрыштағы AIstronaut гидіне миссиялар туралы кез келген сұрақ қойыңыз.',
    'about.data_title': 'Біз пайдаланатын NASA деректері',
    'about.data.maps': 'Беткі қабат карталары',
    'about.data.catalog': 'Техника каталогы мен деректер',
    'about.data.photos': 'Фотосуреттер',
    'about.data.now': '«Сол кезде және қазір» суреттері',
    'about.chat': 'AIstronaut гиді тек мұражай мәтіндері мен осында көрсетілген NASA дереккөздері бойынша жауап береді.',
    'about.team_title': 'Команда',
    'about.role.scene': '3D сахна және интерфейс',
    'about.role.chat': 'AIstronaut гиді',
    'about.role.catalog': 'Каталог және мұражай мәтіндері',
    'tour.sys': 'Миссия деректері',
    'about.role.tour': 'Автоэкскурсия',
    'panel.tour_short': 'Экскурсия',
    'tour.mode.off': 'Автоэкскурсия өшірулі. Бастау үшін басыңыз (әр 15 секунд сайын бір нысан).',
    'tour.mode.1x': 'Автоэкскурсия: әр 15 секунд сайын бір нысан. Жылдамдату үшін басыңыз.',
    'tour.mode.2x': 'Автоэкскурсия: әр 5 секунд сайын бір нысан. Өшіру үшін басыңыз.',
  },
};

export const LANGUAGES = Object.keys(STRINGS);
const DEFAULT_LANG = 'en';
const STORAGE_KEY = 'sp-lang';

function readSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

// A link with ?lang=ru opens the site in that language and remembers it.
function readFromUrl() {
  const lang = new URLSearchParams(location.search).get('lang');
  if (!LANGUAGES.includes(lang)) return null;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode: not remembered */ }
  return lang;
}

// Read once at start-up; afterwards only setLang() changes it.
let current = readFromUrl() || readSaved() || DEFAULT_LANG;

export function getLang() {
  return current;
}

// Switches the language, remembers it and notifies listeners (panel, museum, chat):
//   window.addEventListener('langchange', (e) => e.detail.lang)
export function setLang(lang) {
  if (!LANGUAGES.includes(lang) || lang === current) return;
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode: not remembered */ }
  applyTranslations();
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

export function t(key, params = {}) {
  const lang = getLang();
  let str = STRINGS[lang]?.[key] ?? STRINGS[DEFAULT_LANG]?.[key] ?? key;
  for (const [k, v] of Object.entries(params)) {
    str = str.replace(`{${k}}`, v);
  }
  return str;
}

export function applyTranslations() {
  document.documentElement.lang = getLang();
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-aria-label]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  }
  for (const el of document.querySelectorAll('[data-i18n-title]')) {
    el.setAttribute('title', t(el.dataset.i18nTitle));
  }
}
