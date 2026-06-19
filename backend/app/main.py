import logging
import re

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    AppError,
    ConflictError,
    DuplicateError,
    InsufficientStockError,
    NotFoundError,
    ValidationError,
)
from app.core.logging import configure_logging

configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Always allow any localhost/127.0.0.1 port on top of BACKEND_CORS_ORIGINS, so picking up
# a different Vite dev server port (5174, 5175, ...) doesn't require an env change. This
# never matches a real production origin, so it's safe alongside the explicit allowlist.
_LOCALHOST_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=_LOCALHOST_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_ERROR_STATUS_MAP = {
    NotFoundError: 404,
    DuplicateError: 409,
    ConflictError: 409,
    InsufficientStockError: 422,
    ValidationError: 400,
}


@app.exception_handler(AppError)
def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
    status_code = _ERROR_STATUS_MAP.get(type(exc), 400)
    return JSONResponse(status_code=status_code, content={"detail": exc.message})


def _is_allowed_origin(origin: str) -> bool:
    allowed = settings.BACKEND_CORS_ORIGINS
    return "*" in allowed or origin in allowed or re.fullmatch(_LOCALHOST_ORIGIN_REGEX, origin) is not None


def _cors_headers_for_origin(request: Request) -> dict:
    # Starlette special-cases handlers registered for the bare `Exception` type:
    # it pulls them out of ExceptionMiddleware (which sits *inside* CORSMiddleware)
    # and hands them to the outer ServerErrorMiddleware instead, which sits
    # *outside* CORSMiddleware. That means a response built here never passes
    # back through CORSMiddleware, so we have to add the CORS headers ourselves
    # or every unhandled error looks like a CORS failure in the browser instead
    # of the real 500.
    origin = request.headers.get("origin")
    if not origin or not _is_allowed_origin(origin):
        return {}
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
    }


@app.exception_handler(Exception)
def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=_cors_headers_for_origin(request),
    )


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["health"])
def root() -> dict:
    return {
        "message": f"{settings.PROJECT_NAME} API",
        "status": "running",
        "docs": "/docs",
        "api_base": settings.API_V1_STR,
    }


@app.get("/health", tags=["health"])
def health_check() -> dict:
    return {"status": "ok"}
