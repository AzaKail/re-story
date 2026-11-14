# Project Documentation

## Architecture and Configuration Updates

### 2026-11-14: PostgreSQL Database Configuration

#### Summary of Changes
- Integrated PostgreSQL support into the project for Django 5.2 and Python 3.12.
- Added database credentials and host parameters to `.env.example` and `.env`.
- Updated database engine in `config/settings.py` to connect dynamically to PostgreSQL or fallback cleanly to SQLite.
- Added `psycopg[binary]>=3.2` to `requirements.txt`.
- Applied core Django migrations to the `bd_re_story` database.

#### Motivation
The project requires a persistent, production-grade relational database backend (`bd_re_story`) running on PostgreSQL, rather than the default local SQLite file.

#### Configuration Details
The database connection is managed through the following environment variables:
- `DB_NAME`: Database name (default: `bd_re_story`).
- `DB_USER`: Database username (default: `postgres`).
- `DB_PASSWORD`: Database user password.
- `DB_HOST`: Host address (default: `127.0.0.1`).
- `DB_PORT`: Port number (default: `5432`).

#### Update: PostgreSQL only
The SQLite fallback and the `DB_ENGINE` variable were removed: the project always uses PostgreSQL
(`django.db.backends.postgresql`). The chat settings in `config/settings.py` now read
`OLLAMA_BASE_URL` and `OLLAMA_MODEL` from `.env`.

#### Dependencies
- `psycopg[binary]>=3.2`: Modern PostgreSQL adapter for Python and Django 5.x.

### 2026-11-14: 3D Scene (Space, Sun, Earth, Moon, Mars)

#### Summary of Changes
- The home page renders a full-screen 3D scene with Three.js r170, bundled locally in `static/vendor/three/` (no CDN dependency during the demo).
- Bodies: Moon and Mars are the focus bodies, Earth is a background body, the Sun is the light source with a canvas-drawn glow. The star field is procedural and decorative.
- Body sizes keep real proportions (Moon = 1, Mars = 1.95, Earth = 3.67). Distances are "museum" values, not real ones.
- Orbit controls: drag or one finger to rotate, wheel or pinch to zoom. Panning is disabled.
- Slow auto-rotation of the body; it stops when the visitor takes control and resumes after 20 seconds of inactivity.
- Moon / Mars switch with an animated camera flight. `#moon` and `#mars` in the URL open the matching body.
- The camera distance is computed from the viewport so the whole body fits on any screen size.
- `prefers-reduced-motion`: no auto-rotation, camera jumps instead of flying.
- Fallbacks: no WebGL shows a message instead of the scene; a texture load error keeps a plain-colored sphere and shows a notice.

#### Files
- `static/js/bodies.js`: body configuration (radius, position, texture, fallback color).
- `static/js/scene.js`: `MuseumScene` class (renderer, lights, bodies, controls, camera flight).
- `static/js/geo.js`: `latLonToVector3()` converts latitude/longitude to a point on a body, for artifact markers.
- `static/js/main.js`: page wiring (switches, toast, fallback).

#### Data Sources (NASA)
- Moon: NASA SVS CGI Moon Kit, `lroc_color_2k.jpg` (https://svs.gsfc.nasa.gov/4720).
- Mars: NASA Solar System Treks, Viking MDIM 2.1 color mosaic; 128 level-3 WMTS tiles stitched and downscaled to 2048x1024.
- Earth: NASA GIBS, layer `BlueMarble_NextGeneration`, 2048x1024.
- Files are stored in `static/textures/`.

### 2026-11-14: Interface Languages (en, ru, kk) and Sources Popover

#### Summary of Changes
- Added a language switch (EN / RU / KZ) under the Moon / Mars switch. On phones both switches sit in one row.
- Switching is instant and does not reload the page, so the camera and scene state are kept.
- The choice is saved in `localStorage`. A link with `?lang=ru` or `?lang=kk` opens the site in that language and saves it. Default language: English.
- NASA map credits moved from the footer into a "Sources" button in the bottom-right corner. The list appears on hover or keyboard focus; on touch screens a tap toggles it, a tap outside or `Esc` closes it.

#### Motivation
The museum is shown to an international jury (English) and to local visitors (Russian, Kazakh). Django gettext-based i18n was not used because it requires GNU gettext tools, which are not available on the team's Windows machines; a client-side dictionary also avoids a page reload.

#### Usage
- All interface strings live in `static/js/i18n.js`, one block per language (`en`, `ru`, `kk`). English is the source of truth; every key must exist in all three blocks.
- In HTML: `data-i18n="key"` sets the element text, `data-i18n-aria-label="key"` sets `aria-label`.
- In JS: `t('key', { param: value })` returns the translated string; `{param}` placeholders are substituted.
- Other modules (for example the chat) can react to a language change:
  `window.addEventListener('langchange', (e) => e.detail.lang)`.
- Catalog content (stories, facts) is not part of this dictionary; it will come from the API per language.
