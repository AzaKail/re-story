# Silent Pioneers

An interactive 3D museum of NASA equipment left behind on the Moon and Mars.
NASA Space Apps Challenge, "Abandoned but not Forgotten".

## Run locally (about 5 minutes)

You need Python 3.12 or newer and git.

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
- Environment variables: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS=<your-host>`, `DJANGO_CSRF_TRUSTED_ORIGINS=https://<your-host>`

