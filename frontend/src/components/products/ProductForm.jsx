import { useState } from 'react';

const emptyForm = { sku: '', name: '', description: '', price: '', quantity: '' };

function ProductForm({ initialValues, onSubmit, onCancel, submitLabel = 'Save' }) {
  const [values, setValues] = useState(initialValues || emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initialValues);

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        ...(isEdit ? {} : { sku: values.sku.trim() }),
        name: values.name.trim(),
        description: values.description.trim() || null,
        price: Number(values.price),
        quantity: Number(values.quantity),
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="entity-form">
      {error && <div className="error-banner">{error}</div>}
      {!isEdit && (
        <label className="form-field">
          SKU
          <input value={values.sku} onChange={handleChange('sku')} required maxLength={64} />
        </label>
      )}
      <label className="form-field">
        Name
        <input value={values.name} onChange={handleChange('name')} required maxLength={255} />
      </label>
      <label className="form-field">
        Description
        <textarea value={values.description} onChange={handleChange('description')} maxLength={1000} />
      </label>
      <label className="form-field">
        Price
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={values.price}
          onChange={handleChange('price')}
          required
        />
      </label>
      <label className="form-field">
        Quantity
        <input
          type="number"
          step="1"
          min="0"
          value={values.quantity}
          onChange={handleChange('quantity')}
          required
        />
      </label>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
