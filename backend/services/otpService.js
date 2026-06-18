// backend/services/otpService.js
const otpStore = new Map(); // email → { otp, expiresAt }
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createOtp(email) {
  const otp = generateOtp();
  otpStore.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS });
  return otp;
}

function verifyOtp(email, inputOtp) {
  const record = otpStore.get(email);
  if (!record) return { valid: false, reason: 'No OTP requested for this email' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { valid: false, reason: 'OTP has expired. Please request a new one.' };
  }
  if (record.otp !== String(inputOtp)) return { valid: false, reason: 'Invalid OTP' };
  otpStore.delete(email); // single-use
  return { valid: true };
}

module.exports = { createOtp, verifyOtp };
