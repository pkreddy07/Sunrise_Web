// frontend/src/components/booking/BookingModal.jsx
import React, { useState } from 'react';
import Step1Verification from './Step1Verification';
import Step2RoomType from './Step2RoomType';
import Step3Payment from './Step3Payment';
import Step4Success from './Step4Success';
import { createBooking } from '../../services/api';

const STEP_LABELS = ['Verify', 'Room Type', 'Payment', 'Done'];

function getDefaultCheckIn() {
  const now = new Date();
  // Format to datetime-local value
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function BookingModal({ roomName, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    roomNumber: roomName,
    fullName: '',
    dob: '',
    age: '',
    gender: '',
    contactNumber: '',
    address: '',
    aadhaarNumber: '',
    checkIn: getDefaultCheckIn(),
    checkOut: '',
    roomType: '',
    roomCost: '',
    paymentType: '',
  });

  function formatDateTimeForSheet(dtLocal) {
    if (!dtLocal) return '';
    const d = new Date(dtLocal);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  }

  async function handleConfirmBooking() {
    setLoading(true);
    setError('');
    try {
      const payload = {
        roomNumber: formData.roomNumber,
        roomType: formData.roomType,
        roomCost: formData.roomCost,
        customerName: formData.fullName,
        dob: formData.dob,
        age: formData.age,
        gender: formData.gender,
        contactNumber: formData.contactNumber,
        address: formData.address,
        aadhaarNumber: formData.aadhaarNumber,
        checkInDateTime: formatDateTimeForSheet(formData.checkIn),
        checkOutDateTime: formatDateTimeForSheet(formData.checkOut),
        paymentType: formData.paymentType,
      };

      const result = await createBooking(payload);
      if (result.success) {
        setBookingId(result.bookingId);
        setStep(4);
        onSuccess && onSuccess();
      } else {
        setError(result.message || 'Booking failed');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const stepTitles = {
    1: '👤 Customer Verification',
    2: '🏠 Select Room Type',
    3: '💳 Payment',
    4: '🎉 Booking Confirmed',
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && step < 4 && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <h2>{stepTitles[step]}</h2>
          {step < 4 && (
            <button className="modal-close" onClick={onClose}>✕</button>
          )}
        </div>

        {/* Step indicator */}
        {step < 4 && (
          <div className="step-indicator">
            {STEP_LABELS.map((label, i) => {
              const num = i + 1;
              const isActive = num === step;
              const isCompleted = num < step;
              return (
                <React.Fragment key={label}>
                  {i > 0 && (
                    <div className={`step-line ${isCompleted ? 'completed' : ''}`} />
                  )}
                  <div
                    className={`step-dot ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    title={label}
                  >
                    {isCompleted ? '✓' : num}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <div className="alert alert-error">⚠️ {error}</div>
          )}

          {step === 1 && (
            <Step1Verification
              formData={formData}
              onChange={setFormData}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <Step2RoomType
              roomNumber={roomName}
              formData={formData}
              onChange={setFormData}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <Step3Payment
              formData={formData}
              onChange={setFormData}
              onNext={handleConfirmBooking}
              onBack={() => setStep(2)}
              loading={loading}
            />
          )}

          {step === 4 && (
            <Step4Success
              bookingId={bookingId}
              formData={formData}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
