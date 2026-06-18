import { Link } from 'react-router-dom';

import StatCard from '../components/common/StatCard.jsx';
import Loading from '../components/common/Loading.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import useFetch from '../hooks/useFetch.js';
import { listProducts } from '../services/productService.js';
import { listCustomers } from '../services/customerService.js';
import { listOrders } from '../services/orderService.js';
import { formatCurrency } from '../utils/format.js';
import { LOW_STOCK_THRESHOLD } from '../utils/constants.js';

function Dashboard() {
  const products = useFetch(() => listProducts({ limit: 500 }));
  const customers = useFetch(() => listCustomers({ limit: 500 }));
  const orders = useFetch(() => listOrders({ limit: 500 }));

  const loading = products.loading || customers.loading || orders.loading;
  const error = products.error || customers.error || orders.error;
  const productList = products.data || [];
  const customerList = customers.data || [];
  const orderList = orders.data || [];
  const lowStockProducts = productList.filter((p) => p.quantity <= LOW_STOCK_THRESHOLD);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <ErrorMessage message={error} />
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Total Products" value={productList.length} />
            <StatCard label="Total Customers" value={customerList.length} />
            <StatCard label="Total Orders" value={orderList.length} />
            <StatCard label="Low Stock Products" value={lowStockProducts.length} tone="warning" />
          </div>

          <section className="panel">
            <h2>Low Stock Products (≤ {LOW_STOCK_THRESHOLD} units)</h2>
            {lowStockProducts.length === 0 ? (
              <p className="empty-state">All products are sufficiently stocked.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.sku}</td>
                      <td>{product.name}</td>
                      <td className="text-danger">{product.quantity}</td>
                      <td>{formatCurrency(product.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Link to="/products" className="btn btn-secondary">
              Manage Products
            </Link>
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;
