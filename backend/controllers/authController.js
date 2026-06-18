// backend/controllers/authController.js
const nodemailer = require('nodemailer');
const otpService = require('../services/otpService');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtp(req, res) {
  try {
    if (!ADMIN_EMAIL || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: 'Email not configured. Set EMAIL_USER, EMAIL_PASS, ADMIN_EMAIL in .env',
      });
    }

    const otp = otpService.createOtp(ADMIN_EMAIL);

    await transporter.sendMail({
      from: `"Sunrise Lodge" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: 'Admin Login OTP – Sunrise Lodge',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
          <h2 style="margin:0 0 8px;color:#1e293b;">Admin Login OTP</h2>
          <p style="color:#64748b;margin:0 0 24px;">Use the code below to access the Sunrise Lodge admin dashboard. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align:center;letter-spacing:12px;font-size:36px;font-weight:700;color:#2563eb;padding:16px;background:#eff6ff;border-radius:6px;">
            ${otp}
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;">If you did not request this, ignore this email.</p>
        </div>
      `,
    });

    return res.json({ success: true, message: 'OTP sent to admin email' });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
  }
}

async function verifyOtp(req, res) {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    const result = otpService.verifyOtp(ADMIN_EMAIL, otp);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    return res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
}

module.exports = { sendOtp, verifyOtp };
