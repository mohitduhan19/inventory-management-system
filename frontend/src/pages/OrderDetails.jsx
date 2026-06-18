import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Loading from '../components/common/Loading.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import useFetch from '../hooks/useFetch.js';
import { deleteOrder, getOrder } from '../services/orderService.js';
import { listCustomers } from '../services/customerService.js';
import { formatCurrency, formatDate } from '../utils/format.js';

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data: order, loading, error } = useFetch(() => getOrder(orderId), [orderId]);
  const { data: customers } = useFetch(() => listCustomers({ limit: 500 }));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState(null);

  const customer = customers?.find((c) => c.id === order?.customer_id);

  const handleDelete = async () => {
    setActionError(null);
    try {
      await deleteOrder(orderId);
      navigate('/orders');
    } catch (err) {
      setActionError(err.message);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Order Details</h1>
        <div className="table-actions">
          {order && (
            <button type="button" className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>
              Delete Order
            </button>
          )}
          <Link to="/orders" className="btn btn-secondary">
            ← Back to Orders
          </Link>
        </div>
      </div>

      <ErrorMessage message={error || actionError} />

      {loading ? (
        <Loading />
      ) : (
        order && (
          <>
            <section className="panel order-summary">
              <div>
                <span className="summary-label">Order</span>
                <strong>#{order.id}</strong>
              </div>
              <div>
                <span className="summary-label">Status</span>
                <StatusBadge status={order.status} />
              </div>
              <div>
                <span className="summary-label">Customer</span>
                <strong>
                  {customer ? `${customer.name} (${customer.email})` : `#${order.customer_id}`}
                </strong>
              </div>
              <div>
                <span className="summary-label">Placed</span>
                <strong>{formatDate(order.created_at)}</strong>
              </div>
              <div>
                <span className="summary-label">Total</span>
                <strong>{formatCurrency(order.total_amount)}</strong>
              </div>
            </section>

            <section className="panel">
              <h2>Items</h2>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product.sku}</td>
                        <td>{item.product.name}</td>
                        <td>{formatCurrency(item.unit_price)}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )
      )}

      {confirmingDelete && (
        <ConfirmDialog
          message={`Delete order #${orderId}? This cannot be undone and will restore its reserved stock.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}

export default OrderDetails;
