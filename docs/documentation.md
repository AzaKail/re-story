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

### 2026-11-14: AIstronaut AI Assistant (RAG + Ollama)

#### Summary of Changes
- Built the `ai_assistant` Django application providing the "AIstronaut" intelligent museum assistant.
- Implemented RAG pipeline with boundary chunking, semantic overlap, and vector similarity search.
- Integrated Ollama models: `gemma4:e4b` for grounded generation and `nomic-embed-text` for 768-dimensional embeddings.
- Created `KnowledgeDocument` and `DocumentChunk` models with `AdaptiveVectorField` supporting native `pgvector` and graceful fallback.
- Added synchronous indexing on document save in Django Admin with atomic transactions, file upload validation (.txt, .md, UTF-8), and batch reindexing actions.
- Implemented streaming SSE and JSON endpoints in `ai_assistant/views.py` using native Django View.
- Developed the floating responsive frontend widget in `ai_assistant/templates/ai_assistant/widget.html`, `static/ai_assistant/css/widget.css`, and `static/ai_assistant/js/widget.js`.
- Implemented full localization across English, Russian, and Kazakh with complete key parity.
- Maintained dialog privacy by isolating conversation history solely in browser `sessionStorage` until the browser tab is closed.

#### Integration Points
The assistant integrates cleanly into the core project through exactly three files:
1. `config/settings.py`: Added `'ai_assistant'` to `INSTALLED_APPS`, configured `OLLAMA_BASE_URL`, `OLLAMA_CHAT_MODEL`, `OLLAMA_EMBED_MODEL`, and `MEDIA_ROOT`.
2. `config/urls.py`: Attached `path('ai-assistant/', include('ai_assistant.urls'))`.
3. `templates/base.html` and `templates/index.html`: Included `{% include 'ai_assistant/widget.html' %}` before `</body>`.

#### Architecture and Services
- `services/chunking.py`: Splits source text into 500-700 character chunks with 100-150 character overlap, preserving paragraph and sentence boundaries without breaking words.
- `services/embeddings.py`: Requests 768-dimension embeddings from Ollama embedding endpoints.
- `services/rag.py`: Performs cosine similarity matching against indexed knowledge chunks, constructs grounded multilingual system prompts, and prevents hallucinations.
- `services/llm.py`: Connects to Ollama `/api/chat` supporting both real-time token streaming and synchronous generation.
- `static/ai_assistant/js/widget.js`: Operates chat UI, listens for `langchange` events from the main site language switch, reads SSE stream via Fetch API, and parses formatting safely.
- `static/ai_assistant/css/widget.css`: Provides fixed floating bottom-right position (`z-index: 9999`) and expands to full screen on mobile devices (`max-width: 480px`).

### 2026-11-14: NASA Discarded Equipment Catalog and Museum Card Architecture (Stage 1)

#### Summary of Changes
- Implemented the Flagship Representative Pattern across the equipment catalog in `catalog/models.py`.
- Created relational models: `Body`, `Artifact`, and `Source` with Django Admin registration and inlines.
- Added `fleet_members` JSONField to `Artifact` to represent sibling spacecraft, landing sites, and operational timelines.
- Compiled verified NASA dataset covering 5 celestial bodies, 15 artifacts, and 16 official NASA master sources into `data/artifacts.json`.
- Implemented `seed_catalog` management command (`python manage.py seed_catalog`) with idempotent data ingestion.
- Built JSON API endpoints in `catalog/views.py`:
  - `GET /api/bodies/`: Celestial bodies with scene radii and surface texture assets.
  - `GET /api/artifacts/?body=<body_code>`: Filterable equipment list with coordinates and metadata.
  - `GET /api/artifacts/<code-or-slug>/`: Comprehensive artifact card payload including first-person story, key facts, fleet members, and NASA sources.
- Built the interactive slide-out museum card component in `static/js/card.js` with `renderFleetMembers` table generation.
- Integrated the card drawer into `templates/index.html` and styled via native CSS custom properties in `static/css/main.css`.
- Synchronized trilingual i18n keys across `en`, `ru`, and `kk` in `static/js/i18n.js` with complete key parity.
- Maintained Air-Gapped readiness with bundled offline fallback catalog in `static/js/artifacts.js`.

#### Flagship Representative Architecture
Equipment with identical hardware fleets uses a single primary Flagship card pinned to the most historic coordinates on the 3D globe:
1. Apollo Lunar Module: Flagship is Apollo 11 LM Eagle (Tranquility Base). Sister fleet table includes Apollo 12 (Intrepid), Apollo 14 (Antares), Apollo 15 (Falcon), Apollo 16 (Orion), and Apollo 17 (Challenger).
2. Lunar Roving Vehicle: Flagship is LRV-1 (Apollo 15, Hadley Rille). Sister fleet table includes Apollo 16 (LRV-2) and Apollo 17 (LRV-3).
3. ALSEP Packages: Flagship is Apollo 12 ALSEP (Ocean of Storms). Sister fleet table includes Apollo 11 EASEP, Apollo 14 ALSEP, Apollo 15 ALSEP, Apollo 16 ALSEP, and Apollo 17 ALSEP.
4. Surveyor Landers: Flagship is Surveyor 3 (Apollo 12 retrieval site). Sister fleet table includes Surveyor 1, Surveyor 5, Surveyor 6, and Surveyor 7.
5. Independent exploration craft (Spirit, Opportunity, Viking 1, Viking 2, Phoenix, InSight, Ingenuity, Dawn, NEAR Shoemaker, Pioneer 10 and 11, Kepler) maintain dedicated records.

#### Verification and Integrity
- Ran test suite: `python manage.py test catalog` (6 tests passing, 0 errors).
- Verified Django system check: `python manage.py check` (0 issues).
- All official NASA URLs cataloged in `docs/SOURCES.md`.


