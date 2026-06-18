#!/bin/sh
set -e

alembic upgrade head

exec "$@" --port "${PORT:-8000}"
