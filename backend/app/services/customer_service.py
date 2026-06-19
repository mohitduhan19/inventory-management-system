from typing import List

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, DuplicateError, NotFoundError
from app.models.customer import Customer
from app.models.order import Order
from app.repositories.customer_repository import CustomerRepository
from app.schemas.customer import CustomerCreate, CustomerUpdate

_IN_USE_MESSAGE = "Cannot delete customer because it has existing orders"


class CustomerService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = CustomerRepository(db)

    def list_customers(self, skip: int = 0, limit: int = 100) -> List[Customer]:
        return self.repository.list(skip=skip, limit=limit)

    def get_customer(self, customer_id: int) -> Customer:
        customer = self.repository.get(customer_id)
        if not customer:
            raise NotFoundError(f"Customer {customer_id} not found")
        return customer

    def create_customer(self, payload: CustomerCreate) -> Customer:
        if self.repository.get_by_email(payload.email):
            raise DuplicateError(f"Customer with email '{payload.email}' already exists")
        customer = Customer(**payload.model_dump())
        return self.repository.create(customer)

    def update_customer(self, customer_id: int, payload: CustomerUpdate) -> Customer:
        customer = self.get_customer(customer_id)
        update_data = payload.model_dump(exclude_unset=True)

        new_email = update_data.get("email")
        if new_email and new_email != customer.email and self.repository.get_by_email(new_email):
            raise DuplicateError(f"Customer with email '{new_email}' already exists")

        for field, value in update_data.items():
            setattr(customer, field, value)

        return self.repository.update(customer)

    def delete_customer(self, customer_id: int) -> None:
        customer = self.get_customer(customer_id)

        in_use = self.db.query(Order).filter(Order.customer_id == customer_id).first()
        if in_use:
            raise ConflictError(_IN_USE_MESSAGE)

        try:
            self.repository.delete(customer)
        except IntegrityError:
            self.db.rollback()
            raise ConflictError(_IN_USE_MESSAGE)
