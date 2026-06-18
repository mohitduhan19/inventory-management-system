import { useState } from 'react';

import Loading from '../components/common/Loading.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import Toast from '../components/common/Toast.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import ProductForm from '../components/products/ProductForm.jsx';
import useFetch from '../hooks/useFetch.js';
import useToast from '../hooks/useToast.js';
import { createProduct, deleteProduct, listProducts, updateProduct } from '../services/productService.js';
import { formatCurrency } from '../utils/format.js';
import { LOW_STOCK_THRESHOLD } from '../utils/constants.js';

function Products() {
  const { data, loading, error, refetch } = useFetch(() => listProducts({ limit: 500 }));
  const products = data || [];
  const [modalMode, setModalMode] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [actionError, setActionError] = useState(null);
  const { message: successMessage, showToast, clearToast } = useToast();

  const closeModal = () => {
    setModalMode(null);
    setActiveProduct(null);
  };

  const handleCreate = async (payload) => {
    await createProduct(payload);
    closeModal();
    refetch();
    showToast(`Product "${payload.name}" added.`);
  };

  const handleUpdate = async (payload) => {
    await updateProduct(activeProduct.id, payload);
    closeModal();
    refetch();
    showToast(`Product "${payload.name}" updated.`);
  };

  const handleDelete = async () => {
    setActionError(null);
    try {
      const name = productToDelete.name;
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
      refetch();
      showToast(`Product "${name}" deleted.`);
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Products</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModalMode('create')}>
          + Add Product
        </button>
      </div>

      <ErrorMessage message={error || actionError} />
      <Toast message={successMessage} onDismiss={clearToast} />

      {loading ? (
        <Loading />
      ) : products.length === 0 ? (
        <p className="empty-state">No products yet. Add your first product to get started.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td className={product.quantity <= LOW_STOCK_THRESHOLD ? 'text-danger' : undefined}>
                    {product.quantity}
                  </td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => {
                        setActiveProduct(product);
                        setModalMode('edit');
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-link btn-danger"
                      onClick={() => setProductToDelete(product)}
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

      {modalMode === 'create' && (
        <Modal title="Add Product" onClose={closeModal}>
          <ProductForm onSubmit={handleCreate} onCancel={closeModal} submitLabel="Add Product" />
        </Modal>
      )}

      {modalMode === 'edit' && activeProduct && (
        <Modal title={`Edit ${activeProduct.name}`} onClose={closeModal}>
          <ProductForm
            initialValues={{
              name: activeProduct.name,
              description: activeProduct.description || '',
              price: activeProduct.price,
              quantity: activeProduct.quantity,
            }}
            onSubmit={handleUpdate}
            onCancel={closeModal}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {productToDelete && (
        <ConfirmDialog
          message={`Delete product "${productToDelete.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setProductToDelete(null)}
        />
      )}
    </div>
  );
}

export default Products;
