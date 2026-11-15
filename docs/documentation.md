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
- `main.js`: page state and wiring (body switch, panel, focus bar, dive into the museum, language).
- `scene.js`: `MuseumScene` (renderer, lights, bodies, textures, artifact markers, camera limits, adaptive quality).
- `flight.js`: `CameraFlight` (animated camera moves: arc around a body or line between bodies).
- `bodies.js`: configuration of bodies, Sun and backdrop planets.
- `artifacts.js`: catalog API client (`loadArtifacts`, cached `loadArtifactDetail`, `localizeArtifact`).
- `museum.js`: `MuseumView`, the artifact page shown after "Learn more".
- `planet_data.js`: overview texts and figures for each body (en, ru, kk).
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
- Ran test suite: `python manage.py test catalog` (7 tests passing, 0 errors).
- Verified Django system check: `python manage.py check` (0 issues).
- All official NASA URLs cataloged in `docs/SOURCES.md`.

### 2026-11-14: Chatbot Equipment Knowledge Base Text Export

#### Summary of Changes
- Generated comprehensive UTF-8 knowledge base text documents for the AIstronaut RAG pipeline from verified NASA equipment records in `data/artifacts.json`.
- Created master segmented text document: `data/equipment_knowledge_base.txt` containing all 15 equipment records divided into three language sections:
  - Section 1: English Knowledge Base (`en`)
  - Section 2: Russian Knowledge Base (`ru`)
  - Section 3: Kazakh Knowledge Base (`kk`)
- Created three dedicated single-language documents for upload into the Django Admin `KnowledgeDocument` model:
  - `data/knowledge_base_en.txt`: English equipment dossiers.
  - `data/knowledge_base_ru.txt`: Russian equipment dossiers.
  - `data/knowledge_base_kk.txt`: Kazakh equipment dossiers.
- Created `data/build_knowledge_base.py` generator script to regenerate all knowledge base text files whenever catalog data changes.
- Formatted each vehicle entry with explicit metadata (celestial body, coordinates, launch/landing dates, status), full first-person story narratives, bulleted key engineering facts, sister fleet tables, and NASA source citations.


#### Summary of Changes
- Extended `Artifact` model with `translations` JSONField to store localized narrative stories, statuses, brief descriptions, and key facts in Russian (`ru`) and Kazakh (`kk`).
- Created migration `catalog/migrations/0002_artifact_translations.py` and applied to PostgreSQL.
- Updated `data/artifacts.json` with localized narratives, statuses, and key facts across all 15 historic NASA artifacts.
- Enhanced `catalog/views.py` endpoints (`/api/artifacts/` and `/api/artifacts/<code-or-slug>/`) to support `?lang=ru` and `?lang=kk` query parameters.
- Implemented client-side translation module in `static/js/artifact_translations.js` with `getLocalizedArtifact(artifact, lang)`.
- Updated `static/js/card.js`, `static/js/panel.js`, and `static/js/main.js` so that switching language dynamically re-renders:
  - The slide-out card drawer (stories, facts, status, labels, table headers).
  - The static museum section (`#museum`) below the 3D scene.
  - The left objects panel and bottom focus bar.
- Updated `static/js/i18n.js` with new keys for card headers, table columns, and action buttons across `en`, `ru`, `kk` with complete key parity.




### 2026-11-14: Merge of `feat/equipment-catalog` into `Cosmic-Aza`

#### Summary of Changes
- Base: the `Cosmic-Aza` 3D experience (dive into the museum, separate museum layer, detail maps). Taken from `feat/equipment-catalog`: the catalog models, API, admin, `seed_catalog`, tests, `data/artifacts.json` (15 artifacts, en/ru/kk), `planet_data.js` and the museum content design.
- The slide-out artifact card was removed. Its content now forms the museum page (`static/js/museum.js`): type and body, status, location and dates, NASA photo, first-person story, key facts, sister missions table, NASA sources, "Ask this artifact" (opens the chat with a prefilled question), other artifacts on the same body, and an overview of the body.
- Inside the museum the visitor can open another artifact of the same body; on "3D version" the camera rises next to that artifact (`MuseumScene.setFocusedArtifact()`).
- The museum header (sticky) has the "3D version" button and its own language switch.
- Markers come from the API for every artifact with surface coordinates on the Moon or Mars (4 and 7). Artifacts on other bodies (Ceres, Eros, deep space) are in the catalog but not yet in the scene.

#### Clean-up and fixes
- Removed `static/js/artifact_translations.js`: it duplicated, word for word, the translations stored in the database. Texts are now localized from the `translations` field returned by the API (`localizeArtifact`).
- Removed the bundled fallback list in `artifacts.js`: the database is the single source of truth. If the API returns nothing, a notice is shown (`error.catalog`); run `python manage.py seed_catalog`.
- Fixed `i18n.js`: `getLang()` re-read `?lang=` from the URL on every call, so the language switch stopped working when the page was opened with `?lang=`. The current language is again kept in a variable; `applyTranslations()` sets `<html lang>` again.
- Added the missing `artifact.type.*` keys (the panel showed raw keys such as `artifact.type.lander`) and removed unused keys; en, ru and kk have identical key sets (54).
- Fixed five broken image URLs in `data/artifacts.json` (wrong letter case or non-existent IDs on images.nasa.gov) and switched images to the lighter `~large` size where available. A photo that fails to load is hidden.
- Fixed the Phoenix source URL (it pointed to the InSight mission page).
- `data/build_knowledge_base.py` now writes `data/knowledge/<lang>/equipment-catalog.txt`; the old combined file mixed all languages in one document and was removed. `load_knowledge` loads these files together with the team texts.
- User-provided strings are HTML-escaped in the museum page.

#### Usage
```
python manage.py migrate
python manage.py seed_catalog            # catalog from data/artifacts.json
python data/build_knowledge_base.py      # only after editing data/artifacts.json
python manage.py load_knowledge          # chat knowledge base
```

#### Tests
`python manage.py test catalog ai_assistant`: 23 tests pass.

### 2026-11-14: Team Colour Palette and Loader Safety Nets

#### Summary of Changes
- Applied the team palette through the CSS tokens in `static/css/main.css`: Black `#000000` (background), Prussian Blue `#14213d` (panels and cards), Orange `#fca311` (accent, markers), Alabaster Grey `#e5e5e5` (body text), White `#ffffff` (headings). Text on orange buttons is Prussian Blue.
- The chat widget is recoloured to the same palette by overrides at the end of `static/css/main.css` (section "Chat widget theme"). The widget's own files in `ai_assistant/` are unchanged.
- Scene background and marker colour in `static/js/scene.js` follow the palette.
- The "Ask" button in the museum uses a fixed phrase (`card.ask_btn`) instead of inserting the artifact name, which read badly in Russian and Kazakh.
- Loader safety nets: browsers without import map support (old phones) and any start-up error now show the fallback message instead of an endless loader.

#### Viewing the site on a phone (same Wi-Fi)
1. Windows must treat the Wi-Fi as a Private network, otherwise the firewall blocks the phone.
2. Start the server on all interfaces: `python manage.py runserver 0.0.0.0:8000`.
3. Open `http://<laptop IP>:8000/` on the phone (`ipconfig` shows the IP).

### 2026-11-14: Catalog Filled by `migrate`

#### Summary of Changes
- New data migration `catalog/migrations/0003_load_initial_catalog.py` loads `data/artifacts.json`. A fresh clone now gets the full catalog with `python manage.py migrate`; before, the site stayed empty until someone ran `seed_catalog`.
- The loading logic lives in `catalog/seeding.py` (`load_catalog`), shared by the migration and the `seed_catalog` command. Loading is idempotent and also removes sources that are no longer in the file.
- `seed_catalog` is still the way to apply later edits of `data/artifacts.json`.
- Tests: `CatalogFilledByMigrationsTests` checks the catalog after migrations and that seeding twice creates no duplicates; `CatalogModelsAndApiTests` clears the pre-filled catalog in `setUp`. 31 tests pass.

### 2026-11-14: Rename to ReStory, About Page, Then and Now

#### Summary of Changes
- **Name.** The project is now called ReStory (templates, settings, README, docs, knowledge base headers). In the header the name is shown as "Re" (accent) + "Story".
- **About page.** Clicking the project name (top left, with a small "i" icon) opens a separate layer, like the museum: the challenge, how to explore in four steps, the NASA data used with links, a note that the AIstronaut guide answers only from the museum texts, and the team. It has its own "3D version" button and language switch; `Esc` closes it. Views are now `3d`, `museum` and `about` (`body[data-view]`); the scene renders only in `3d`.
- **Then and now.** Six artifacts have a present-day view of their site: Apollo 11 (LRO, PIA12909), Viking 1 (HiRISE, PIA01881), Opportunity (HiRISE, PIA22549), Phoenix (HiRISE, PIA22223), InSight (HiRISE, PIA26515), Ingenuity (Perseverance, PIA26236). On the museum page the archival photo and the present-day view are shown side by side with the year, instrument, date and a caption in en/ru/kk; the present-day image links to its NASA page. Artifacts without such a view keep a single photo.

#### Data
- New field `Artifact.now_view` (JSON: `nasa_id`, `image_url`, `page_url`, `date`, `instrument`, `caption{en,ru,kk}`), migration `0004_artifact_now_view`, data migration `0005_load_now_views`, returned by `/api/artifacts/<code>/`.
- Captions are written from the NASA image descriptions. Not found in the NASA Image and Video Library for: Apollo 12 ALSEP, Surveyor 3, Apollo 15 LRV, Spirit, Sojourner.
- `catalog/seeding.py` keeps only fields that exist on the model, so older migrations keep working on a fresh database.

#### Tests
34 tests pass (`NowViewTests` added).

### 2026-11-15: Merge of `doordom` (tour card, automatic tour), Marker Click, Showcase Keys

#### Summary of Changes
- Merged `doordom` (Zaur Kavirov): after the camera reaches an object, a draggable card appears next to its marker with a callout line, the NASA photo, type, coordinates, a short description and "Learn more"; an automatic tour (off, 1x every 15 s, 2x every 5 s) is toggled from the objects panel; the selected marker turns cyan when it moves behind the body.
- **Marker click:** clicking or tapping an orange marker selects that object. Picking uses screen distance (22 px for mouse, 34 px for touch) and only markers on the visible side of the current body; drags are treated as rotation. The cursor becomes a pointer over a marker.
- **Showcase keys for GIFs:** keys `1` and `2` fly to the Moon or Mars, hide the whole interface and start a slow camera orbit (`OrbitControls.autoRotate`). The same key again, `0` or `Esc` stops it; dragging also stops the orbit. Keys are ignored while typing in the chat.
- Tour mode switching moved into `setTourMode()`; after returning from the museum the tour resumes only if it is on.
- i18n: `applyTranslations()` now also handles `data-i18n-title`; new keys `panel.tour`, `tour.sys`, `about.role.tour` in en, ru and kk (81 keys each).
- Tour card header leaves room for the close button; long coordinates are truncated.

#### Files
- `static/js/scene.js`: `#initPicking()`, `#markerAt()`, `startShowcase()`, `stopShowcase()`, `onMarkerClick` callback.
- `static/js/main.js`: `setTourMode()`, `startCinematic()`, `stopCinematic()`, key handling.
- `static/css/main.css`: `.is-cinematic` hides the interface.

### 2026-11-15: Fresh Static Files in Development, Tour Button Label

#### Summary of Changes
- **Stale browser cache fixed.** `whitenoise.runserver_nostatic` was added to `INSTALLED_APPS`, so `runserver` serves static files through WhiteNoise. With `DEBUG` on, WhiteNoise sends `Cache-Control: max-age=0`, and browsers re-check JS and CSS on every load. Before, browsers could keep old modules after a `git pull` (for example the old focus bar instead of the tour card).
- The tour button now has a visible label ("Tour", "Экскурсия"); `panel.tour_short` key in en, ru, kk.
- Zaur Kavirov's role: "Automatic tour, object cards and chat design" (`about.role.tour`, README).
- About page: the empty footer and the line under the last team member were removed.

### 2026-11-15: Versioned Assets, Plaque Above the Marker, Tour Button States

#### Summary of Changes
- **Versioned asset URLs.** New context processor `catalog/context_processors.py` (`assets`) adds `asset_version`, a fingerprint of our JS and CSS files, and `importmap_json`. The stylesheet, the entry script and the chat widget files are linked with `?v=<version>`, and the import map points every module in `static/js/` to its versioned URL, so relative imports between modules are versioned too. A browser can no longer run an old copy of a module after an update.
- **Plaque above the marker.** The object card (tour card) is now a compact plaque: header with coordinates, a small photo on the left, type, name, a two-line description and "Learn more". It is placed centred right above the marker with a short callout line, or below it when there is no room above. It can still be dragged.
- **Tour button.** Off: outlined; 1x: orange outline with a pulse; 2x: filled orange. A speed badge shows 1x or 2x, and the tooltip and `aria-label` explain the current mode and what the next click does (`tour.mode.off`, `tour.mode.1x`, `tour.mode.2x` in en, ru, kk; the old `panel.tour` key was removed).
- **Objects list.** The selected object has an orange bar on the left and an orange name; the keyboard focus ring is drawn inside the item; the selected item scrolls into view (useful during the tour on Mars with 7 objects).
- Zaur Kavirov's role: "Automatic tour".

### 2026-11-15: NASA 3D Models on the Surface

#### Summary of Changes
- When the camera reaches an object that has an official NASA 3D model, its orange marker is replaced by the model standing on the surface. The camera looks at it at an angle, uses the surface normal as "up" and orbits the model, so visitors can turn around it and zoom (0.12 to 1.0 body radii). Objects without a model keep the orange marker.
- Only one model is loaded at a time (`static/js/surface_model.js`, `SurfaceModel`); it is freed (geometry, materials, textures) when the camera leaves. Models are loaded on demand from `static/models/`, never at start-up.
- Models are enlarged and marked so on the plaque ("3D model: <author>, enlarged"), with the author from the NASA model page.
- Apollo 11: only the descent stage stayed on the Moon, so the parts of the Lunar Module model above 45% of its height (the ascent stage) are hidden (`keep_below` in the data).
- Camera moves: to a model the camera first arcs around the body to the object, then descends; between two models it first rises, so it never flies through the ground. Flights blend the camera "up" vector (`flight.js`). Coming back from the museum works the same way.
- The plaque points at the top of the model and never goes over the top bar; on phones the objects list collapses after a selection.

#### Data
- New field `Artifact.model` (`url`, `credit`, `page_url`, optional `keep_below`), migration `0006_artifact_model` (adds the field and reloads `data/artifacts.json`), returned by both catalog API endpoints.
- Models (NASA 3D Resources, https://science.nasa.gov/3d-resources/, mirrored at https://github.com/nasa/NASA-3D-Resources):

| Object | File | Author on the NASA page |
|---|---|---|
| Apollo 11 Eagle | `apollo-lunar-module.glb` | NASA/Michael D. Carbajal |
| Viking 1 | `viking-lander.glb` | NASA/Michael D. Carbajal |
| Opportunity, Spirit (twin rovers, same design) | `mer-opportunity.glb` | NASA/Ames Research Center |
| InSight | `insight-lander.glb` (panels deployed) | NASA/Brian E. Kumanchik |
| Ingenuity | `ingenuity.glb` | NASA/Brian E. Kumanchik |

No NASA models exist for the Lunar Roving Vehicle, Surveyor, Sojourner, Phoenix or ALSEP.

#### Libraries
- Three.js `GLTFLoader`, `DRACOLoader`, `BufferGeometryUtils` (MIT) in `static/vendor/three/addons/`.
- Draco decoder (Apache-2.0) in `static/vendor/three/draco/`, needed because most NASA models use Draco mesh compression. Everything is local; no CDN.
