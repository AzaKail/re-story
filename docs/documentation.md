# Project Documentation

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Server | Python 3.12+, Django 5.2 | pages, admin, API, chat endpoints |
| Database | PostgreSQL (`bd_re_story`), `psycopg` 3, optional `pgvector` | catalog data, chat knowledge base |
| Static files | WhiteNoise | serves JS, CSS, textures in production |
| App server | gunicorn | production WSGI server |
| 3D | Three.js r170 (bundled in `static/vendor/three/`) | scene, bodies, camera, sprites |
| Camera controls | Three.js OrbitControls | mouse and touch rotation and zoom |
| Interface | Django templates, plain CSS (Flexbox/Grid), plain ES modules | no frontend framework, no build step |
| Languages | client-side dictionary `static/js/i18n.js` (en, ru, kk); Django gettext in `ai_assistant` | interface translation |
| Chat assistant | `ai_assistant` app: Ollama (`gemma4:e2b` chat, `nomic-embed-text` embeddings), RAG | museum guide |
| Data sources | NASA SVS, NASA Solar System Treks, NASA GIBS, NASA Images (images.nasa.gov), NASA 3D Resources | textures, images, models |

### Front-end modules (`static/js/`)
- `main.js`: page state and wiring (body switch, panel, focus bar, 3D/museum transition).
- `scene.js`: `MuseumScene` (renderer, lights, bodies, textures, markers, camera limits, adaptive quality).
- `flight.js`: `CameraFlight` (animated camera moves: arc around a body or line between bodies).
- `bodies.js`: configuration of bodies, Sun and backdrop planets.
- `artifacts.js`: artifact list (placeholder until the catalog API exists).
- `panel.js`, `focusbar.js`: left objects panel and the bottom focus bar.
- `geo.js`: latitude/longitude to 3D point.
- `i18n.js`: interface strings and language switching.

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


### 2026-11-14: Objects Panel, Artifact Focus, Museum Section (UI skeleton)

#### Summary of Changes
- Left panel (`#panel`) lists the objects on the current body. It can be collapsed; on phones it starts collapsed.
- Clicking an object flies the camera close to its point on the surface and shows a yellow marker. Auto-rotation stops while an object is in focus.
- A focus bar appears at the bottom: object name, "Learn more" and a close button. Close (or `Esc`) zooms back out along the current view direction.
- "Learn more" scrolls down to the museum section (`#museum`), which has no 3D. The section has a "3D version" button that scrolls back to the top.
- The page is now one long page: the 3D block (`#experience`) is exactly one screen high, the museum follows below. Rendering pauses while the 3D block is off screen (IntersectionObserver).
- Map credits moved from the bottom-right popover (now taken by the chat button) to the footer of the museum section.

#### Placeholders
- `static/js/artifacts.js` holds one test object per body with arbitrary coordinates (not real sites). It will be replaced by the catalog API.
- The museum section text is lorem ipsum; the museum team replaces it.

#### Files
- `static/js/panel.js`: `ArtifactPanel` (render, select, collapse).
- `static/js/focusbar.js`: `FocusBar` (show, hide, Learn more, close).
- `static/js/scene.js`: `addArtifacts()`, `focusArtifact()`, `clearArtifact()`, `setRunning()`. Camera moves around the same body follow an arc (quaternion slerp), so the camera never passes through the sphere.
- `static/js/main.js`: page state (current body, focused artifact) and wiring.
- New i18n keys in `en`, `ru`, `kk`: `panel.*`, `artifact.*`, `focus.*`, `museum.*`. Removed the unused `credits.button`.

### 2026-11-14: Sharper Maps, Zoom Limit, Backdrop Planets, Dive Transition, Performance

#### Summary of Changes
- **Sharper maps.** Moon and Mars now have 2k, 4k and 8k maps. The 2k map loads first so the scene appears fast; the sharpest map the device supports (8k on desktops with `maxTextureSize >= 8192`, 4k on phones) loads in the background, only for the body being viewed.
- **Zoom limit.** The visitor cannot zoom closer than the artifact view (1.7 body radii from the centre). Closer than that the maps would look blurry.
- **Layout.** Mars moved far from the Moon and Earth (`[140, 0, -60]`); the Sun moved further out (`[400, 110, 330]`, radius 22) so the lighting direction stays the same. Flights between bodies last longer when the distance is larger (1.8 to 3.4 s).
- **Backdrop planets.** Mercury, Venus, Jupiter, Saturn, Uranus and Neptune are flat NASA photos (sprites) that always face the camera. Black space in each photo was converted to transparency.
- **"Learn more" transition.** The camera dives towards the selected object, the screen fades to black and the museum opens. The museum is a separate full-screen layer with its own scroll; scrolling cannot bring the 3D scene back. The "3D version" button fades back and the camera rises to the artifact view.
- **Performance.** Rendering stops while the museum is open. An adaptive quality loop lowers the pixel ratio by 0.25 when the frame rate falls below 40 fps and raises it back above 57 fps. Earth uses a lighter sphere (64x32 segments).

#### Data Sources
- Moon 2k/4k/8k: NASA SVS CGI Moon Kit, `lroc_color_poles_8k.tif` (https://svs.gsfc.nasa.gov/4720), downscaled. All three sizes come from the same file so colours match when the sharper map replaces the base one.
- Mars 2k/4k/8k: NASA Solar System Treks, Viking MDIM 2.1 color mosaic, 512 WMTS tiles of level 4 stitched into 8192x4096 and downscaled.
- Backdrop planets (NASA Images, images.nasa.gov): Mercury PIA15160 (MESSENGER), Venus PIA23791 (Mariner 10, natural-colour half), Jupiter PIA02873 (Cassini), Saturn PIA06193 (Cassini), Uranus PIA18182 (Voyager 2), Neptune PIA01492 (Voyager 2). Stored in `static/textures/planets/`.

#### Files
- New `static/js/flight.js` (`CameraFlight`).
- `static/js/scene.js`: detail textures, backdrop sprites, zoom limit, `diveIntoArtifact()`, `surfaceFromDive()`, adaptive quality.
- `static/js/bodies.js`: texture tiers, new positions, `BACKDROP_PLANETS`.
- `static/js/main.js`: `openMuseum()` and `backTo3D()` with the black curtain (`#fade`).
- `templates/index.html`, `static/css/main.css`: museum as a fixed layer, curtain, single-screen page.

### 2026-11-14: Knowledge Base Files and `load_knowledge` Command

#### Summary of Changes
- Added the museum texts prepared by the team to `data/knowledge/<lang>/<slug>.txt`: 11 topics in English (`en`), Russian (`ru`) and Kazakh (`kk`), 33 files in total. Exact duplicates from the source folder were skipped.
- Topics (slugs): `apollo-11`, `apollo-12`, `apollo-15`, `surveyor-3`, `mars-pathfinder`, `spirit-opportunity`, `viking-1`, `near-shoemaker`, `pioneer-10`, `kepler`, `solar-system`.
- New management command `python manage.py load_knowledge` (in `catalog/management/commands/`). It creates one `KnowledgeDocument` per file with the language of its folder and indexes it with `ai_assistant.admin.index_knowledge_document`, the same function the admin uses.
- The command is idempotent: documents are matched by (title, language); changed files are updated and re-indexed, unchanged ones are skipped, failed ones are retried on the next run. `--reindex` rebuilds everything.
- Long dashes in the texts were replaced with hyphens.

#### Motivation
The chat answers only from the knowledge base. It was empty, so every question got "no information". Keeping the texts in the repository lets every team member fill the base with one command.

#### Usage
1. Ollama must be running with `nomic-embed-text` (embeddings) and the chat model.
2. `python manage.py load_knowledge`
3. If the first run reports a timeout (the embedding model was still loading), run the command again.

Result on the reference machine: 33 documents, 735 chunks, all with embeddings.
