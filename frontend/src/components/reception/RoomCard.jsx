// frontend/src/components/reception/RoomCard.jsx
import React, { useState } from 'react';
import './RoomCard.css';

export default function RoomCard({ roomName, status, booking, onClick, futureBookings = [] }) {
  const isOccupied = status === 'OCCUPIED';
  const [showMenu, setShowMenu] = useState(false);
  const [showFuture, setShowFuture] = useState(false);

  function formatDT(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    if (!isNaN(d)) {
      return d.toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    }
    return dt;
  }

  function handleClick() {
    if (showFuture) return;
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

  function handleFutureClick(e) {
    e.stopPropagation();
    setShowMenu(false);
    setShowFuture((prev) => !prev);
  }

  const expectedCheckout = booking ? booking['Expected Check-Out DateTime'] : null;
  const guestName = booking ? booking['Customer Name'] : null;

  const isActive = showMenu || showFuture;

  return (
    <div className={`room-card ${isOccupied ? 'occupied' : 'available'}${isActive ? ' card-active' : ''}`} onClick={handleClick}>

      {/* Future bookings icon — always visible */}
      <button
        className="future-btn"
        title="View future bookings"
        onClick={handleFutureClick}
      >
        📅
        {futureBookings.length > 0 && (
          <span className="future-badge">{futureBookings.length}</span>
        )}
      </button>

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
              <span className="value">{formatDT(expectedCheckout)}</span>
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

      {/* Future bookings panel */}
      {showFuture && (
        <div className="future-panel" onClick={(e) => e.stopPropagation()}>
          <div className="future-panel-header">
            <span>📅 Future Bookings</span>
            <button className="future-panel-close" onClick={(e) => { e.stopPropagation(); setShowFuture(false); }}>✕</button>
          </div>
          {futureBookings.length === 0 ? (
            <p className="future-empty">No future bookings done</p>
          ) : (
            <div className="future-list">
              {futureBookings.map((b, i) => (
                <div key={i} className="future-item">
                  <div className="future-item-row">
                    <span className="fi-label">👤</span>
                    <span className="fi-value">{b['Customer Name'] || '—'}</span>
                  </div>
                  <div className="future-item-row">
                    <span className="fi-label">In</span>
                    <span className="fi-value">{b['Check-In DateTime'] || '—'}</span>
                  </div>
                  <div className="future-item-row">
                    <span className="fi-label">Out</span>
                    <span className="fi-value">{b['Expected Check-Out DateTime'] || '—'}</span>
                  </div>
                  <div className="future-item-row">
                    <span className="fi-label">Type</span>
                    <span className="fi-value">{b['Room Type'] || '—'}</span>
                  </div>
                  {b['Advance Paid'] && b['Advance Paid'] !== '0' && (
                    <div className="future-item-row">
                      <span className="fi-label">Adv.</span>
                      <span className="fi-value">₹{b['Advance Paid']}</span>
                    </div>
                  )}
                  <div className="future-item-status">{b['Booking Status']}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
