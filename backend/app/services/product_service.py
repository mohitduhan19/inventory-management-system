from typing import List

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, DuplicateError, NotFoundError
from app.models.order import OrderItem
from app.models.product import Product
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate

_IN_USE_MESSAGE = "Cannot delete product because it is used in orders"


class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ProductRepository(db)

    def list_products(self, skip: int = 0, limit: int = 100) -> List[Product]:
        return self.repository.list(skip=skip, limit=limit)

    def get_product(self, product_id: int) -> Product:
        product = self.repository.get(product_id)
        if not product:
            raise NotFoundError(f"Product {product_id} not found")
        return product

    def create_product(self, payload: ProductCreate) -> Product:
        if self.repository.get_by_sku(payload.sku):
            raise DuplicateError(f"Product with SKU '{payload.sku}' already exists")
        product = Product(**payload.model_dump())
        return self.repository.create(product)

    def update_product(self, product_id: int, payload: ProductUpdate) -> Product:
        product = self.get_product(product_id)
        update_data = payload.model_dump(exclude_unset=True)

        new_sku = update_data.get("sku")
        if new_sku and new_sku != product.sku and self.repository.get_by_sku(new_sku):
            raise DuplicateError(f"Product with SKU '{new_sku}' already exists")

        for field, value in update_data.items():
            setattr(product, field, value)

        return self.repository.update(product)

    def delete_product(self, product_id: int) -> None:
        product = self.get_product(product_id)

        in_use = self.db.query(OrderItem).filter(OrderItem.product_id == product_id).first()
        if in_use:
            raise ConflictError(_IN_USE_MESSAGE)

        try:
            self.repository.delete(product)
        except IntegrityError:
            self.db.rollback()
            raise ConflictError(_IN_USE_MESSAGE)
