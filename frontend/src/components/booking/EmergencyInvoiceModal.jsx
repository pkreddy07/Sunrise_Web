// frontend/src/components/booking/EmergencyInvoiceModal.jsx
import React, { useState, useEffect } from 'react';
import { generateInvoice } from '../../utils/generateInvoice';
import './EmergencyInvoiceModal.css';

const ROOM_TYPES = [
  { name: 'Room only', price: 1500, icon: '🏛️' },
  { name: 'Room + breakfast', price: 1800, icon: '🍽️' },
  { name: 'Luxury', price: 2000, icon: '👑' },
];

function generateEmergencyId() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `BK-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function calcAge(dob) {
  if (!dob) return '';
  const parts = dob.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts.map(Number);
  if (!y || !m || !d) return '';
  const birth = new Date(y, m - 1, d);
  if (isNaN(birth.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const mo = now.getMonth() - birth.getMonth();
  if (mo < 0 || (mo === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? String(age) : '';
}

// Build rooms[] in the same sequential order as the counter UI
function buildRooms(typeCounts, roomSlots) {
  const rooms = [];
  let idx = 0;
  for (const type of ROOM_TYPES) {
    for (let i = 0; i < (typeCounts[type.name] || 0); i++) {
      rooms.push({ roomNumber: roomSlots[idx] || '', roomType: type.name, roomCost: type.price });
      idx++;
    }
  }
  return rooms;
}

// Returns a label for each room slot in sequential order
function slotLabels(typeCounts) {
  const labels = [];
  for (const type of ROOM_TYPES) {
    for (let i = 0; i < (typeCounts[type.name] || 0); i++) {
      labels.push(`${type.icon} ${type.name}`);
    }
  }
  return labels;
}

export default function EmergencyInvoiceModal({ onClose }) {
  const [formData, setFormData] = useState({
    fullName: '', dob: '', age: '', gender: '',
    contactNumber: '', aadhaarNumber: '', address: '',
    checkIn: '', checkOut: '', paymentType: '', roomCost: '',
  });

  const [typeCounts, setTypeCounts] = useState({
    'Room only': 0, 'Room + breakfast': 0, 'Luxury': 0,
  });

  const [roomSlots, setRoomSlots] = useState([]);

  // Auto-calc age from DOB
  useEffect(() => {
    setFormData((prev) => ({ ...prev, age: calcAge(prev.dob) }));
  }, [formData.dob]);

  // Sync slot count + auto-fill total when counters change
  useEffect(() => {
    const total = Object.values(typeCounts).reduce((s, v) => s + v, 0);
    setRoomSlots((prev) => {
      const next = [...prev];
      while (next.length < total) next.push('');
      return next.slice(0, total);
    });
    const autoTotal = ROOM_TYPES.reduce((s, t) => s + (typeCounts[t.name] || 0) * t.price, 0);
    if (autoTotal > 0) {
      setFormData((prev) => ({ ...prev, roomCost: String(autoTotal) }));
    }
  }, [typeCounts]);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function adjustCount(typeName, delta) {
    setTypeCounts((prev) => {
      const next = (prev[typeName] || 0) + delta;
      if (next < 0) return prev;
      return { ...prev, [typeName]: next };
    });
  }

  function handleSlotChange(idx, value) {
    setRoomSlots((prev) => { const n = [...prev]; n[idx] = value; return n; });
  }

  const totalRooms = Object.values(typeCounts).reduce((s, v) => s + v, 0);
  const labels = slotLabels(typeCounts);

  function handleDownload() {
    const rooms = totalRooms > 0 ? buildRooms(typeCounts, roomSlots) : null;
    generateInvoice(generateEmergencyId(), formData, rooms);
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box ei-modal-box">
        <div className="modal-header">
          <h2>⚡ Generate Invoice</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          <div className="ei-form-grid">

            {/* ── Guest Details ── */}
            <div className="ei-group">
              <label className="ei-label">Full Name</label>
              <input className="ei-input" type="text" value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)} placeholder="Enter full name" />
            </div>

            <div className="ei-group">
              <label className="ei-label">Date of Birth</label>
              <input className="ei-input" type="text" value={formData.dob}
                onChange={(e) => handleChange('dob', e.target.value)} placeholder="DD/MM/YYYY" />
            </div>

            <div className="ei-group">
              <label className="ei-label">Age</label>
              <input className="ei-input ei-readonly" type="text"
                value={formData.age ? `${formData.age} years` : ''} readOnly placeholder="Auto from DOB" />
            </div>

            <div className="ei-group">
              <label className="ei-label">Gender</label>
              <select className="ei-input" value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="ei-group">
              <label className="ei-label">Contact Number</label>
              <input className="ei-input" type="tel" value={formData.contactNumber}
                onChange={(e) => handleChange('contactNumber', e.target.value)}
                placeholder="10-digit mobile" maxLength={10} />
            </div>

            <div className="ei-group">
              <label className="ei-label">Aadhaar Number</label>
              <input className="ei-input" type="text" value={formData.aadhaarNumber}
                onChange={(e) => handleChange('aadhaarNumber', e.target.value)}
                placeholder="12-digit Aadhaar" maxLength={12} />
            </div>

            <div className="ei-group ei-full-width">
              <label className="ei-label">Address</label>
              <textarea className="ei-input" rows={2} value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)} placeholder="Enter address" />
            </div>

            <div className="ei-group">
              <label className="ei-label">Check-In Date &amp; Time</label>
              <input className="ei-input" type="datetime-local" value={formData.checkIn}
                onChange={(e) => handleChange('checkIn', e.target.value)} />
            </div>

            <div className="ei-group">
              <label className="ei-label">Check-Out Date &amp; Time</label>
              <input className="ei-input" type="datetime-local" value={formData.checkOut}
                onChange={(e) => handleChange('checkOut', e.target.value)} />
            </div>

            {/* ── Room Types (counter UI) ── */}
            <div className="ei-group ei-full-width">
              <label className="ei-label">Room Types</label>
              <div className="ei-counter-list">
                {ROOM_TYPES.map((type) => (
                  <div key={type.name} className="ei-counter-row">
                    <div className="ei-counter-info">
                      <span className="ei-counter-icon">{type.icon}</span>
                      <div>
                        <span className="ei-counter-name">{type.name}</span>
                        <span className="ei-counter-price"> — ₹{type.price.toLocaleString()}/room</span>
                      </div>
                    </div>
                    <div className="ei-counter-ctrl">
                      <button className="ei-cnt-btn" onClick={() => adjustCount(type.name, -1)}>−</button>
                      <span className="ei-cnt-val">{typeCounts[type.name] || 0}</span>
                      <button className="ei-cnt-btn" onClick={() => adjustCount(type.name, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Room Number Slots (shown when any counter > 0) ── */}
            {totalRooms > 0 && (
              <div className="ei-group ei-full-width">
                <label className="ei-label">Room Numbers</label>
                <div className="ei-slot-grid">
                  {labels.map((label, i) => (
                    <div key={i} className="ei-slot-row">
                      <span className="ei-slot-label">{label}</span>
                      <input
                        className="ei-input ei-slot-input"
                        type="text"
                        value={roomSlots[i] || ''}
                        onChange={(e) => handleSlotChange(i, e.target.value)}
                        placeholder="e.g. Room 3"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Payment ── */}
            <div className="ei-group">
              <label className="ei-label">Payment Method</label>
              <select className="ei-input" value={formData.paymentType}
                onChange={(e) => handleChange('paymentType', e.target.value)}>
                <option value="">Select method</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <div className="ei-group">
              <label className="ei-label">Total Amount (₹)</label>
              <input className="ei-input" type="number" min={0} value={formData.roomCost}
                onChange={(e) => handleChange('roomCost', e.target.value)} placeholder="Enter amount" />
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>✕ Cancel</button>
          <button className="btn btn-primary btn-lg" onClick={handleDownload}>
            🧾 Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
