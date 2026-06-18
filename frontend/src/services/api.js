// frontend/src/services/api.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ─── Rooms ────────────────────────────────────────────────
export async function getRoomStatuses() {
  const res = await api.get('/rooms/status');
  return res.data;
}

// ─── OCR ──────────────────────────────────────────────────
export async function processOcrFront(imageBase64) {
  const res = await api.post('/ocr/front', { image: imageBase64 });
  return res.data;
}

export async function processOcrBack(imageBase64) {
  const res = await api.post('/ocr/back', { image: imageBase64 });
  return res.data;
}

// ─── Bookings ─────────────────────────────────────────────
export async function createBooking(bookingData) {
  const res = await api.post('/bookings', bookingData);
  return res.data;
}

export async function checkoutBooking(bookingId) {
  const res = await api.post('/bookings/checkout', { bookingId });
  return res.data;
}

export async function getAllBookings() {
  const res = await api.get('/bookings');
  return res.data;
}

// ─── Admin ────────────────────────────────────────────────
export async function getAnalytics() {
  const res = await api.get('/admin/analytics');
  return res.data;
}

// ─── QR Code URL ──────────────────────────────────────────
export function getQrCodeUrl() {
  return `${BASE_URL}/qr-code`;
}

export default api;
