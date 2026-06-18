from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import pagination_params
from app.db.session import get_db
from app.schemas.customer import CustomerCreate, CustomerRead, CustomerUpdate
from app.services.customer_service import CustomerService
from app.utils.pagination import PaginationParams

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/", response_model=List[CustomerRead])
def list_customers(
    pagination: PaginationParams = Depends(pagination_params),
    db: Session = Depends(get_db),
):
    return CustomerService(db).list_customers(skip=pagination.skip, limit=pagination.limit)


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return CustomerService(db).get_customer(customer_id)


@router.post("/", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    return CustomerService(db).create_customer(payload)


@router.put("/{customer_id}", response_model=CustomerRead)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)):
    return CustomerService(db).update_customer(customer_id, payload)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    CustomerService(db).delete_customer(customer_id)
