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
    'artifact.type.placeholder': 'Equipment',
    'artifact.apollo-11-lm': 'Apollo 11 LM Eagle',
    'artifact.lrv-apollo-15': 'Lunar Roving Vehicle 1 (Apollo 15)',
    'artifact.alsep-apollo-12': 'Apollo 12 ALSEP Package',
    'artifact.surveyor-3': 'Surveyor 3',
    'artifact.sojourner': 'Sojourner Rover & Pathfinder',
    'artifact.spirit-mer-a': 'Spirit Rover (MER-A)',
    'artifact.opportunity-mer-b': 'Opportunity Rover (MER-B)',
    'artifact.viking-1': 'Viking 1 Lander',
    'artifact.phoenix-lander': 'Phoenix Mars Lander',
    'artifact.insight-lander': 'InSight Lander',
    'artifact.ingenuity': 'Ingenuity Mars Helicopter',
    'artifact.dawn': 'Dawn Spacecraft',
    'artifact.near-shoemaker': 'NEAR Shoemaker',
    'artifact.pioneer-10': 'Pioneer 10 & 11',
    'artifact.kepler': 'Kepler Space Telescope',
    'focus.more': 'Learn more',
    'focus.close': 'Close the tour',
    'museum.title': 'Museum',
    'museum.back3d': '3D version',
    'card.location': 'Location',
    'card.launch': 'Launch',
    'card.landing': 'Touchdown',
    'card.end': 'Mission End',
    'card.ask': 'Ask this artifact',
    'card.fleet': 'Sister Craft & Fleet Sites',
    'card.facts': 'Key Scientific and Engineering Facts',
    'card.sources': 'Official NASA Master Sources',
    'card.story_title': 'First-Person Narrative',
    'card.table_mission': 'Mission',
    'card.table_site': 'Site / Trajectory',
    'card.table_coords': 'Coordinates / Lifespan',
    'card.table_date': 'Date',
    'card.orbital_or_deep': 'Orbital / Deep Space',
    'card.permanent_monument': 'Permanent Silent Monument',
    'card.ask_btn': 'Ask {name}',
    'card.interstellar': 'Interstellar trajectory',
    'card.equipment': 'Equipment',
    'chat.ask_prompt': 'Tell me about the history and mission of {name}.',
    'card.meta.radius': 'Radius',
    'card.meta.gravity': 'Surface Gravity',
    'card.meta.day_length': 'Day / Sol',
    'card.meta.temperature': 'Surface Temp',
    'card.meta.heritage': 'Discarded Heritage',
    'planet.overview_title': 'Planetary History & Silent Heritage',
    'planet.facts_title': 'Key Scientific & Astronomical Facts',
    'planet.artifacts_title': 'Cataloged Pioneers & Sibling Sites',
    'planet.select_artifact_hint': 'Select an object above or on the globe to inspect its mission story.',
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
    'artifact.type.placeholder': 'Оборудование',
    'artifact.apollo-11-lm': 'Лунный модуль Apollo 11 (Eagle)',
    'artifact.lrv-apollo-15': 'Лунный автомобиль LRV-1 (Apollo 15)',
    'artifact.alsep-apollo-12': 'Научный комплект ALSEP (Apollo 12)',
    'artifact.surveyor-3': 'Сервейер-3',
    'artifact.sojourner': 'Марсоход Соджорнер и Пасфайндер',
    'artifact.spirit-mer-a': 'Марсоход Спирит (MER-A)',
    'artifact.opportunity-mer-b': 'Марсоход Оппортьюнити (MER-B)',
    'artifact.viking-1': 'Посадочный аппарат Викинг-1',
    'artifact.phoenix-lander': 'Полярная станция Феникс',
    'artifact.insight-lander': 'Сейсмическая станция InSight',
    'artifact.ingenuity': 'Марсианский вертолет Ingenuity',
    'artifact.dawn': 'Зонд Dawn',
    'artifact.near-shoemaker': 'Аппарат NEAR Shoemaker',
    'artifact.pioneer-10': 'Пионер-10 и Пионер-11',
    'artifact.kepler': 'Космический телескоп Кеплер',
    'focus.more': 'Узнать больше',
    'focus.close': 'Закрыть экскурсию',
    'museum.title': 'Музей',
    'museum.back3d': '3D-версия',
    'card.location': 'Местоположение',
    'card.launch': 'Запуск',
    'card.landing': 'Посадка',
    'card.end': 'Конец миссии',
    'card.ask': 'Спросить у аппарата',
    'card.fleet': 'Аппараты серии и места посадки',
    'card.facts': 'Ключевые факты и цифры',
    'card.sources': 'Официальные источники NASA',
    'card.story_title': 'Рассказ от первого лица',
    'card.table_mission': 'Миссия',
    'card.table_site': 'Место / Траектория',
    'card.table_coords': 'Координаты / Срок',
    'card.table_date': 'Дата',
    'card.orbital_or_deep': 'Орбита / Дальний космос',
    'card.permanent_monument': 'Вечный безмолвный памятник',
    'card.ask_btn': 'Спросить у {name}',
    'card.interstellar': 'Межзвездная траектория',
    'card.equipment': 'Оборудование',
    'chat.ask_prompt': 'Расскажи об истории и миссии аппарата {name}.',
    'card.meta.radius': 'Радиус',
    'card.meta.gravity': 'Гравитация',
    'card.meta.day_length': 'Сутки / Сол',
    'card.meta.temperature': 'Температура',
    'card.meta.heritage': 'Наследие исследований',
    'planet.overview_title': 'Планетарная история и безмолвное наследие',
    'planet.facts_title': 'Ключевые научные и астрономические факты',
    'planet.artifacts_title': 'Каталогизированные первопроходцы',
    'planet.select_artifact_hint': 'Выберите объект в списке или на 3D-глобусе, чтобы открыть карточку миссии.',
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
    'artifact.type.placeholder': 'Жабдық',
    'artifact.apollo-11-lm': 'Apollo 11 ай модулі (Eagle)',
    'artifact.lrv-apollo-15': 'Ай көлігі LRV-1 (Apollo 15)',
    'artifact.alsep-apollo-12': 'ALSEP ғылыми кешені (Apollo 12)',
    'artifact.surveyor-3': 'Сервейер-3',
    'artifact.sojourner': 'Соджорнер және Пасфайндер марсоходы',
    'artifact.spirit-mer-a': 'Спирит марсоходы (MER-A)',
    'artifact.opportunity-mer-b': 'Оппортьюнити марсоходы (MER-B)',
    'artifact.viking-1': 'Викинг-1 қону аппараты',
    'artifact.phoenix-lander': 'Феникс полярлық станциясы',
    'artifact.insight-lander': 'InSight сейсмикалық станциясы',
    'artifact.ingenuity': 'Ingenuity марс тікұшағы',
    'artifact.dawn': 'Dawn ғарыш аппараты',
    'artifact.near-shoemaker': 'NEAR Shoemaker аппараты',
    'artifact.pioneer-10': 'Пионер-10 және Пионер-11',
    'artifact.kepler': 'Кеплер ғарыш телескопы',
    'focus.more': 'Толығырақ',
    'focus.close': 'Экскурсияны жабу',
    'museum.title': 'Мұражай',
    'museum.back3d': '3D нұсқасы',
    'card.location': 'Орналасқан жері',
    'card.launch': 'Ұшыру',
    'card.landing': 'Қону',
    'card.end': 'Миссияның аяқталуы',
    'card.ask': 'Аппараттан сұрау',
    'card.fleet': 'Сериялық аппараттар және қону орындары',
    'card.facts': 'Негізгі фактілер мен деректер',
    'card.sources': 'NASA ресми дереккөздері',
    'card.story_title': 'Бірінші жақтан баяндау',
    'card.table_mission': 'Миссия',
    'card.table_site': 'Орын / Траектория',
    'card.table_coords': 'Координаттар / Мерзім',
    'card.table_date': 'Күн',
    'card.orbital_or_deep': 'Орбита / Терең ғарыш',
    'card.permanent_monument': 'Мәңгілік үнсіз ескерткіш',
    'card.ask_btn': '{name} туралы сұрау',
    'card.interstellar': 'Жұлдызаралық траектория',
    'card.equipment': 'Жабдық',
    'chat.ask_prompt': '{name} аппаратының тарихы мен миссиясы туралы айтып беріңізші.',
    'card.meta.radius': 'Радиусы',
    'card.meta.gravity': 'Тартылыс күші',
    'card.meta.day_length': 'Тәулік / Сол',
    'card.meta.temperature': 'Беткі температура',
    'card.meta.heritage': 'Зерттеу мұрасы',
    'planet.overview_title': 'Ғаламшар тарихы және үнсіз мұра',
    'planet.facts_title': 'Негізгі ғылыми және астрономиялық фактілер',
    'planet.artifacts_title': 'Каталогталған пионерлер',
    'planet.select_artifact_hint': 'Миссия карточкасын көру үшін жоғарыдағы тізімнен немесе 3D-глобустан нысанды таңдаңыз.',
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
  return LANGUAGES.includes(lang) ? lang : null;
}

export function getLang() {
  return readFromUrl() || readSaved() || DEFAULT_LANG;
}

export function setLang(lang) {
  if (!LANGUAGES.includes(lang)) return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
  document.documentElement.lang = lang;
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
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-aria-label]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  }
}
