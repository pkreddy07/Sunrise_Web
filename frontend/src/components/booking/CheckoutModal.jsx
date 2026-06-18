// frontend/src/components/booking/CheckoutModal.jsx
import React, { useState } from 'react';
import { checkoutBooking } from '../../services/api';

export default function CheckoutModal({ room, booking, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCheckout() {
    if (!booking || !booking['Booking ID']) {
      setError('No active booking found for this room');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await checkoutBooking(booking['Booking ID']);
      if (result.success) {
        onSuccess && onSuccess();
        onClose();
      } else {
        setError(result.message || 'Checkout failed');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!booking) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2>🚪 Checkout Guest</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="alert alert-info" style={{ marginBottom: 0 }}>
              ℹ️ Are you sure you want to checkout this guest?
            </div>

            <div style={{
              background: 'var(--gray-50)',
              border: '2px solid var(--gray-200)',
              borderRadius: 'var(--radius)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              {[
                ['Room', booking['Room Number']],
                ['Booking ID', booking['Booking ID']],
                ['Guest', booking['Customer Name']],
                ['Room Type', booking['Room Type']],
                ['Check-In', booking['Check-In DateTime']],
                ['Expected Checkout', booking['Expected Check-Out DateTime']],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--gray-100)', paddingBottom: 10 }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>{label}</span>
                  <strong style={{ fontSize: '0.95rem', textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger btn-lg" onClick={handleCheckout} disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }}></div>
                Processing...
              </>
            ) : (
              '🚪 Confirm Checkout'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
