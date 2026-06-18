// frontend/src/components/reception/RoomCard.jsx
import React, { useState } from 'react';
import './RoomCard.css';

export default function RoomCard({ roomName, status, booking, onClick }) {
  const isOccupied = status === 'OCCUPIED';
  const [showMenu, setShowMenu] = useState(false);

  function formatCheckout(dt) {
    if (!dt) return '';
    // Try to parse various date formats
    const d = new Date(dt);
    if (!isNaN(d)) {
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    return dt;
  }

  function handleClick() {
    if (isOccupied) {
      setShowMenu((prev) => !prev);
    } else {
      onClick();
    }
  }

  function handleCheckout() {
    setShowMenu(false);
    onClick('checkout');
  }

  const expectedCheckout = booking
    ? booking['Expected Check-Out DateTime']
    : null;
  const guestName = booking ? booking['Customer Name'] : null;

  return (
    <div className={`room-card ${isOccupied ? 'occupied' : 'available'}`} onClick={handleClick}>
      <div className="room-card-icon">{isOccupied ? '🛏️' : '🏠'}</div>
      <div className="room-card-name">{roomName}</div>
      <div className={`room-card-status-badge ${isOccupied ? 'badge-red' : 'badge-green'}`}>
        {isOccupied ? 'Occupied' : 'Available'}
      </div>

      {isOccupied && (
        <div className="room-card-info">
          {guestName && <div className="room-guest-name">👤 {guestName}</div>}
          {expectedCheckout && (
            <div className="room-checkout-time">
              <span className="label">Checkout:</span>
              <span className="value">{formatCheckout(expectedCheckout)}</span>
            </div>
          )}
        </div>
      )}

      {!isOccupied && (
        <div className="room-card-tap-hint">Tap to Book</div>
      )}

      {showMenu && isOccupied && (
        <div className="room-menu" onClick={(e) => e.stopPropagation()}>
          <button className="room-menu-item checkout" onClick={handleCheckout}>
            🚪 Checkout Guest
          </button>
          <button className="room-menu-item cancel" onClick={() => setShowMenu(false)}>
            ✕ Cancel
          </button>
        </div>
      )}
    </div>
  );
}
