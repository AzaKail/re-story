# Silent Pioneers

An interactive 3D museum of NASA equipment left behind on the Moon and Mars.
NASA Space Apps Challenge, "Abandoned but not Forgotten".

## Run locally (about 5 minutes)

You need Python 3.12 or newer, git and PostgreSQL.

1. Start PostgreSQL and create an empty database `bd_re_story`
   (pgAdmin, or `psql -U postgres -c "CREATE DATABASE bd_re_story;"`).
2. Then:

```bash
git clone <repo-url> silent-pioneers
cd silent-pioneers

python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # Windows PowerShell: copy .env.example .env
# put your PostgreSQL password into DB_PASSWORD in .env

python manage.py migrate
python manage.py runserver
```

Open http://127.0.0.1:8000/.

Admin panel: create a user with `python manage.py createsuperuser`, then open http://127.0.0.1:8000/admin/.

## Project layout

```
config/      Django settings
catalog/     bodies, artifacts, sources
chat/        chat bot (stage 6)
templates/   HTML templates
static/      js, css, NASA textures and models
data/        catalog source data (JSON)
```

## Deploy (Render / Railway)

- Build: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- Start: `gunicorn config.wsgi`
- Environment variables: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS=<your-host>`, `DJANGO_CSRF_TRUSTED_ORIGINS=https://<your-host>`, and `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` of the hosted PostgreSQL


## NASA imagery

- Moon: [NASA Scientific Visualization Studio, CGI Moon Kit](https://svs.gsfc.nasa.gov/4720) (LRO LROC WAC)
- Mars: [NASA Solar System Treks](https://trek.nasa.gov/mars/), Viking MDIM 2.1 color mosaic
- Earth: [NASA GIBS](https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api), Blue Marble Next Generation

3D engine: [Three.js](https://threejs.org/) r170 (MIT), bundled in `static/vendor/three/`.
