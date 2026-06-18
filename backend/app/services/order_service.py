from decimal import Decimal
from typing import Dict, List

from sqlalchemy.orm import Session

from app.core.exceptions import InsufficientStockError, NotFoundError, ValidationError
from app.models.order import Order, OrderItem, OrderStatus
from app.repositories.customer_repository import CustomerRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.order import OrderCreate


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.order_repository = OrderRepository(db)
        self.product_repository = ProductRepository(db)
        self.customer_repository = CustomerRepository(db)

    def list_orders(self, skip: int = 0, limit: int = 100) -> List[Order]:
        return self.order_repository.list(skip=skip, limit=limit)

    def get_order(self, order_id: int) -> Order:
        order = self.order_repository.get(order_id)
        if not order:
            raise NotFoundError(f"Order {order_id} not found")
        return order

    def create_order(self, payload: OrderCreate) -> Order:
        if not self.customer_repository.get(payload.customer_id):
            raise NotFoundError(f"Customer {payload.customer_id} not found")

        # Aggregate by product so repeated line items are validated against
        # combined demand rather than checked independently.
        requested_quantities: Dict[int, int] = {}
        for item in payload.items:
            requested_quantities[item.product_id] = (
                requested_quantities.get(item.product_id, 0) + item.quantity
            )

        products = {}
        for product_id, requested_qty in requested_quantities.items():
            product = self.product_repository.get(product_id)
            if not product:
                raise NotFoundError(f"Product {product_id} not found")
            if product.quantity < requested_qty:
                raise InsufficientStockError(
                    f"Insufficient stock for product '{product.sku}': "
                    f"requested {requested_qty}, available {product.quantity}"
                )
            products[product_id] = product

        order = Order(customer_id=payload.customer_id)
        total_amount = Decimal("0")

        for item in payload.items:
            product = products[item.product_id]
            subtotal = product.price * item.quantity
            total_amount += subtotal
            order.items.append(
                OrderItem(
                    product_id=product.id,
                    quantity=item.quantity,
                    unit_price=product.price,
                    subtotal=subtotal,
                )
            )

        for product_id, requested_qty in requested_quantities.items():
            products[product_id].quantity -= requested_qty

        order.total_amount = total_amount
        return self.order_repository.create(order)

    def update_order_status(self, order_id: int, status: OrderStatus) -> Order:
        order = self.get_order(order_id)
        if order.status == OrderStatus.CANCELLED:
            raise ValidationError("Cannot modify a cancelled order")

        if status == OrderStatus.CANCELLED:
            for item in order.items:
                item.product.quantity += item.quantity

        order.status = status
        return self.order_repository.update(order)

    def delete_order(self, order_id: int) -> None:
        order = self.get_order(order_id)
        if order.status != OrderStatus.CANCELLED:
            for item in order.items:
                item.product.quantity += item.quantity
        self.order_repository.delete(order)
