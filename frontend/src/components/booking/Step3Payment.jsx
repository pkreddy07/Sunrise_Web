// frontend/src/components/booking/Step3Payment.jsx
import React, { useState } from 'react';
import { getQrCodeUrl } from '../../services/api';
import './Step3Payment.css';

export default function Step3Payment({ formData, onChange, onNext, onBack, loading }) {
  const [error, setError] = useState('');

  function handlePaymentChange(type) {
    onChange({ ...formData, paymentType: type });
    setError('');
  }

  function handleConfirm() {
    if (!formData.paymentType) {
      setError('Please select a payment method');
      return;
    }
    setError('');
    onNext();
  }

  return (
    <div className="step3">
      {/* Summary bar */}
      <div className="payment-summary">
        <div className="ps-item">
          <span>Room</span>
          <strong>{formData.roomNumber}</strong>
        </div>
        <div className="ps-item">
          <span>Type</span>
          <strong>{formData.roomType}</strong>
        </div>
        <div className="ps-item highlight">
          <span>Amount</span>
          <strong>₹{parseInt(formData.roomCost || 0).toLocaleString()}</strong>
        </div>
      </div>

      {/* QR Code */}
      <div className="qr-section">
        <div className="qr-title">Scan to Pay via UPI</div>
        <div className="qr-frame">
          <img
            src={getQrCodeUrl()}
            alt="Payment QR Code"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="qr-placeholder" style={{ display: 'none' }}>
            <div className="qr-placeholder-inner">
              <div className="qr-icon">📱</div>
              <div>QR Code</div>
              <div className="qr-sub">Place your QR image in backend/assets/</div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="or-divider">
        <span className="or-line"></span>
        <span className="or-text">OR</span>
        <span className="or-line"></span>
      </div>

      {/* Payment Method */}
      <div className="payment-method-section">
        <div className="pm-title">Select Payment Method</div>
        <div className="pm-options">
          <label className={`pm-option ${formData.paymentType === 'UPI' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="payment"
              value="UPI"
              checked={formData.paymentType === 'UPI'}
              onChange={() => handlePaymentChange('UPI')}
            />
            <span className="pm-icon">📱</span>
            <div className="pm-info">
              <div className="pm-name">UPI</div>
              <div className="pm-desc">Google Pay, PhonePe, Paytm, etc.</div>
            </div>
            <div className="pm-radio-dot"></div>
          </label>

          <label className={`pm-option ${formData.paymentType === 'CASH' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="payment"
              value="CASH"
              checked={formData.paymentType === 'CASH'}
              onChange={() => handlePaymentChange('CASH')}
            />
            <span className="pm-icon">💵</span>
            <div className="pm-info">
              <div className="pm-name">Cash</div>
              <div className="pm-desc">Pay at reception</div>
            </div>
            <div className="pm-radio-dot"></div>
          </label>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="step-actions two-col">
        <button className="btn btn-outline btn-lg" onClick={onBack} disabled={loading}>
          ← Back
        </button>
        <button
          className="btn btn-success btn-lg"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}></div>
              Confirming...
            </>
          ) : (
            '✅ Confirm Booking'
          )}
        </button>
      </div>
    </div>
  );
}
