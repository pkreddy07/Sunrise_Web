// frontend/src/components/booking/MultiBookModal.jsx
import React, { useState } from 'react';
import Step1Verification from './Step1Verification';
import { createMultipleBookings } from '../../services/api';
import { generateInvoice } from '../../utils/generateInvoice';
import './MultiBookModal.css';

const ALL_ROOMS = ['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5', 'Room 6', 'Room 7'];

const ROOM_TYPES = [
  { name: 'Room only', price: 1500, icon: '🏛️' },
  { name: 'Room + breakfast', price: 1800, icon: '🍽️' },
  { name: 'Luxury', price: 2000, icon: '👑' },
];

const STEP_LABELS = ['Rooms', 'Guest Details', 'Room Types', 'Payment', 'Done'];

function getDefaultCheckIn() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatDateTimeForSheet(dtLocal) {
  if (!dtLocal) return '';
  return new Date(dtLocal).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function buildRoomsArray(selectedRooms, typeCounts) {
  const rooms = [];
  let idx = 0;
  for (const type of ROOM_TYPES) {
    for (let i = 0; i < (typeCounts[type.name] || 0); i++) {
      rooms.push({ roomNumber: selectedRooms[idx], roomType: type.name, roomCost: type.price });
      idx++;
    }
  }
  return rooms;
}

export default function MultiBookModal({ roomStatuses, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState('');

  const [formData, setFormData] = useState({
    selectedRooms: [],
    typeCounts: { 'Room only': 0, 'Room + breakfast': 0, 'Luxury': 0 },
    fullName: '', dob: '', age: '', gender: '',
    contactNumber: '', address: '', aadhaarNumber: '',
    checkIn: getDefaultCheckIn(), checkOut: '',
    paymentType: '',
  });

  const isOccupied = (room) => roomStatuses?.[room]?.status === 'OCCUPIED';

  function toggleRoom(room) {
    setFormData((prev) => {
      const sel = prev.selectedRooms.includes(room)
        ? prev.selectedRooms.filter((r) => r !== room)
        : [...prev.selectedRooms, room];
      // Reset type counts when room selection changes
      return { ...prev, selectedRooms: sel, typeCounts: { 'Room only': 0, 'Room + breakfast': 0, 'Luxury': 0 } };
    });
  }

  function adjustCount(typeName, delta) {
    setFormData((prev) => {
      const current = prev.typeCounts[typeName] || 0;
      const total = Object.values(prev.typeCounts).reduce((s, v) => s + v, 0);
      const next = current + delta;
      if (next < 0) return prev;
      if (delta > 0 && total >= prev.selectedRooms.length) return prev;
      return { ...prev, typeCounts: { ...prev.typeCounts, [typeName]: next } };
    });
  }

  const totalAssigned = Object.values(formData.typeCounts).reduce((s, v) => s + v, 0);
  const totalCost = ROOM_TYPES.reduce((s, t) => s + (formData.typeCounts[t.name] || 0) * t.price, 0);

  async function handleConfirm() {
    if (!formData.paymentType) { setError('Please select a payment method'); return; }
    setLoading(true);
    setError('');
    try {
      const rooms = buildRoomsArray(formData.selectedRooms, formData.typeCounts);
      const result = await createMultipleBookings({
        rooms,
        customerName: formData.fullName,
        dob: formData.dob, age: formData.age, gender: formData.gender,
        contactNumber: formData.contactNumber,
        address: formData.address,
        aadhaarNumber: formData.aadhaarNumber,
        checkInDateTime: formatDateTimeForSheet(formData.checkIn),
        checkOutDateTime: formatDateTimeForSheet(formData.checkOut),
        paymentType: formData.paymentType,
      });
      if (result.success) {
        setBookingId(result.bookingId);
        setStep(5);
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
    1: '🏠 Select Rooms',
    2: '👤 Guest Details',
    3: '🛏️ Room Types',
    4: '💳 Payment',
    5: '🎉 Booking Confirmed',
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && step < 5 && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>{stepTitles[step]}</h2>
          {step < 5 && <button className="modal-close" onClick={onClose}>✕</button>}
        </div>

        {step < 5 && (
          <div className="step-indicator">
            {STEP_LABELS.map((label, i) => {
              const num = i + 1;
              return (
                <React.Fragment key={label}>
                  {i > 0 && <div className={`step-line ${num < step ? 'completed' : ''}`} />}
                  <div className={`step-dot ${num === step ? 'active' : ''} ${num < step ? 'completed' : ''}`} title={label}>
                    {num < step ? '✓' : num}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          {/* ── Step 1: Room Selection ── */}
          {step === 1 && (
            <div className="mb-step">
              <p className="mb-hint">Select one or more available rooms to book together.</p>
              <div className="mb-room-grid">
                {ALL_ROOMS.map((room) => {
                  const occupied = isOccupied(room);
                  const selected = formData.selectedRooms.includes(room);
                  return (
                    <label
                      key={room}
                      className={`mb-room-chip ${occupied ? 'mb-chip-disabled' : ''} ${selected ? 'mb-chip-selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        disabled={occupied}
                        checked={selected}
                        onChange={() => !occupied && toggleRoom(room)}
                        style={{ display: 'none' }}
                      />
                      <span className="mb-chip-icon">{occupied ? '🛏️' : '🏠'}</span>
                      <span className="mb-chip-name">{room}</span>
                      {occupied && <span className="mb-chip-tag">Occupied</span>}
                      {selected && !occupied && <span className="mb-chip-check">✓</span>}
                    </label>
                  );
                })}
              </div>
              <div className="step-actions">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => { setError(''); setStep(2); }}
                  disabled={formData.selectedRooms.length === 0}
                >
                  Next: Guest Details → ({formData.selectedRooms.length} selected)
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Guest Details (reuse Step1Verification) ── */}
          {step === 2 && (
            <div>
              <button className="btn btn-outline mb-back-btn" onClick={() => setStep(1)}>← Back</button>
              <Step1Verification
                formData={formData}
                onChange={setFormData}
                onNext={() => { setError(''); setStep(3); }}
              />
            </div>
          )}

          {/* ── Step 3: Room Type Counters ── */}
          {step === 3 && (
            <div className="mb-step">
              <p className="mb-hint">
                Assign a room type to each of the {formData.selectedRooms.length} selected rooms.
              </p>
              <div className="mb-counter-list">
                {ROOM_TYPES.map((type) => (
                  <div key={type.name} className="mb-counter-row">
                    <div className="mb-counter-info">
                      <span className="mb-counter-icon">{type.icon}</span>
                      <div>
                        <div className="mb-counter-name">{type.name}</div>
                        <div className="mb-counter-price">₹{type.price.toLocaleString()}/room</div>
                      </div>
                    </div>
                    <div className="mb-counter-ctrl">
                      <button className="mb-cnt-btn" onClick={() => adjustCount(type.name, -1)}>−</button>
                      <span className="mb-cnt-val">{formData.typeCounts[type.name] || 0}</span>
                      <button className="mb-cnt-btn" onClick={() => adjustCount(type.name, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mb-total-bar ${totalAssigned === formData.selectedRooms.length ? 'mb-total-ok' : ''}`}>
                <span>Assigned: {totalAssigned} / {formData.selectedRooms.length} rooms</span>
                <span>Total: ₹{totalCost.toLocaleString()}</span>
              </div>
              {totalAssigned !== formData.selectedRooms.length && (
                <p className="mb-total-warn">Assign exactly {formData.selectedRooms.length} room{formData.selectedRooms.length > 1 ? 's' : ''} to continue.</p>
              )}

              <div className="step-actions two-col">
                <button className="btn btn-outline btn-lg" onClick={() => setStep(2)}>← Back</button>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => { setError(''); setStep(4); }}
                  disabled={totalAssigned !== formData.selectedRooms.length}
                >
                  Next: Payment →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Payment ── */}
          {step === 4 && (
            <div className="mb-step">
              <div className="mb-payment-summary">
                <div className="mb-ps-row">
                  <span>Rooms</span>
                  <strong>{formData.selectedRooms.join(', ')}</strong>
                </div>
                <div className="mb-ps-row">
                  <span>Guest</span>
                  <strong>{formData.fullName}</strong>
                </div>
                <div className="mb-ps-row highlight">
                  <span>Total Amount</span>
                  <strong>₹{totalCost.toLocaleString()}</strong>
                </div>
              </div>

              <div className="qr-section">
                <div className="qr-title">Scan to Pay via UPI</div>
                <div className="qr-frame">
                  <img src="/qr-code.jpeg" alt="Payment QR Code" />
                </div>
              </div>

              <div className="or-divider">
                <span className="or-line"></span>
                <span className="or-text">OR</span>
                <span className="or-line"></span>
              </div>

              <div className="payment-method-section">
                <div className="pm-title">Select Payment Method</div>
                <div className="pm-options">
                  {['UPI', 'CASH'].map((method) => (
                    <label key={method} className={`pm-option ${formData.paymentType === method ? 'selected' : ''}`}>
                      <input
                        type="radio" name="mb-payment" value={method}
                        checked={formData.paymentType === method}
                        onChange={() => { setFormData((p) => ({ ...p, paymentType: method })); setError(''); }}
                      />
                      <span className="pm-icon">{method === 'UPI' ? '📱' : '💵'}</span>
                      <div className="pm-info">
                        <div className="pm-name">{method}</div>
                        <div className="pm-desc">{method === 'UPI' ? 'Google Pay, PhonePe, Paytm, etc.' : 'Pay at reception'}</div>
                      </div>
                      <div className="pm-radio-dot"></div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="step-actions two-col">
                <button className="btn btn-outline btn-lg" onClick={() => setStep(3)} disabled={loading}>← Back</button>
                <button className="btn btn-success btn-lg" onClick={handleConfirm} disabled={loading}>
                  {loading ? (
                    <><div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}></div> Confirming...</>
                  ) : '✅ Confirm Booking'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Success ── */}
          {step === 5 && (
            <div className="mb-step mb-success">
              <div className="success-icon">✅</div>
              <h2 className="success-title">{formData.selectedRooms.length} Room{formData.selectedRooms.length > 1 ? 's' : ''} Booked!</h2>
              <p className="success-subtitle">All rooms have been checked in successfully</p>

              <div className="mb-booking-ids">
                <div className="mb-id-row">
                  <span className="mb-id-room">Booking ID</span>
                  <span className="mb-id-code">{bookingId}</span>
                </div>
                {formData.selectedRooms.map((room, i) => {
                  const rooms = buildRoomsArray(formData.selectedRooms, formData.typeCounts);
                  return (
                    <div key={i} className="mb-id-row">
                      <span className="mb-id-room">{room}</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{rooms[i]?.roomType}</span>
                    </div>
                  );
                })}
              </div>

              <div className="step-actions two-col">
                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => generateInvoice(bookingId, formData, buildRoomsArray(formData.selectedRooms, formData.typeCounts))}
                >
                  🧾 Download Invoice
                </button>
                <button className="btn btn-primary btn-lg" onClick={onClose}>🏠 Return To Home</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
