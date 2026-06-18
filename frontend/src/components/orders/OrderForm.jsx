import { useMemo, useState } from 'react';

import { formatCurrency } from '../../utils/format.js';

function OrderForm({ customers, products, onSubmit, onCancel }) {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const productMap = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);

  const estimatedTotal = items.reduce((sum, item) => {
    const product = productMap.get(String(item.productId));
    return product ? sum + Number(product.price) * Number(item.quantity || 0) : sum;
  }, 0);

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { productId: '', quantity: 1 }]);

  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    const lineItems = items.filter((item) => item.productId);
    if (lineItems.length === 0) {
      setError('Add at least one product to the order.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        customer_id: Number(customerId),
        items: lineItems.map((item) => ({
          product_id: Number(item.productId),
          quantity: Number(item.quantity),
        })),
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="entity-form order-form">
      {error && <div className="error-banner">{error}</div>}

      <label className="form-field">
        Customer
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
          <option value="">Select a customer…</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} ({customer.email})
            </option>
          ))}
        </select>
      </label>

      <div className="order-items">
        <div className="order-items-header">
          <span>Product</span>
          <span>Quantity</span>
          <span>Stock</span>
          <span />
        </div>
        {items.map((item, index) => {
          const product = productMap.get(String(item.productId));
          return (
            <div className="order-item-row" key={index}>
              <select
                value={item.productId}
                onChange={(e) => updateItem(index, 'productId', e.target.value)}
                required
              >
                <option value="">Select a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                required
              />
              <span className="order-item-stock">{product ? product.quantity : '—'}</span>
              <button
                type="button"
                className="btn btn-link"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                Remove
              </button>
            </div>
          );
        })}
        <button type="button" className="btn btn-secondary" onClick={addItem}>
          + Add product
        </button>
      </div>

      <div className="order-form-total">
        Estimated total: <strong>{formatCurrency(estimatedTotal)}</strong>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Placing order…' : 'Create Order'}
        </button>
      </div>
    </form>
  );
}

export default OrderForm;
