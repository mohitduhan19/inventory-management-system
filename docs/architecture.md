# Architecture

## Layering (backend)

```
api/v1/endpoints/*  -> services/*  -> repositories/*  -> models/* (SQLAlchemy)
                     -> schemas/*  (Pydantic request/response shapes)
```

- **Endpoints** (`app/api/v1/endpoints/`) only parse/validate the HTTP request and
  delegate to a service. One router per resource: `products`, `customers`, `orders`,
  wired together in `app/api/v1/router.py`.
- **Services** (`app/services/`) hold business logic: uniqueness checks, stock
  arithmetic, status transitions. This is the only layer that enforces business rules.
- **Repositories** (`app/repositories/`) are thin SQLAlchemy query wrappers — no
  business logic, just CRUD against the `Session`.
- **Models** (`app/models/`) define the schema: `Product`, `Customer`, `Order` +
  `OrderItem`. DB-level `CheckConstraint`s back up the same invariants the service
  layer enforces (e.g. `quantity > 0` on order items).
- Errors are raised as typed exceptions (`app/core/exceptions.py`:
  `NotFoundError`, `DuplicateError`, `InsufficientStockError`, `ValidationError`) and
  mapped to HTTP status codes in one place in `app/main.py`, instead of each endpoint
  returning `HTTPException` directly.

## Order lifecycle

`OrderService.create_order` (`app/services/order_service.py`):

1. Validates the customer exists.
2. Aggregates requested quantities per product across all line items (so two line
   items for the same product are checked against their combined demand, not
   independently).
3. Checks every requested product has enough stock; raises `InsufficientStockError`
   before any state is mutated if not.
4. Builds `OrderItem`s with `unit_price`/`subtotal` snapshotted from the product's
   current price, and sums them into `total_amount` — the client never supplies a
   total.
5. Deducts the ordered quantity from each product's stock.

Cancelling (`update_order_status` to `CANCELLED`) or deleting an order restores the
deducted quantity back to each product. A cancelled order cannot be modified further.

## Why no authentication

The technical assessment this project was built for does not require auth, so there
is no login, session, or token layer — every endpoint is open. If auth is added later,
it belongs as a dependency in `app/api/deps.py` applied per-router, not woven into the
service layer.

## Frontend

React (Vite) SPA in `frontend/src/`: `pages/` per resource (Dashboard, Products,
Customers, Orders, OrderDetails), `services/` wrapping `apiClient.js` (Axios) per
resource, `components/` for forms and shared UI. No client-side routing guards, since
there's nothing to guard.

## Deployment topologies

- **Docker Compose** (`docker-compose.yml`): `db` (Postgres) + `backend` (FastAPI,
  runs `alembic upgrade head` on boot via `docker-entrypoint.sh`) + `frontend`
  (static build served by nginx, which also reverse-proxies `/api/` to `backend` —
  see `frontend/nginx.conf`). This is the only nginx config in the repo.
- **Render + Vercel** (see [`deployment.md`](deployment.md)): backend and frontend
  deploy to separate platforms with no shared proxy, so the frontend calls the
  backend's public URL directly and CORS must be configured explicitly
  (`BACKEND_CORS_ORIGINS`).
