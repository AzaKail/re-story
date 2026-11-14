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
- `DB_ENGINE`: Database engine (default: `django.db.backends.postgresql`).
- `DB_NAME`: Database name (default: `bd_re_story`).
- `DB_USER`: Database username (default: `postgres`).
- `DB_PASSWORD`: Database user password.
- `DB_HOST`: Host address (default: `127.0.0.1`).
- `DB_PORT`: Port number (default: `5432`).

If `DB_ENGINE` contains `sqlite`, the settings adapt automatically to configure an SQLite database file.

#### Dependencies
- `psycopg[binary]>=3.2`: Modern PostgreSQL adapter for Python and Django 5.x.
