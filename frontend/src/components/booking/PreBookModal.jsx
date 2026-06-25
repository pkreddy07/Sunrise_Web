// frontend/src/components/booking/PreBookModal.jsx
import React, { useState } from 'react';
import { createPreBooking } from '../../services/api';
import './PreBookModal.css';

const ALL_ROOMS = ['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5', 'Room 6', 'Room 7'];

const ROOM_TYPES = [
  { name: 'Room only', price: 1600, icon: '🏛️' },
  { name: 'Room + breakfast', price: 1800, icon: '🍽️' },
  { name: 'Luxury', price: 2000, icon: '👑' },
];

const STEP_LABELS = ['Guest & Rooms', 'Room Types', 'Done'];

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

export default function PreBookModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingIds, setBookingIds] = useState([]);

  const [formData, setFormData] = useState({
    selectedRooms: [],
    customerName: '',
    contactNumber: '',
    checkIn: '',
    checkOut: '',
    typeCounts: { 'Room only': 0, 'Room + breakfast': 0, 'Luxury': 0 },
    advancePaid: 0,
  });

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleRoom(room) {
    setFormData((prev) => {
      const sel = prev.selectedRooms.includes(room)
        ? prev.selectedRooms.filter((r) => r !== room)
        : [...prev.selectedRooms, room];
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

  function validateStep1() {
    if (formData.selectedRooms.length === 0) return 'Select at least one room';
    if (!formData.customerName.trim()) return 'Customer name is required';
    if (!formData.checkIn) return 'Check-in date & time is required';
    if (!formData.checkOut) return 'Check-out date & time is required';
    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) return 'Check-out must be after check-in';
    return null;
  }

  function handleStep1Next() {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  }

  const totalAssigned = Object.values(formData.typeCounts).reduce((s, v) => s + v, 0);
  const totalCost = ROOM_TYPES.reduce((s, t) => s + (formData.typeCounts[t.name] || 0) * t.price, 0);

  async function handleSubmit() {
    if (totalAssigned !== formData.selectedRooms.length) {
      setError(`Assign exactly ${formData.selectedRooms.length} room type(s)`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const rooms = buildRoomsArray(formData.selectedRooms, formData.typeCounts);
      const result = await createPreBooking({
        rooms,
        customerName: formData.customerName,
        contactNumber: formData.contactNumber,
        checkInDateTime: formatDateTimeForSheet(formData.checkIn),
        checkOutDateTime: formatDateTimeForSheet(formData.checkOut),
        advancePaid: formData.advancePaid,
      });
      if (result.success) {
        setBookingIds(result.bookingIds);
        setStep(3);
        onSuccess && onSuccess();
      } else {
        setError(result.message || 'Pre-booking failed');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Pre-booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const stepTitles = { 1: '📅 Pre-Book Rooms', 2: '🛏️ Room Types', 3: '🎉 Pre-Booking Confirmed' };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && step < 3 && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>{stepTitles[step]}</h2>
          {step < 3 && <button className="modal-close" onClick={onClose}>✕</button>}
        </div>

        {step < 3 && (
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

          {/* ── Step 1: Guest + Rooms ── */}
          {step === 1 && (
            <div className="pb-step">
              <div className="customer-details">
                <h3 className="section-title">👤 Guest Details</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Customer Name *</label>
                    <input
                      className="form-input"
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => handleChange('customerName', e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Contact Number</label>
                    <input
                      className="form-input"
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => handleChange('contactNumber', e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check-In Date & Time *</label>
                    <input
                      className="form-input"
                      type="datetime-local"
                      value={formData.checkIn}
                      onChange={(e) => handleChange('checkIn', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check-Out Date & Time *</label>
                    <input
                      className="form-input"
                      type="datetime-local"
                      value={formData.checkOut}
                      onChange={(e) => handleChange('checkOut', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="section-title">🏠 Select Rooms</h3>
                <p className="mb-hint">All rooms can be pre-booked regardless of current occupancy.</p>
                <div className="mb-room-grid">
                  {ALL_ROOMS.map((room) => {
                    const selected = formData.selectedRooms.includes(room);
                    return (
                      <label key={room} className={`mb-room-chip ${selected ? 'mb-chip-selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleRoom(room)}
                          style={{ display: 'none' }}
                        />
                        <span className="mb-chip-icon">🏠</span>
                        <span className="mb-chip-name">{room}</span>
                        {selected && <span className="mb-chip-check">✓</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="step-actions">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleStep1Next}
                  disabled={formData.selectedRooms.length === 0}
                >
                  Next: Room Types → ({formData.selectedRooms.length} selected)
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Room Types + Advance Paid ── */}
          {step === 2 && (
            <div className="pb-step">
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
                <span>Est. Total: ₹{totalCost.toLocaleString()}</span>
              </div>

              <div className="pb-advance">
                <label className="form-label">Advance Paid (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={formData.advancePaid}
                  onChange={(e) => handleChange('advancePaid', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="step-actions two-col">
                <button className="btn btn-outline btn-lg" onClick={() => { setError(''); setStep(1); }} disabled={loading}>← Back</button>
                <button
                  className="btn btn-success btn-lg"
                  onClick={handleSubmit}
                  disabled={loading || totalAssigned !== formData.selectedRooms.length}
                >
                  {loading ? (
                    <><div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}></div> Saving...</>
                  ) : '📅 Confirm Pre-Book'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="pb-step mb-success">
              <div className="success-icon">📅</div>
              <h2 className="success-title">{bookingIds.length} Room{bookingIds.length > 1 ? 's' : ''} Pre-Booked!</h2>
              <p className="success-subtitle">Future booking confirmed for {formData.customerName}</p>
              <div className="mb-booking-ids">
                {formData.selectedRooms.map((room, i) => (
                  <div key={i} className="mb-id-row">
                    <span className="mb-id-room">{room}</span>
                    <span className="mb-id-code">{bookingIds[i] || '—'}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-lg" onClick={onClose}>🏠 Return To Home</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
