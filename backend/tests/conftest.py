import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def client():
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def make_product(client, **overrides):
    payload = {
        "sku": "SKU-001",
        "name": "Widget",
        "description": "A basic widget",
        "price": "9.99",
        "quantity": 10,
    }
    payload.update(overrides)
    response = client.post("/api/v1/products/", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def make_customer(client, **overrides):
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "555-0100",
        "address": "1 Main St",
    }
    payload.update(overrides)
    response = client.post("/api/v1/customers/", json=payload)
    assert response.status_code == 201, response.text
    return response.json()
