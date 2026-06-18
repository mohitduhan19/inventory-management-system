from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderItem


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self):
        return self.db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.product)
        )

    def get(self, order_id: int) -> Optional[Order]:
        return self._base_query().filter(Order.id == order_id).first()

    def list(self, skip: int = 0, limit: int = 100) -> List[Order]:
        return self._base_query().order_by(Order.id.desc()).offset(skip).limit(limit).all()

    def create(self, order: Order) -> Order:
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def update(self, order: Order) -> Order:
        self.db.commit()
        self.db.refresh(order)
        return order

    def delete(self, order: Order) -> None:
        self.db.delete(order)
        self.db.commit()
