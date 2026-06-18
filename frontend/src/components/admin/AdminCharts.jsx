// frontend/src/components/admin/AdminCharts.jsx
import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import './AdminCharts.css';

const PIE_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#dc2626', '#0891b2', '#d97706'];

function ChartCard({ title, children }) {
  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <div className="chart-body">{children}</div>
    </div>
  );
}

export default function AdminCharts({ analytics }) {
  if (!analytics) return null;

  // Room type distribution
  const roomTypeData = Object.entries(analytics.roomTypeDistribution || {}).map(
    ([name, value]) => ({ name, value })
  );

  // Room-wise occupancy
  const roomOccupancyData = Object.entries(analytics.roomOccupancy || {}).map(
    ([name, value]) => ({ name: name.replace('Room ', 'R'), value })
  );

  // Daily bookings
  const dailyData = Object.entries(analytics.dailyBookings || {}).map(
    ([date, count]) => ({ date, count })
  );

  // Revenue trend
  const revenueData = Object.entries(analytics.revenueByDay || {}).map(
    ([date, revenue]) => ({ date, revenue })
  );

  return (
    <div className="charts-grid">
      <ChartCard title="📊 Room Type Distribution">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={roomTypeData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {roomTypeData.map((entry, index) => (
                <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${v} bookings`, '']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="🏨 Room Wise Occupancy">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={roomOccupancyData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {roomOccupancyData.map((entry, index) => (
                <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${v} bookings`, '']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="📅 Daily Bookings (Last 30 Days)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              interval={4}
            />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Bookings" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="💰 Revenue Trend (Last 30 Days)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              interval={4}
            />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
            <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#16a34a"
              strokeWidth={2.5}
              dot={false}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
