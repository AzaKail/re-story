# Реестр источников

Каждая картинка, текстура, 3D-модель, факт и библиотека - отдельная строка.

## Данные и контент NASA

| Что | Откуда (URL) | Лицензия / условия | Где используется |
|---|---|---|---|
| Карта Луны `lroc_color_2k.jpg` (2048×1024), версия 2025 | https://svs.gsfc.nasa.gov/4720 (NASA SVS, CGI Moon Kit; данные LRO LROC WAC) | NASA, кредит: «NASA's Scientific Visualization Studio». Условия: https://www.nasa.gov/nasa-brand-center/images-and-media/ | `static/textures/moon_2k.jpg` (пересжат JPEG q85) |
| Карта Марса `Mars_Viking_MDIM21_ClrMosaic_global_232m`, тайлы уровня 3 (16×8 по 256 px), склеены и уменьшены до 2048×1024 | https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/WMTSCapabilities.xml (NASA Solar System Treks; мозаика Viking, NASA/JPL/USGS) | NASA, кредит: «NASA Solar System Treks / Viking». Условия: https://www.nasa.gov/nasa-brand-center/images-and-media/ | `static/textures/mars_2k.jpg` |
| Карта Земли, слой `BlueMarble_NextGeneration` (2048×1024) | https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi (NASA GIBS, Blue Marble Next Generation) | данные NASA EOSDIS свободны для использования, кредит: «NASA EOSDIS GIBS / Blue Marble». https://www.earthdata.nasa.gov/engage/open-data-services-software/data-use-guidance | `static/textures/earth_2k.jpg` |

## Библиотеки кода

| Что | Откуда (URL) | Лицензия | Где используется |
|---|---|---|---|
| Django 5.2 | https://www.djangoproject.com/ | BSD-3-Clause | сервер, база, админка |
| python-dotenv | https://github.com/theskumar/python-dotenv | BSD-3-Clause | чтение `.env` |
| WhiteNoise | https://whitenoise.readthedocs.io/ | MIT | раздача статики на хостинге |
| gunicorn | https://gunicorn.org/ | MIT | веб-сервер на хостинге |
| Three.js r170 (three.module.min.js, OrbitControls, CSS2DRenderer) | https://threejs.org/ , файлы с https://cdn.jsdelivr.net/npm/three@0.170.0/ | MIT (`static/vendor/three/LICENSE`) | 3D-сцена, управление камерой, выноски (этап 3) |

## Сгенерировано в коде (не контент из внешних источников)

| Что | Как | Где |
|---|---|---|
| Звёздный фон | 5000 случайных точек, декоративный, не каталог звёзд | `static/js/scene.js` |
| Свечение Солнца | радиальный градиент на canvas | `static/js/scene.js` |
