from tests.conftest import make_customer, make_product


def test_create_product(client):
    product = make_product(client, sku="SKU-CREATE", quantity=5)

    assert product["sku"] == "SKU-CREATE"
    assert product["quantity"] == 5
    assert "id" in product


def test_duplicate_sku_rejected(client):
    make_product(client, sku="SKU-DUP")

    response = client.post(
        "/api/v1/products/",
        json={
            "sku": "SKU-DUP",
            "name": "Another Widget",
            "price": "5.00",
            "quantity": 1,
        },
    )

    assert response.status_code == 409


def test_create_customer(client):
    customer = make_customer(client, email="create@example.com")

    assert customer["email"] == "create@example.com"
    assert "id" in customer


def test_duplicate_email_rejected(client):
    make_customer(client, email="dup@example.com")

    response = client.post(
        "/api/v1/customers/",
        json={"name": "Someone Else", "email": "dup@example.com"},
    )

    assert response.status_code == 409


def test_delete_unused_product_succeeds(client):
    product = make_product(client, sku="SKU-UNUSED")

    response = client.delete(f"/api/v1/products/{product['id']}")

    assert response.status_code == 204
    assert client.get(f"/api/v1/products/{product['id']}").status_code == 404


def test_delete_product_used_in_order_rejected(client):
    product = make_product(client, sku="SKU-IN-ORDER", quantity=10)
    customer = make_customer(client)
    client.post(
        "/api/v1/orders/",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 1}],
        },
    )

    response = client.delete(f"/api/v1/products/{product['id']}")

    assert response.status_code == 409
    assert response.json()["detail"] == "Cannot delete product because it is used in orders"
    assert client.get(f"/api/v1/products/{product['id']}").status_code == 200
