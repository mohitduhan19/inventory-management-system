from app.db.session import get_db  # noqa: F401
from app.utils.pagination import PaginationParams


def pagination_params(skip: int = 0, limit: int = 100) -> PaginationParams:
    return PaginationParams(skip=skip, limit=limit)
