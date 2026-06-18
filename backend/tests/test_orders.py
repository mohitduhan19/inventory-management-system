from tests.conftest import make_customer, make_product


def test_create_order_reduces_stock(client):
    product = make_product(client, sku="SKU-ORDER", quantity=10)
    customer = make_customer(client)

    response = client.post(
        "/api/v1/orders/",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 3}],
        },
    )

    assert response.status_code == 201, response.text

    updated_product = client.get(f"/api/v1/products/{product['id']}").json()
    assert updated_product["quantity"] == 7


def test_insufficient_stock_rejected(client):
    product = make_product(client, sku="SKU-LOW-STOCK", quantity=2)
    customer = make_customer(client)

    response = client.post(
        "/api/v1/orders/",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 5}],
        },
    )

    assert response.status_code == 422

    unchanged_product = client.get(f"/api/v1/products/{product['id']}").json()
    assert unchanged_product["quantity"] == 2


def test_delete_order_restores_stock(client):
    product = make_product(client, sku="SKU-RESTORE", quantity=10)
    customer = make_customer(client)

    order = client.post(
        "/api/v1/orders/",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "quantity": 4}],
        },
    ).json()

    reduced_product = client.get(f"/api/v1/products/{product['id']}").json()
    assert reduced_product["quantity"] == 6

    delete_response = client.delete(f"/api/v1/orders/{order['id']}")
    assert delete_response.status_code == 204

    restored_product = client.get(f"/api/v1/products/{product['id']}").json()
    assert restored_product["quantity"] == 10
