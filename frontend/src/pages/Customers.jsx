import { useState } from 'react';

import Loading from '../components/common/Loading.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import Toast from '../components/common/Toast.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import CustomerForm from '../components/customers/CustomerForm.jsx';
import useFetch from '../hooks/useFetch.js';
import useToast from '../hooks/useToast.js';
import { createCustomer, deleteCustomer, listCustomers } from '../services/customerService.js';

function Customers() {
  const { data, loading, error, refetch } = useFetch(() => listCustomers({ limit: 500 }));
  const customers = data || [];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [actionError, setActionError] = useState(null);
  const { message: successMessage, showToast, clearToast } = useToast();

  const handleCreate = async (payload) => {
    await createCustomer(payload);
    setShowCreateModal(false);
    refetch();
    showToast(`Customer "${payload.name}" added.`);
  };

  const handleDelete = async () => {
    setActionError(null);
    try {
      const name = customerToDelete.name;
      await deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
      refetch();
      showToast(`Customer "${name}" deleted.`);
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Customers</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Customer
        </button>
      </div>

      <ErrorMessage message={error || actionError} />
      <Toast message={successMessage} onDismiss={clearToast} />

      {loading ? (
        <Loading />
      ) : customers.length === 0 ? (
        <p className="empty-state">No customers yet. Add your first customer to get started.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || '—'}</td>
                  <td>{customer.address || '—'}</td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn btn-link btn-danger"
                      onClick={() => setCustomerToDelete(customer)}
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

      {showCreateModal && (
        <Modal title="Add Customer" onClose={() => setShowCreateModal(false)}>
          <CustomerForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
            submitLabel="Add Customer"
          />
        </Modal>
      )}

      {customerToDelete && (
        <ConfirmDialog
          message={`Delete customer "${customerToDelete.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setCustomerToDelete(null)}
        />
      )}
    </div>
  );
}

export default Customers;
