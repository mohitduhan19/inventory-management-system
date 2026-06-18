from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import pagination_params
from app.db.session import get_db
from app.schemas.order import OrderCreate, OrderRead, OrderUpdate
from app.services.order_service import OrderService
from app.utils.pagination import PaginationParams

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/", response_model=List[OrderRead])
def list_orders(
    pagination: PaginationParams = Depends(pagination_params),
    db: Session = Depends(get_db),
):
    return OrderService(db).list_orders(skip=pagination.skip, limit=pagination.limit)


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return OrderService(db).get_order(order_id)


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    return OrderService(db).create_order(payload)


@router.put("/{order_id}", response_model=OrderRead)
def update_order_status(order_id: int, payload: OrderUpdate, db: Session = Depends(get_db)):
    return OrderService(db).update_order_status(order_id, payload.status)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    OrderService(db).delete_order(order_id)
