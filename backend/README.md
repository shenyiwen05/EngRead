# Context Reader Backend

## Local Setup

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Create `.env` from `.env.example` and set `DATABASE_URL`.

For Neon/PostgreSQL, use the SQLAlchemy psycopg URL form:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

## Database Migrations

Run migrations before starting the API:

```powershell
.\.venv\Scripts\python.exe -m alembic -c alembic.ini upgrade head
```

Check current database revision:

```powershell
.\.venv\Scripts\python.exe -m alembic -c alembic.ini current
```

If a development database already has the Phase 2 tables from the old `create_all` startup path, baseline it once without deleting data:

```powershell
.\.venv\Scripts\python.exe -m alembic -c alembic.ini stamp head
```

Only use `stamp head` when the existing schema already matches the initial migration.

## Run API

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```text
http://127.0.0.1:8000/health
```

## Tests

```powershell
.\.venv\Scripts\python.exe -m pytest tests -q
```
