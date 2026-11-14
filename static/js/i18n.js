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
    'card.ask_btn': 'Ask {name}',
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
    'card.ask_btn': 'Спросить у {name}',
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
    'card.ask_btn': '{name} туралы сұрау',
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
}
