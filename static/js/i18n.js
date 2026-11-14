// Interface strings in every supported language.
// To add a string: add the key to every language (en, ru, kk), then use
//   data-i18n="key"            -> element text
//   data-i18n-aria-label="key" -> aria-label attribute
// or t('key') in JS. Catalog content (stories, facts) will come from the API per language.

const STRINGS = {
  en: {
    'brand.sub': 'Abandoned but not forgotten',
    'nav.world': 'Choose a world',
    'nav.lang': 'Language',
    'body.moon': 'Moon',
    'body.mars': 'Mars',
    'body.earth': 'Earth',
    'scene.label': '3D view of the Moon and Mars. Drag to rotate, scroll or pinch to zoom.',
    'scene.hint': 'Drag to rotate · scroll or pinch to zoom',
    'credits.button': 'Sources',
    'credits.title': 'Surface maps',
    'error.texture': 'Could not load the {body} surface map. Showing a plain sphere instead.',
    'fallback.nowebgl': 'Your browser cannot show the 3D view (WebGL is unavailable).',
    'fallback.soon': 'A text version of the museum will appear here soon.',
  },
  ru: {
    'brand.sub': 'Оставлены, но не забыты',
    'nav.world': 'Выберите мир',
    'nav.lang': 'Язык',
    'body.moon': 'Луна',
    'body.mars': 'Марс',
    'body.earth': 'Земля',
    'scene.label': '3D-вид Луны и Марса. Перетаскивайте, чтобы вращать. Колесо мыши или два пальца меняют масштаб.',
    'scene.hint': 'Перетаскивайте, чтобы вращать · колесо или два пальца для масштаба',
    'credits.button': 'Источники',
    'credits.title': 'Карты поверхности',
    'error.texture': 'Не удалось загрузить карту поверхности ({body}). Показан однотонный шар.',
    'fallback.nowebgl': 'Ваш браузер не может показать 3D-сцену (WebGL недоступен).',
    'fallback.soon': 'Скоро здесь появится текстовая версия музея.',
  },
  kk: {
    'brand.sub': 'Тасталған, бірақ ұмытылмаған',
    'nav.world': 'Әлемді таңдаңыз',
    'nav.lang': 'Тіл',
    'body.moon': 'Ай',
    'body.mars': 'Марс',
    'body.earth': 'Жер',
    'scene.label': 'Ай мен Марстың 3D көрінісі. Айналдыру үшін сүйреңіз. Масштабты дөңгелекпен немесе екі саусақпен өзгертіңіз.',
    'scene.hint': 'Айналдыру үшін сүйреңіз · масштаб: дөңгелек немесе екі саусақ',
    'credits.button': 'Дереккөздер',
    'credits.title': 'Беткі қабат карталары',
    'error.texture': '{body} беткі картасын жүктеу мүмкін болмады. Бір түсті шар көрсетілді.',
    'fallback.nowebgl': 'Браузеріңіз 3D көріністі көрсете алмайды (WebGL қолжетімсіз).',
    'fallback.soon': 'Мұнда жақында мұражайдың мәтіндік нұсқасы пайда болады.',
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
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* not remembered */ }
  return lang;
}

let current = readFromUrl() || readSaved() || DEFAULT_LANG;

export function getLang() {
  return current;
}

export function t(key, params = {}) {
  const text = STRINGS[current][key] ?? STRINGS[DEFAULT_LANG][key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
}

export function applyTranslations(root = document) {
  document.documentElement.lang = current;
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-aria-label]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  }
}

// Switches the language, remembers it and notifies listeners (e.g. the chat):
//   window.addEventListener('langchange', (e) => e.detail.lang)
export function setLang(lang) {
  if (!LANGUAGES.includes(lang) || lang === current) return;
  current = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode: not remembered */ }
  applyTranslations();
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}
