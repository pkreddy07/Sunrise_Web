import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ReceptionPage from './pages/ReceptionPage';
import AdminPage from './pages/AdminPage';
import AdminLogin from './pages/AdminLogin';

function RequireAdminAuth({ children }) {
  const authed = sessionStorage.getItem('adminAuthed') === 'true';
  return authed ? children : <Navigate to="/admin-login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReceptionPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAdminAuth>
              <AdminPage />
            </RequireAdminAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
