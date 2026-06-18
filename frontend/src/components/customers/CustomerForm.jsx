import { useState } from 'react';

const emptyForm = { name: '', email: '', phone: '', address: '' };

function CustomerForm({ onSubmit, onCancel, submitLabel = 'Save' }) {
  const [values, setValues] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
        address: values.address.trim() || null,
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="entity-form">
      {error && <div className="error-banner">{error}</div>}
      <label className="form-field">
        Name
        <input value={values.name} onChange={handleChange('name')} required maxLength={255} />
      </label>
      <label className="form-field">
        Email
        <input type="email" value={values.email} onChange={handleChange('email')} required />
      </label>
      <label className="form-field">
        Phone
        <input value={values.phone} onChange={handleChange('phone')} maxLength={32} />
      </label>
      <label className="form-field">
        Address
        <textarea value={values.address} onChange={handleChange('address')} maxLength={500} />
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

export default CustomerForm;
