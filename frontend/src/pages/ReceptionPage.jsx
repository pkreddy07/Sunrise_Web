// frontend/src/pages/ReceptionPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import RoomCard from '../components/reception/RoomCard';
import BookingModal from '../components/booking/BookingModal';
import CheckoutModal from '../components/booking/CheckoutModal';
import MultiBookModal from '../components/booking/MultiBookModal';
import PreBookModal from '../components/booking/PreBookModal';
import EmergencyInvoiceModal from '../components/booking/EmergencyInvoiceModal';
import { getRoomStatuses } from '../services/api';
import './ReceptionPage.css';

const ROOMS = [
  'Room 1', 'Room 2', 'Room 3', 'Room 4',
  'Room 5', 'Room 6', 'Room 7',
];

export default function ReceptionPage() {
  const [roomStatuses, setRoomStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [bookingRoom, setBookingRoom] = useState(null);
  const [checkoutInfo, setCheckoutInfo] = useState(null);
  const [showMultiBook, setShowMultiBook] = useState(false);
  const [showPreBook, setShowPreBook] = useState(false);
  const [showEmergencyInvoice, setShowEmergencyInvoice] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const navMenuRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (navMenuRef.current && !navMenuRef.current.contains(e.target)) {
        setShowNavMenu(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStatuses = useCallback(async () => {
    try {
      setError('');
      const result = await getRoomStatuses();
      if (result.success) {
        setRoomStatuses(result.data);
      }
    } catch (err) {
      setError('Could not load room data. Check backend connection.');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 60000);
    return () => clearInterval(interval);
  }, [fetchStatuses]);

  function handleRoomClick(roomName, action) {
    const roomData = roomStatuses[roomName];
    const isOccupied = roomData?.status === 'OCCUPIED';

    if (action === 'checkout') {
      setCheckoutInfo({ room: roomName, booking: roomData?.booking || null });
      return;
    }

    if (!isOccupied) {
      setBookingRoom(roomName);
    }
  }

  function handleBookingSuccess() { fetchStatuses(); }
  function handleCheckoutSuccess() { fetchStatuses(); }

  const occupiedCount = Object.values(roomStatuses).filter((r) => r.status === 'OCCUPIED').length;
  const availableCount = 7 - occupiedCount;

  return (
    <div className="reception-page">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1>🏨 Lodge Reception</h1>
          <div className="subtitle">
            Last updated: {lastRefresh.toLocaleTimeString('en-IN')}
          </div>
        </div>
        <div className="header-right">
          <button className="refresh-btn" onClick={fetchStatuses} title="Refresh">🔄</button>

          {/* Desktop — individual buttons */}
          <button className="header-nav-btn multi-book-btn desktop-only" onClick={() => setShowMultiBook(true)}>
            🏠 Multi-Book
          </button>
          <button className="header-nav-btn prebook-btn desktop-only" onClick={() => setShowPreBook(true)}>
            📅 Pre-Book
          </button>
          <button className="header-nav-btn emergency-invoice-btn desktop-only" onClick={() => setShowEmergencyInvoice(true)}>
            🧾 Invoice
          </button>
          <Link to="/admin-login" className="header-nav-btn desktop-only">📊 Admin</Link>

          {/* Mobile — kebab menu */}
          <div className="nav-menu-wrap mobile-only" ref={navMenuRef}>
            <button
              className="nav-menu-trigger"
              onClick={() => setShowNavMenu((p) => !p)}
              aria-label="Menu"
            >
              ⋮
            </button>
            {showNavMenu && (
              <div className="nav-dropdown">
                <button className="nav-dropdown-item invoice-item"
                  onClick={() => { setShowEmergencyInvoice(true); setShowNavMenu(false); }}>
                  🧾 Invoice
                </button>
                <button className="nav-dropdown-item multibook-item"
                  onClick={() => { setShowMultiBook(true); setShowNavMenu(false); }}>
                  🏠 Multi-Book
                </button>
                <button className="nav-dropdown-item prebook-item"
                  onClick={() => { setShowPreBook(true); setShowNavMenu(false); }}>
                  📅 Pre-Book
                </button>
                <Link to="/admin-login" className="nav-dropdown-item admin-item"
                  onClick={() => setShowNavMenu(false)}>
                  📊 Admin
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-pill green">
          <span className="pill-dot"></span>
          <span>{availableCount} Available</span>
        </div>
        <div className="status-pill red">
          <span className="pill-dot"></span>
          <span>{occupiedCount} Occupied</span>
        </div>
        <div className="status-pill gray">
          <span>7 Total Rooms</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="page-content">
          <div className="alert alert-error">
            ⚠️ {error}
            <button onClick={fetchStatuses} style={{ marginLeft: 12, fontWeight: 700 }}>Retry</button>
          </div>
        </div>
      )}

      {/* Room Grid */}
      <main className="page-content">
        {loading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <span>Loading rooms...</span>
          </div>
        ) : (
          <div className="rooms-grid">
            {ROOMS.map((roomName) => {
              const roomData = roomStatuses[roomName] || { status: 'AVAILABLE', futureBookings: [] };
              return (
                <RoomCard
                  key={roomName}
                  roomName={roomName}
                  status={roomData.status}
                  booking={roomData.booking}
                  futureBookings={roomData.futureBookings || []}
                  onClick={(action) => handleRoomClick(roomName, action)}
                />
              );
            })}
          </div>
        )}

        <div className="legend">
          <div className="legend-item">
            <span className="legend-dot green"></span>
            <span>Green = Available — Tap to Book</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot red"></span>
            <span>Red = Occupied — Tap to Checkout</span>
          </div>
          <div className="legend-item">
            <span style={{ fontSize: '1rem' }}>📅</span>
            <span>Calendar icon = View future bookings</span>
          </div>
        </div>
      </main>

      {/* Single Room Booking Modal */}
      {bookingRoom && (
        <BookingModal
          roomName={bookingRoom}
          onClose={() => setBookingRoom(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Checkout Modal */}
      {checkoutInfo && (
        <CheckoutModal
          room={checkoutInfo.room}
          booking={checkoutInfo.booking}
          onClose={() => setCheckoutInfo(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* Multi-Room Booking Modal */}
      {showMultiBook && (
        <MultiBookModal
          roomStatuses={roomStatuses}
          onClose={() => setShowMultiBook(false)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Pre-Book Modal */}
      {showPreBook && (
        <PreBookModal
          onClose={() => setShowPreBook(false)}
          onSuccess={fetchStatuses}
        />
      )}

      {/* Emergency Invoice Modal */}
      {showEmergencyInvoice && (
        <EmergencyInvoiceModal onClose={() => setShowEmergencyInvoice(false)} />
      )}
    </div>
  );
}
