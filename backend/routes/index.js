// backend/routes/index.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const ocrController = require('../controllers/ocrController');
const authController = require('../controllers/authController');
const path = require('path');
const fs = require('fs');

// ─── Room Routes ───────────────────────────────────────────
router.get('/rooms/status', bookingController.getRoomStatuses);

// ─── Booking Routes ────────────────────────────────────────
router.post('/bookings', bookingController.createBooking);
router.get('/bookings', bookingController.getAllBookings);
router.post('/bookings/checkout', bookingController.checkoutBooking);

// ─── OCR Routes ────────────────────────────────────────────
router.post('/ocr/front', ocrController.processFront);
router.post('/ocr/back', ocrController.processBack);

// ─── Auth Routes ───────────────────────────────────────────
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-otp', authController.verifyOtp);

// ─── Admin Routes ──────────────────────────────────────────
router.get('/admin/analytics', bookingController.getAnalytics);

// ─── QR Code Route ─────────────────────────────────────────
router.get('/qr-code', (req, res) => {
  const qrFile = process.env.QR_CODE_IMAGE || 'qr-payment.png';
  const qrPath = path.join(__dirname, '..', 'assets', qrFile);

  if (fs.existsSync(qrPath)) {
    res.sendFile(qrPath);
  } else {
    // Return a placeholder QR code SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white" stroke="#ccc" stroke-width="2"/>
      <text x="100" y="90" text-anchor="middle" font-size="14" fill="#666">QR Code</text>
      <text x="100" y="110" text-anchor="middle" font-size="12" fill="#999">Place qr-payment.png</text>
      <text x="100" y="128" text-anchor="middle" font-size="12" fill="#999">in backend/assets/</text>
    </svg>`);
  }
});

// ─── Health Check ──────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
