// frontend/src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AnalyticsCards from '../components/admin/AnalyticsCards';
import AdminCharts from '../components/admin/AdminCharts';
import BookingsTable from '../components/admin/BookingsTable';
import { getAnalytics, getAllBookings } from '../services/api';
import './AdminPage.css';

export default function AdminPage() {
  const [analytics, setAnalytics] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, bookingsRes] = await Promise.all([
        getAnalytics(),
        getAllBookings(),
      ]);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (bookingsRes.success) setBookings(bookingsRes.data);
    } catch (err) {
      setError('Could not load admin data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1>📊 Admin Dashboard</h1>
          <div className="subtitle">Lodge Analytics & Booking Management</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="refresh-btn" onClick={fetchData} title="Refresh">
            🔄
          </button>
          <Link to="/" className="header-nav-btn">
            🏨 Reception
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`admin-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📋 All Bookings
        </button>
      </div>

      {/* Content */}
      <main className="admin-content">
        {loading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <span>Loading dashboard...</span>
          </div>
        ) : error ? (
          <div className="alert alert-error">
            ⚠️ {error}
            <button onClick={fetchData} style={{ marginLeft: 12, fontWeight: 700 }}>
              Retry
            </button>
          </div>
        ) : activeTab === 'overview' ? (
          <div className="admin-overview">
            <section>
              <div className="section-heading">📈 Key Metrics</div>
              <AnalyticsCards data={analytics} />
            </section>

            <section>
              <div className="section-heading">📊 Charts & Analytics</div>
              <AdminCharts analytics={analytics} />
            </section>
          </div>
        ) : (
          <div className="admin-bookings">
            <div className="section-heading">
              📋 All Bookings
              <span className="booking-total">({bookings.length} total)</span>
            </div>
            <BookingsTable bookings={[...bookings].reverse()} />
          </div>
        )}
      </main>
    </div>
  );
}
