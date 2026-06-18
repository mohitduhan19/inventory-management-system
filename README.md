# Inventory & Order Management System

A full-stack inventory and order management system: a FastAPI backend backed by
PostgreSQL, and a React (JavaScript) frontend, containerized with Docker Compose.

## Tech stack

- **Backend:** FastAPI, SQLAlchemy, Pydantic, Alembic, PostgreSQL
- **Frontend:** React, React Router, Axios, Vite
- **Infra:** Docker, Docker Compose, Nginx (serves the built frontend and proxies `/api`)

## Business rules

- Product SKU must be unique.
- Customer email must be unique.
- Product quantity can never go negative (enforced in the API and at the DB level).
- An order cannot be placed if requested quantity exceeds available stock.
- Placing an order automatically deducts the ordered quantity from inventory; cancelling
  or deleting an order restores it.
- An order's total amount is always computed server-side from product prices.

## Project structure

```
backend/    FastAPI app (app/), Alembic migrations (alembic/), tests (tests/)
frontend/   React (Vite) app (src/), with its own nginx.conf for the Docker image
docs/       Architecture notes
docker-compose.yml   Wires together postgres + backend + frontend
```

## Running with Docker Compose (recommended)

Requires Docker and Docker Compose.

```bash
cp .env.example .env   # set a real POSTGRES_PASSWORD — there is no insecure default
docker compose up --build
```

`POSTGRES_PASSWORD` has no fallback value in `docker-compose.yml`; Compose will refuse
to start until you provide one via `.env` (or your shell environment), so a real secret
never ends up hardcoded in a tracked file.

This starts three services:

| Service    | URL                              | Notes                                   |
|------------|-----------------------------------|------------------------------------------|
| `db`       | internal only (port 5432)         | PostgreSQL, data persisted in a named volume |
| `backend`  | http://localhost:8000             | Docs at `/docs`; runs Alembic migrations automatically on startup |
| `frontend` | http://localhost:3000             | Nginx serving the built React app, proxies `/api` to `backend` |

Everything except `POSTGRES_PASSWORD` has a working default. See
[Environment variables](#environment-variables) below for what else can be overridden
via the same `.env` file.

## Running locally without Docker

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # or: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # adjust POSTGRES_* values to point at your own Postgres
alembic upgrade head
uvicorn app.main:app --reload
```

API docs are then available at http://localhost:8000/docs.

Don't have Postgres or Docker available (e.g. Docker Desktop requires WSL2, which isn't
always installed)? Point the backend at a local SQLite file instead — no other service
required:

```bash
cd backend
echo DATABASE_URL=sqlite:///./dev.db > .env
alembic upgrade head
uvicorn app.main:app --reload
```

`DATABASE_URL` always takes precedence over the individual `POSTGRES_*` settings (see
`app/core/config.py`), and the same Alembic migration applies cleanly to both SQLite and
Postgres, so this is a fully working dev setup, just not what `docker-compose.yml` uses.

If every endpoint except `/health` returns `{"detail":"Internal server error"}`, the
backend almost certainly can't reach the database configured by `DATABASE_URL`/
`POSTGRES_*` (not running, wrong host/port, or migrations were never applied). Check the
uvicorn console output — the real `sqlalchemy.exc.*` error is logged there even though
the HTTP response is intentionally generic.

### Backend tests

Tests run against an in-memory SQLite database (via `httpx`/`TestClient`), so no
running Postgres is needed:

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_BASE_URL defaults to http://localhost:8000/api/v1
npm run dev
```

The app runs at http://localhost:5173.

## Environment variables

| Variable | Default | Used by |
|---|---|---|
| `POSTGRES_USER` | `postgres` | db, backend |
| `POSTGRES_PASSWORD` | **none — required, no insecure default** | db, backend |
| `POSTGRES_DB` | `inventory_db` | db, backend |
| `POSTGRES_PORT` | `5432` | db (host port mapping) |
| `PROJECT_NAME` | `Inventory & Order Management System` | backend |
| `API_V1_STR` | `/api/v1` | backend |
| `FRONTEND_PORT` | `3000` | frontend (host port mapping) |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` (dev) / `/api/v1` (production build) | frontend |

Inside Docker Compose, `backend`'s `POSTGRES_SERVER` is always set to `db` (the Postgres
service name on the compose network) regardless of the above — no manual wiring needed.

## Database migrations

Schema changes are managed with Alembic. After changing a model in `backend/app/models/`:

```bash
cd backend
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

The backend Docker image runs `alembic upgrade head` automatically via
`docker-entrypoint.sh` every time the container starts, so deployed environments always
have an up-to-date schema.

## Deploying to Render + Vercel

For a live deployment (backend on Render, frontend on Vercel, not Docker Compose), see
[`docs/deployment.md`](docs/deployment.md) for `render.yaml`, the environment variable
lists for each platform, step-by-step deployment instructions, and Docker Hub publishing
steps for the backend image.

## Submission checklist

- [ ] Code pushed to a GitHub repository.
- [ ] `render.yaml` applied as a Render Blueprint; `inventory-db` and
      `inventory-backend` both show **Live** in the Render dashboard.
- [ ] `GET https://<backend>.onrender.com/health` returns `{"status":"ok"}`, and
      `/docs` loads the Swagger UI.
- [ ] Vercel project created with **Root Directory = `frontend`**, with
      `VITE_API_BASE_URL` set to the live Render backend URL (`.../api/v1`).
- [ ] Vercel deployment succeeds and the app loads and works end-to-end against the
      live Render backend (no CORS errors in the browser console).
- [ ] `BACKEND_CORS_ORIGINS` on Render updated to the real Vercel URL and redeployed.
- [ ] Refreshing a deep link directly (e.g. `https://<app>.vercel.app/orders/1`) loads
      correctly instead of 404ing.
- [ ] Backend image pushed to Docker Hub and confirmed runnable standalone.
- [ ] `docker compose up --build` works locally end-to-end with a real `.env`
      (`POSTGRES_PASSWORD` set, no default).
- [ ] This README and `docs/deployment.md` are updated with the actual live URLs for
      whoever is reviewing the submission.

See [`docs/deployment.md`](docs/deployment.md) for the fully detailed version of this
checklist with explanations for each step.
