# ReStory

An interactive 3D museum of NASA equipment left behind on the Moon and Mars.
NASA Space Apps Challenge, "Abandoned but not Forgotten".

## Prerequisites

- Python 3.12 or newer
- PostgreSQL (version 16 or newer)
- Ollama (for the local AIstronaut RAG assistant)

## Run Locally (About 5 Minutes)

1. Start PostgreSQL and create the database `bd_re_story`:
   ```bash
   psql -U postgres -c "CREATE DATABASE bd_re_story;"
   ```

2. Start Ollama and pull the required models:
   ```bash
   ollama pull gemma4:e4b
   ollama pull nomic-embed-text
   ```

3. Clone repository and set up virtual environment:
   ```bash
   git clone <repo-url> restory
   cd restory

   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS / Linux:
   source .venv/bin/activate

   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   # Windows PowerShell:
   copy .env.example .env
   # macOS / Linux:
   cp .env.example .env
   ```
   Open `.env` and set your PostgreSQL password in `DB_PASSWORD`.

5. Apply database migrations (this also fills the NASA equipment catalog) and start server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

Open http://127.0.0.1:8000/ to explore the 3D museum and interact with AIstronaut.

## Admin Panel and Knowledge Base

1. Create an administrator account:
   ```bash
   python manage.py createsuperuser
   ```
2. Open http://127.0.0.1:8000/admin/ and log in.
3. Under the **AI Assistant AIstronaut** section:
   - Add new `KnowledgeDocument` entries by uploading `.txt` or `.md` files (UTF-8 encoded) or entering text directly.
   - When saved, the document is automatically chunked and indexed with vector embeddings.
   - Use the "Reindex selected documents" action in the admin list view whenever needed.

## Loading the Museum Knowledge Base

The chat answers only from its knowledge base. To load the team texts from `data/knowledge/` (en, ru, kk):

```bash
python manage.py load_knowledge
```

Run it again after editing the texts: changed files are re-indexed, unchanged ones are skipped.

## Changing AI Models in .env

You can change the models at any time directly in your `.env` file without altering application code:

- `OLLAMA_CHAT_MODEL`: Name of any text generation model installed in Ollama (default: `gemma4:e4b`, e.g. `llama3.2`, `mistral`, `qwen2.5`). Restart the Django server after changing.
- `OLLAMA_EMBED_MODEL`: Name of the embedding model in Ollama (default: `nomic-embed-text`, e.g. `bge-m3`).
- `OLLAMA_EMBED_DIM`: Dimensions produced by the embedding model (default: `768`).
- Note: If you change `OLLAMA_EMBED_MODEL`, open the Django Admin panel and run "Reindex selected documents" so stored vectors match the new embedding space.

## Project Layout

```text
config/       Django settings and root URL routing
catalog/      bodies, artifacts, sources
ai_assistant/ AIstronaut RAG assistant (models, services, widget, views)
templates/    HTML templates (index.html, base.html)
static/       JavaScript modules, CSS, NASA textures and Three.js
data/         catalog source data (JSON)
docs/         project documentation
```

## Deploy (Render / Railway)

- Build command:
  ```bash
  pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
  ```
- Start command:
  ```bash
  gunicorn config.wsgi
  ```
- Required environment variables:
  - `DJANGO_SECRET_KEY`
  - `DJANGO_DEBUG=False`
  - `DJANGO_ALLOWED_HOSTS=<your-host>`
  - `DJANGO_CSRF_TRUSTED_ORIGINS=https://<your-host>`
  - Database: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
  - Ollama: `OLLAMA_BASE_URL`, `OLLAMA_CHAT_MODEL`, `OLLAMA_EMBED_MODEL`, `OLLAMA_EMBED_DIM`

## NASA Imagery and 3D Assets

- Moon: [NASA Scientific Visualization Studio, CGI Moon Kit](https://svs.gsfc.nasa.gov/4720) (LRO LROC WAC)
- Mars: [NASA Solar System Treks](https://trek.nasa.gov/mars/), Viking MDIM 2.1 color mosaic
- Earth: [NASA GIBS](https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api), Blue Marble Next Generation

3D engine: [Three.js](https://threejs.org/) r170 (MIT), bundled in `static/vendor/three/`.
