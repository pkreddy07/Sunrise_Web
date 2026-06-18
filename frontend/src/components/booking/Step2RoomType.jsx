// frontend/src/components/booking/Step2RoomType.jsx
import React, { useState } from 'react';
import './Step2RoomType.css';

const ROOM_TYPES = [
  { name: 'Room only', price: 1500, icon: '🏛️', desc: 'Elegant & comfortable room' },
  { name: 'Room + breakfast', price: 1800, icon: '🍽️', desc: 'Elegant & comfortable room, inclusive of breakfast' },
  { name: 'Luxury', price: 2000, icon: '👑', desc: 'Ultimate luxury experience' },
];

export default function Step2RoomType({ roomNumber, formData, onChange, onNext, onBack }) {
  const [error, setError] = useState('');

  function handleSelect(type) {
    onChange({ ...formData, roomType: type.name, roomCost: type.price });
    setError('');
  }

  function handleNext() {
    if (!formData.roomType) {
      setError('Please select reservation type');
      return;
    }
    onNext();
  }

  const selected = ROOM_TYPES.find((r) => r.name === formData.roomType);

  return (
    <div className="step2">
      <div className="room-highlight">
        <span className="room-highlight-icon">🏠</span>
        <div>
          <div className="room-highlight-label">Booking For</div>
          <div className="room-highlight-name">{roomNumber}</div>
        </div>
      </div>

      <div className="room-type-title">Choose Room Type</div>

      <div className="room-type-list">
        {ROOM_TYPES.map((type) => (
          <div
            key={type.name}
            className={`room-type-card ${formData.roomType === type.name ? 'selected' : ''}`}
            onClick={() => handleSelect(type)}
          >
            <div className="rtc-icon">{type.icon}</div>
            <div className="rtc-info">
              <div className="rtc-name">{type.name}</div>
              <div className="rtc-desc">{type.desc}</div>
            </div>
            <div className="rtc-price">₹{type.price.toLocaleString()}</div>
            <div className="rtc-check">
              {formData.roomType === type.name ? '✅' : '⭕'}
            </div>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {selected && (
        <div className="booking-summary">
          <div className="summary-row">
            <span>Room</span>
            <strong>{roomNumber}</strong>
          </div>
          <div className="summary-row">
            <span>Type</span>
            <strong>{selected.name}</strong>
          </div>
          <div className="summary-row total">
            <span>Room Charges</span>
            <strong className="price-big">₹{selected.price.toLocaleString()}</strong>
          </div>
        </div>
      )}

      <div className="step-actions two-col">
        <button className="btn btn-outline btn-lg" onClick={onBack}>
          ← Back
        </button>
        <button className="btn btn-primary btn-lg" onClick={handleNext}>
          Proceed to Payment →
        </button>
      </div>
    </div>
  );
}
