class AppError(Exception):
    """Base class for application-level errors mapped to HTTP responses."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class NotFoundError(AppError):
    pass


class DuplicateError(AppError):
    pass


class ConflictError(AppError):
    pass


class InsufficientStockError(AppError):
    pass


class ValidationError(AppError):
    pass
