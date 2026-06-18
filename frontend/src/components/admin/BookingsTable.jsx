// frontend/src/components/admin/BookingsTable.jsx
import React, { useState, useMemo } from 'react';
import './BookingsTable.css';

const STATUS_COLORS = {
  ACTIVE: { bg: '#dcfce7', color: '#14532d' },
  CHECKED_OUT: { bg: '#f3f4f6', color: '#4b5563' },
};

const PAGE_SIZE = 10;

export default function BookingsTable({ bookings }) {
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        b['Booking ID']?.toLowerCase().includes(q) ||
        b['Customer Name']?.toLowerCase().includes(q) ||
        b['Contact Number']?.includes(q) ||
        b['Aadhaar Number']?.includes(q);

      const matchDate =
        !filterDate || b['Check-In DateTime']?.includes(filterDate);

      const matchRoom = !filterRoom || b['Room Number'] === filterRoom;

      const matchStatus =
        !filterStatus || b['Booking Status'] === filterStatus;

      return matchSearch && matchDate && matchRoom && matchStatus;
    });
  }, [bookings, search, filterDate, filterRoom, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setSearch('');
    setFilterDate('');
    setFilterRoom('');
    setFilterStatus('');
    setPage(1);
  }

  return (
    <div className="bookings-table-container">
      {/* Filters */}
      <div className="table-filters">
        <input
          className="form-input filter-search"
          type="text"
          placeholder="🔍 Search by name, booking ID, contact..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className="filter-row">
          <input
            className="form-input"
            type="date"
            value={filterDate}
            onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
            title="Filter by date"
          />
          <select
            className="form-input"
            value={filterRoom}
            onChange={(e) => { setFilterRoom(e.target.value); setPage(1); }}
          >
            <option value="">All Rooms</option>
            {[1,2,3,4,5,6,7].map((n) => (
              <option key={n} value={`Room ${n}`}>Room {n}</option>
            ))}
          </select>
          <select
            className="form-input"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="CHECKED_OUT">Checked Out</option>
          </select>
          {(search || filterDate || filterRoom || filterStatus) && (
            <button className="btn btn-outline" onClick={resetFilters}>
              ✕ Clear
            </button>
          )}
        </div>
        <div className="table-count">
          Showing {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="table-scroll">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Room</th>
              <th>Type</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="table-empty">
                  No bookings found
                </td>
              </tr>
            ) : (
              paginated.map((b, i) => {
                const statusStyle = STATUS_COLORS[b['Booking Status']] || STATUS_COLORS.CHECKED_OUT;
                return (
                  <tr key={b['Booking ID'] || i} className={b['Booking Status'] === 'ACTIVE' ? 'row-active' : ''}>
                    <td className="td-booking-id">{b['Booking ID']}</td>
                    <td>
                      <div className="td-name">{b['Customer Name']}</div>
                      <div className="td-sub">{b['Contact Number']}</div>
                    </td>
                    <td>{b['Room Number']}</td>
                    <td>{b['Room Type']}</td>
                    <td className="td-date">{b['Check-In DateTime']}</td>
                    <td className="td-date">
                      {b['Actual Check-Out DateTime'] || b['Expected Check-Out DateTime']}
                    </td>
                    <td className="td-amount">₹{parseInt(b['Room Cost'] || 0).toLocaleString()}</td>
                    <td>
                      <span className="payment-badge">{b['Payment Type']}</span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        {b['Booking Status']}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline"
            disabled={page === 1}
            onClick={() => setPage(1)}
          >
            «
          </button>
          <button
            className="btn btn-outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹ Prev
          </button>
          <span className="page-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
          <button
            className="btn btn-outline"
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
