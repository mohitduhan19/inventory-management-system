import { useState } from 'react';
import { Link } from 'react-router-dom';

import Loading from '../components/common/Loading.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import Toast from '../components/common/Toast.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import OrderForm from '../components/orders/OrderForm.jsx';
import useFetch from '../hooks/useFetch.js';
import useToast from '../hooks/useToast.js';
import { createOrder, deleteOrder, listOrders } from '../services/orderService.js';
import { listCustomers } from '../services/customerService.js';
import { listProducts } from '../services/productService.js';
import { formatCurrency, formatDate } from '../utils/format.js';

function Orders() {
  const { data: ordersData, loading, error, refetch } = useFetch(() => listOrders({ limit: 500 }));
  const { data: customersData } = useFetch(() => listCustomers({ limit: 500 }));
  const { data: productsData, refetch: refetchProducts } = useFetch(() => listProducts({ limit: 500 }));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [actionError, setActionError] = useState(null);
  const { message: successMessage, showToast, clearToast } = useToast();

  const orders = ordersData || [];
  const customers = customersData || [];
  const products = productsData || [];

  const customerName = (customerId) =>
    customers.find((c) => c.id === customerId)?.name || `Customer #${customerId}`;

  const handleCreate = async (payload) => {
    await createOrder(payload);
    setShowCreateModal(false);
    refetch();
    refetchProducts();
    showToast('Order created.');
  };

  const handleDelete = async () => {
    setActionError(null);
    try {
      const id = orderToDelete.id;
      await deleteOrder(id);
      setOrderToDelete(null);
      refetch();
      refetchProducts();
      showToast(`Order #${id} deleted; reserved stock has been restored.`);
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Orders</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          disabled={customers.length === 0 || products.length === 0}
        >
          + Create Order
        </button>
      </div>

      <ErrorMessage message={error || actionError} />
      <Toast message={successMessage} onDismiss={clearToast} />

      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <p className="empty-state">No orders yet. Create your first order to get started.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{customerName(order.customer_id)}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>{formatCurrency(order.total_amount)}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td className="table-actions">
                    <Link to={`/orders/${order.id}`} className="btn btn-link">
                      View Details
                    </Link>
                    <button
                      type="button"
                      className="btn btn-link btn-danger"
                      onClick={() => setOrderToDelete(order)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && customers.length > 0 && products.length > 0 && (
        <Modal title="Create Order" onClose={() => setShowCreateModal(false)}>
          <OrderForm
            customers={customers}
            products={products}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {orderToDelete && (
        <ConfirmDialog
          message={`Delete order #${orderToDelete.id}? This cannot be undone and will restore its reserved stock.`}
          onConfirm={handleDelete}
          onCancel={() => setOrderToDelete(null)}
        />
      )}
    </div>
  );
}

export default Orders;
