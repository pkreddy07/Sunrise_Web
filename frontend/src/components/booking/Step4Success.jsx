// frontend/src/components/booking/Step4Success.jsx
import React from 'react';
import { generateInvoice } from '../../utils/generateInvoice';
import './Step4Success.css';

export default function Step4Success({ bookingId, formData, onClose }) {
  function handleGenerateInvoice() {
    generateInvoice(bookingId, formData);
  }

  return (
    <div className="step4">
      <div className="success-icon">✅</div>
      <h2 className="success-title">Booking Confirmed!</h2>
      <p className="success-subtitle">Guest has been checked in successfully</p>

      <div className="booking-id-card">
        <div className="bid-label">Booking ID</div>
        <div className="bid-value">{bookingId}</div>
      </div>

      <div className="booking-details-grid">
        <div className="bd-row">
          <span className="bd-label">Guest Name</span>
          <span className="bd-value">{formData.fullName}</span>
        </div>
        <div className="bd-row">
          <span className="bd-label">Room</span>
          <span className="bd-value">{formData.roomNumber}</span>
        </div>
        <div className="bd-row">
          <span className="bd-label">Room Type</span>
          <span className="bd-value">{formData.roomType}</span>
        </div>
        <div className="bd-row">
          <span className="bd-label">Amount</span>
          <span className="bd-value price">₹{parseInt(formData.roomCost || 0).toLocaleString()}</span>
        </div>
        <div className="bd-row">
          <span className="bd-label">Payment</span>
          <span className="bd-value">{formData.paymentType}</span>
        </div>
        <div className="bd-row">
          <span className="bd-label">Contact</span>
          <span className="bd-value">{formData.contactNumber}</span>
        </div>
      </div>

      <div className="success-actions">
        <button
          className="btn btn-outline btn-lg"
          onClick={handleGenerateInvoice}
        >
          🧾 Download Invoice
        </button>
        <button className="btn btn-primary btn-lg" onClick={onClose}>
          🏠 Return To Home
        </button>
      </div>
    </div>
  );
}
