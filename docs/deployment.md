# Deployment: Backend on Render, Frontend on Vercel

The backend and frontend deploy to two separate platforms and talk to each other over
the public internet (unlike the Docker Compose setup, there's no shared private network
or nginx proxy in front of the backend). That means the deployment order matters:

1. Deploy the **backend** to Render first and note its public URL.
2. Deploy the **frontend** to Vercel, pointing it at that backend URL.
3. Go back to Render and lock down CORS to the real Vercel URL you just got.

## 1. Backend on Render

`render.yaml` at the repo root defines the whole backend stack as a Render Blueprint:
a free PostgreSQL database (`inventory-db`) and a Docker-based web service
(`inventory-backend`) built from `backend/Dockerfile`.

### Deployment steps

1. Push this repository to GitHub (Render Blueprints deploy from a connected repo).
2. In the Render dashboard: **New → Blueprint**, select the repo. Render reads
   `render.yaml` and proposes the `inventory-db` database and `inventory-backend`
   web service. Click **Apply**.
3. Render provisions the database first, then builds and deploys the backend image.
   `backend/docker-entrypoint.sh` runs `alembic upgrade head` automatically on every
   start, so the schema is created with no manual step.
4. Once live, note the backend's public URL, e.g. `https://inventory-backend.onrender.com`.
   Confirm it's healthy: `curl https://inventory-backend.onrender.com/health` →
   `{"status":"ok"}`. API docs are at `/docs` on that same URL.
5. **After** the frontend is deployed (step 2 below) and you have its Vercel URL, edit
   the `BACKEND_CORS_ORIGINS` environment variable on the `inventory-backend` service in
   the Render dashboard to `["https://your-app.vercel.app"]` and let it redeploy.

### Backend environment variables (Render)

| Variable | Set by | Value |
|---|---|---|
| `DATABASE_URL` | `render.yaml` (`fromDatabase`) | Auto-filled from the `inventory-db` Postgres instance — no manual entry |
| `PROJECT_NAME` | `render.yaml` | `Inventory & Order Management System` |
| `API_V1_STR` | `render.yaml` | `/api/v1` |
| `BACKEND_CORS_ORIGINS` | `render.yaml`, **edit after step 5** | `["https://your-app.vercel.app"]` |
| `PORT` | Render (automatic) | Injected by Render; the Dockerfile/entrypoint already read it — don't set manually |

## 2. Frontend on Vercel

`frontend/vercel.json` configures the build output and a catch-all rewrite to
`index.html` so direct navigation/refresh on client-side routes (e.g. `/orders/5`)
doesn't 404.

### Deployment steps

1. In the Vercel dashboard: **Add New → Project**, import the same GitHub repo.
2. Set **Root Directory** to `frontend` (this is a monorepo — Vercel needs to know the
   app doesn't live at the repo root). Vercel auto-detects the Vite framework preset
   from `frontend/package.json`.
3. Under **Settings → Environment Variables**, add `VITE_API_BASE_URL` for the
   **Production** environment, set to your Render backend URL with the API prefix, e.g.
   `https://inventory-backend.onrender.com/api/v1`. This overrides the
   `/api/v1` relative default baked into `frontend/.env.production` (that default is
   correct for the Docker/nginx deployment, not for Vercel+Render, since Vercel has no
   proxy to the backend).
4. Deploy. Vercel runs `npm run build` (per `vercel.json`) and serves `dist/`.
5. Visit the deployed URL and confirm the Dashboard/Products/Customers/Orders pages
   load data from the Render backend (open browser dev tools → Network tab to confirm
   requests go to `https://inventory-backend.onrender.com/api/v1/...` and succeed, not
   blocked by CORS).
6. Now go back to Render and finish step 5 from the backend section above with this
   exact Vercel URL.

### Frontend environment variables (Vercel)

| Variable | Where | Value |
|---|---|---|
| `VITE_API_BASE_URL` | Vercel dashboard → Project → Environment Variables (Production) | `https://<your-render-backend>.onrender.com/api/v1` |

## 3. Publishing the backend image to Docker Hub

Render's Blueprint builds the backend image directly from `backend/Dockerfile`, so
this step isn't required to deploy — it's for sharing/archiving a prebuilt image (e.g.
as a submission artifact, or so Render can pull a prebuilt image instead of building
from source).

```bash
# From the repo root. Replace <dockerhub-username> with your own.
docker login

docker build -t <dockerhub-username>/inventory-backend:latest ./backend

docker push <dockerhub-username>/inventory-backend:latest
```

Verify the published image runs standalone (against any reachable Postgres):

```bash
docker run --rm -p 8000:8000 \
  -e DATABASE_URL="postgresql+psycopg2://<user>:<password>@<host>:5432/<db>" \
  <dockerhub-username>/inventory-backend:latest
```

It should log `alembic upgrade head` running, then start Uvicorn; `curl
http://localhost:8000/health` should return `{"status":"ok"}`.

To have Render deploy this prebuilt image instead of building from source, change the
`inventory-backend` service in `render.yaml` from `runtime: docker` +
`dockerfilePath`/`dockerContext` to `runtime: image` with
`image: docker.io/<dockerhub-username>/inventory-backend:latest` (see Render's
"Deploy an existing image" docs) — push a new tag and redeploy on Render whenever the
image changes.

## Known limitations of the free tiers

- Render's free web service spins down after ~15 minutes of inactivity; the first
  request after idling will be slow (cold start) while it spins back up.
- Render's free Postgres database expires after 90 days. For anything beyond a
  demo/assessment, upgrade to a paid plan before that deadline.
- Both are otherwise fully functional for evaluating this project end-to-end.

## Final submission checklist

- [ ] Code pushed to a GitHub repository (required for both Render Blueprints and
      Vercel's GitHub integration).
- [ ] `render.yaml` applied as a Render Blueprint; `inventory-db` and
      `inventory-backend` both show **Live** in the Render dashboard.
- [ ] `GET https://<backend>.onrender.com/health` returns `{"status":"ok"}`.
- [ ] `GET https://<backend>.onrender.com/docs` loads the FastAPI Swagger UI.
- [ ] Vercel project created with **Root Directory = `frontend`**.
- [ ] `VITE_API_BASE_URL` set on Vercel to the live Render backend URL (with
      `/api/v1` suffix).
- [ ] Vercel deployment succeeds and the app loads at its `*.vercel.app` URL.
- [ ] In the deployed frontend: Dashboard stats load, Products/Customers/Orders
      pages list real data, and Add/Edit/Delete/Create Order all work against the
      live Render backend (no CORS errors in the browser console).
- [ ] `BACKEND_CORS_ORIGINS` on Render updated to the real Vercel URL (not still
      `["https://CHANGE-ME.vercel.app"]`) and the backend redeployed.
- [ ] Refreshing a deep link directly (e.g. `https://<app>.vercel.app/orders/1`)
      loads correctly instead of 404ing.
- [ ] Backend image pushed to Docker Hub (`docker push <user>/inventory-backend:latest`)
      and confirmed runnable standalone via `docker run`.
- [ ] README's deployment section (or this doc) is up to date with the actual live
      URLs for whoever is reviewing the submission.
