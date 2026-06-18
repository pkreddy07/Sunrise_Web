// frontend/src/components/admin/AnalyticsCards.jsx
import React from 'react';
import './AnalyticsCards.css';

const CARDS = [
  { key: 'bookingsToday', label: 'Bookings Today', icon: '📅', color: 'blue' },
  { key: 'bookingsThisWeek', label: 'This Week', icon: '📆', color: 'purple' },
  { key: 'bookingsThisMonth', label: 'This Month', icon: '🗓️', color: 'orange' },
  { key: 'occupiedRooms', label: 'Occupied Rooms', icon: '🔴', color: 'red' },
  { key: 'availableRooms', label: 'Available Rooms', icon: '🟢', color: 'green' },
];

export default function AnalyticsCards({ data }) {
  return (
    <div className="analytics-cards">
      {CARDS.map((card) => (
        <div key={card.key} className={`analytics-card ac-${card.color}`}>
          <div className="ac-icon">{card.icon}</div>
          <div className="ac-value">{data?.[card.key] ?? '—'}</div>
          <div className="ac-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
