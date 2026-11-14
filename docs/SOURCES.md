# Реестр источников

Каждая картинка, текстура, 3D-модель, факт и библиотека - отдельная строка.

## Данные и контент NASA

| Что | Откуда (URL) | Лицензия / условия | Где используется |
|---|---|---|---|
| Карты Луны 2k, 4k, 8k: из `lroc_color_poles_8k.tif` (8192×4096, версия 2019), уменьшены до 4096 и 2048. Все три размера из одного файла, чтобы цвета совпадали при подмене | https://svs.gsfc.nasa.gov/4720 (NASA SVS, CGI Moon Kit; данные LRO LROC WAC) | NASA, кредит: «NASA's Scientific Visualization Studio». Условия: https://www.nasa.gov/nasa-brand-center/images-and-media/ | `static/textures/moon_2k.jpg`, `moon_4k.jpg`, `moon_8k.jpg` |
| Карты Марса 2k, 4k, 8k: мозаика `Mars_Viking_MDIM21_ClrMosaic_global_232m`, 512 тайлов уровня 4 (32×16 по 256 px) склеены в 8192×4096 и уменьшены | https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/WMTSCapabilities.xml (NASA Solar System Treks; мозаика Viking, NASA/JPL/USGS) | NASA, кредит: «NASA Solar System Treks / Viking». Условия: https://www.nasa.gov/nasa-brand-center/images-and-media/ | `static/textures/mars_2k.jpg`, `mars_4k.jpg`, `mars_8k.jpg` |
| Карта Земли, слой `BlueMarble_NextGeneration` (2048×1024) | https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi (NASA GIBS, Blue Marble Next Generation) | данные NASA EOSDIS свободны для использования, кредит: «NASA EOSDIS GIBS / Blue Marble». https://www.earthdata.nasa.gov/engage/open-data-services-software/data-use-guidance | `static/textures/earth_2k.jpg` |
| Фото: Меркурий (MESSENGER, глобальный вид). Обрезано по краю планеты, 512 px, чёрный фон переведён в прозрачность | https://images.nasa.gov/details/PIA15160 | NASA, условия: https://www.nasa.gov/nasa-brand-center/images-and-media/ | `static/textures/planets/mercury.png` (фон сцены) |
| Фото: Венера (Mariner 10, левая половина (естественный цвет)). Обрезано по краю планеты, 512 px, чёрный фон переведён в прозрачность | https://images.nasa.gov/details/PIA23791 | NASA, условия: https://www.nasa.gov/nasa-brand-center/images-and-media/ | `static/textures/planets/venus.png` (фон сцены) |
| Фото: Юпитер (Cassini, глобус высокого разрешения). Обрезано по краю планеты, 512 px, чёрный фон переведён в прозрачность | https://images.nasa.gov/details/PIA02873 | NASA, условия: https://www.nasa.gov/nasa-brand-center/images-and-media/ | `static/textures/planets/jupiter.png` (фон сцены) |
| Фото: Сатурн (Cassini, «The Greatest Saturn Portrait»). Обрезано по краю планеты, 512 px, чёрный фон переведён в прозрачность | https://images.nasa.gov/details/PIA06193 | NASA, условия: https://www.nasa.gov/nasa-brand-center/images-and-media/ | `static/textures/planets/saturn.png` (фон сцены) |
| Фото: Уран (Voyager 2). Обрезано по краю планеты, 512 px, чёрный фон переведён в прозрачность | https://images.nasa.gov/details/PIA18182 | NASA, условия: https://www.nasa.gov/nasa-brand-center/images-and-media/ | `static/textures/planets/uranus.png` (фон сцены) |
| Фото: Нептун (Voyager 2). Обрезано по краю планеты, 512 px, чёрный фон переведён в прозрачность | https://images.nasa.gov/details/PIA01492 | NASA, условия: https://www.nasa.gov/nasa-brand-center/images-and-media/ | `static/textures/planets/neptune.png` (фон сцены) |
| Apollo 11 Lunar Module Descent Stage (Eagle) | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C | Открытые научные данные NASA NSSDCA | `data/artifacts.json`, каталог, карточка |
| Apollo 15 Lunar Roving Vehicle (LRV-1) | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C | Открытые научные данные NASA NSSDCA | `data/artifacts.json`, каталог, карточка |
| Apollo 12 ALSEP Package | https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C | Открытые научные данные NASA NSSDCA | `data/artifacts.json`, каталог, карточка |
| Surveyor 3 Robotic Lander | https://science.nasa.gov/mission/surveyor-3/ | Открытые данные NASA Science Missions | `data/artifacts.json`, каталог, карточка |
| Mars Pathfinder and Sojourner Rover | https://science.nasa.gov/mission/mars-pathfinder/ | Открытые данные NASA Science Missions | `data/artifacts.json`, каталог, карточка |
| Spirit Rover (MER-A) | https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/ | Открытые данные NASA Science Missions | `data/artifacts.json`, каталог, карточка |
| Opportunity Rover (MER-B) | https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/ | Открытые данные NASA Science Missions | `data/artifacts.json`, каталог, карточка |
| Viking 1 Lander | https://science.nasa.gov/mission/viking-1/ | Открытые данные NASA Science Missions | `data/artifacts.json`, каталог, карточка |
| Phoenix Mars Lander | https://science.nasa.gov/mission/phoenix/ | Открытые данные NASA Science Missions | `data/artifacts.json`, каталог, карточка |
| InSight Mars Lander | https://science.nasa.gov/mission/insight/ | Открытые данные NASA Science Missions | `data/artifacts.json`, каталог, карточка |
| Ingenuity Mars Helicopter | https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/ | Открытые данные NASA Science Missions | `data/artifacts.json`, каталог, карточка |
| Dawn Spacecraft | https://science.nasa.gov/mission/dawn/ | Открытые данные NASA Science Missions | `data/artifacts.json`, каталог, карточка |
| NEAR Shoemaker | https://science.nasa.gov/mission/near-shoemaker/ | Открытые данные NASA Science Missions | `data/artifacts.json`, каталог, карточка |
| Pioneer 10 and 11 | https://science.nasa.gov/mission/pioneer-10/ | Открытые данные NASA Science Missions | `data/artifacts.json`, каталог, карточка |
| Kepler Space Telescope | https://science.nasa.gov/mission/kepler/ | Открытые данные NASA Science Missions | `data/artifacts.json`, каталог, карточка |
| Фото аппаратов в музее (поле `image_url` в `data/artifacts.json`), исправленные: Apollo 11 `as11-40-5927`, ALSEP Apollo 12 `as12-47-6919`, Surveyor 3 `AS12-48-7134`, Pioneer 10 `ARC-1972-AC72-2135`, Kepler `PIA11824` (иллюстрация NASA) | https://images.nasa.gov/ (страница снимка: https://images.nasa.gov/details/<ID>) | NASA, условия: https://www.nasa.gov/nasa-brand-center/images-and-media/ | страница аппарата в музее |
| Тексты базы знаний чата (`data/knowledge/<язык>/*.txt`, кроме `equipment-catalog.txt`) | подготовлены командой; ссылки на исходные страницы NASA нужно добавить | NASA (уточнить) | база знаний чата |

| Снимки «Тогда и сейчас» (поле `now_view` в `data/artifacts.json`): Apollo 11 `PIA12909` (LRO), Viking 1 `PIA01881` (HiRISE), Opportunity `PIA22549` (HiRISE), Phoenix `PIA22223` (HiRISE), InSight `PIA26515` (HiRISE), Ingenuity `PIA26236` (Perseverance) | https://images.nasa.gov/details/<ID> | NASA, условия: https://www.nasa.gov/nasa-brand-center/images-and-media/ | страница аппарата в музее, блок «Тогда и сейчас» |

## Библиотеки кода

| Что | Откуда (URL) | Лицензия | Где используется |
|---|---|---|---|
| Django 5.2 | https://www.djangoproject.com/ | BSD-3-Clause | сервер, база, админка |
| python-dotenv | https://github.com/theskumar/python-dotenv | BSD-3-Clause | чтение `.env` |
| WhiteNoise | https://whitenoise.readthedocs.io/ | MIT | раздача статики на хостинге |
| gunicorn | https://gunicorn.org/ | MIT | веб-сервер на хостинге |
| Three.js r170 (three.module.min.js, OrbitControls, CSS2DRenderer) | https://threejs.org/ , файлы с https://cdn.jsdelivr.net/npm/three@0.170.0/ | MIT (`static/vendor/three/LICENSE`) | 3D-сцена, управление камерой, выноски (этап 3) |
| psycopg 3 | https://www.psycopg.org/ | LGPL-3.0 | драйвер подключения PostgreSQL |

## Сгенерировано в коде (не контент из внешних источников)

| Что | Как | Где |
|---|---|---|
| Звёздный фон | 5000 случайных точек, декоративный, не каталог звёзд | `static/js/scene.js` |
| Свечение Солнца | радиальный градиент на canvas | `static/js/scene.js` |
| Жёлтые метки объектов | простые сферы, заглушка до появления моделей | `static/js/scene.js` |
