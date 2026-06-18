import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReceptionPage from './pages/ReceptionPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReceptionPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
