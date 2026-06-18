import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp } from '../services/api';
import './AdminLogin.css';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'the registered admin email';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState('send'); // 'send' | 'verify'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRefs = useRef([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (sessionStorage.getItem('adminAuthed') === 'true') {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  async function handleSendOtp() {
    setLoading(true);
    setError('');
    try {
      const res = await sendOtp();
      if (res.success) {
        setStep('verify');
        setSuccessMsg('OTP sent! Check your email.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(otpString);
      if (res.success) {
        sessionStorage.setItem('adminAuthed', 'true');
        navigate('/admin', { replace: true });
      } else {
        setError(res.message || 'Invalid OTP');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value, index) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(e, index) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && otp.join('').length === 6) {
      handleVerifyOtp();
    }
  }

  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon">🔐</div>
        <h1 className="admin-login-title">Admin Access</h1>
        <p className="admin-login-subtitle">
          {step === 'send'
            ? 'An OTP will be sent to the registered admin email.'
            : 'Enter the 6-digit OTP sent to your email.'}
        </p>

        <div className="admin-email-badge">
          📧 {ADMIN_EMAIL}
        </div>

        {error && <div className="admin-login-error">{error}</div>}
        {successMsg && <div className="admin-login-success">{successMsg}</div>}

        {step === 'send' ? (
          <button
            className="admin-login-btn primary"
            onClick={handleSendOtp}
            disabled={loading}
          >
            {loading ? <span className="btn-spinner" /> : null}
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        ) : (
          <>
            <div className="otp-inputs" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  className={`otp-box ${digit ? 'filled' : ''}`}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              className="admin-login-btn primary"
              onClick={handleVerifyOtp}
              disabled={loading || otp.join('').length < 6}
            >
              {loading ? <span className="btn-spinner" /> : null}
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>

            <button
              className="admin-login-btn ghost"
              onClick={handleSendOtp}
              disabled={loading}
            >
              Resend OTP
            </button>
          </>
        )}

        <button
          className="admin-login-back"
          onClick={() => navigate('/')}
        >
          ← Back to Reception
        </button>
      </div>
    </div>
  );
}
