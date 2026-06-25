// frontend/src/components/booking/Step1Verification.jsx
import React, { useState } from 'react';
import ImageCapture from './ImageCapture';
import { processOcrFront, processOcrBack } from '../../services/api';
import './Step1Verification.css';

export default function Step1Verification({ formData, onChange, onNext }) {
  // QR method
  const [qrPreview,   setQrPreview]   = useState(null);
  const [qrLoading,   setQrLoading]   = useState(false);
  const [qrStatus,    setQrStatus]    = useState('');

  // Name image
  const [namePreview,  setNamePreview]  = useState(null);
  const [nameLoading,  setNameLoading]  = useState(false);
  const [nameStatus,   setNameStatus]   = useState('');

  // Aadhaar number image
  const [numPreview,   setNumPreview]   = useState(null);
  const [numLoading,   setNumLoading]   = useState(false);
  const [numStatus,    setNumStatus]    = useState('');

  const [error, setError] = useState('');

  // QR: fills fullName + aadhaarNumber
  async function handleQrCapture(imageDataUrl) {
    setQrPreview(imageDataUrl);
    if (!imageDataUrl) { setQrStatus(''); return; }
    setQrLoading(true);
    setError('');
    try {
      const result = await processOcrBack(imageDataUrl, false);
      if (result.success && result.data.source === 'qr') {
        const { fullName, aadhaarNumber } = result.data;
        onChange({
          ...formData,
          fullName:      fullName      || formData.fullName,
          aadhaarNumber: aadhaarNumber || formData.aadhaarNumber,
        });
        setQrStatus('success');
      } else {
        setQrStatus('error');
      }
    } catch {
      setQrStatus('error');
    } finally {
      setQrLoading(false);
    }
  }

  // Name image: front OCR → fills fullName + aadhaarNumber (both if found)
  async function handleNameCapture(imageDataUrl) {
    setNamePreview(imageDataUrl);
    if (!imageDataUrl) { setNameStatus(''); return; }
    setNameLoading(true);
    setError('');
    try {
      const result = await processOcrFront(imageDataUrl);
      const { fullName, aadhaarNumber } = result.data || {};
      if (result.success && (fullName || aadhaarNumber)) {
        onChange({
          ...formData,
          ...(fullName      ? { fullName }      : {}),
          ...(aadhaarNumber ? { aadhaarNumber } : {}),
        });
        setNameStatus('success');
      } else {
        setNameStatus('error');
      }
    } catch {
      setNameStatus('error');
    } finally {
      setNameLoading(false);
    }
  }

  // Aadhaar number image: front OCR → only fills aadhaarNumber
  async function handleNumCapture(imageDataUrl) {
    setNumPreview(imageDataUrl);
    if (!imageDataUrl) { setNumStatus(''); return; }
    setNumLoading(true);
    setError('');
    try {
      const result = await processOcrFront(imageDataUrl);
      if (result.success && result.data.aadhaarNumber) {
        onChange({ ...formData, aadhaarNumber: result.data.aadhaarNumber });
        setNumStatus('success');
      } else {
        setNumStatus('error');
      }
    } catch {
      setNumStatus('error');
    } finally {
      setNumLoading(false);
    }
  }

  function handleChange(field, value) {
    onChange({ ...formData, [field]: value });
  }

  function validate() {
    if (!formData.fullName?.trim())      return 'Please enter customer name';
    if (!formData.contactNumber?.trim()) return 'Please enter contact number';
    if (!formData.checkIn?.trim())       return 'Please enter check-in date & time';
    if (!formData.checkOut?.trim())      return 'Please enter check-out date & time';
    return null;
  }

  function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    onNext();
  }

  return (
    <div className="step1">

      {/* ── Aadhaar Upload ── */}
      <div className="aadhaar-section">
        <h3 className="section-title">📇 Aadhaar Card</h3>
        <p className="section-hint">Choose a method to auto-fill customer details</p>

        <div className="aadhaar-methods">

          {/* Method 1: QR scan */}
          <div className="aadhaar-method">
            <div className="method-header">
              <span className="method-icon">📱</span>
              <div>
                <div className="method-title">Scan QR Code</div>
                <div className="method-desc">Capture the QR on the address side — fills name &amp; Aadhaar number instantly</div>
              </div>
            </div>
            <ImageCapture
              label="Aadhaar QR Side"
              onCapture={handleQrCapture}
              preview={qrPreview}
              loading={qrLoading}
            />
            {qrStatus === 'success' && (
              <div className="ocr-badge success">✅ Name &amp; Aadhaar number extracted</div>
            )}
            {qrStatus === 'error' && (
              <div className="ocr-badge error">❌ QR not readable — try images below</div>
            )}
          </div>

          {/* OR divider */}
          <div className="method-or-divider">
            <div className="or-bar" />
            <div className="or-circle">OR</div>
            <div className="or-bar" />
          </div>

          {/* Method 2: two image captures */}
          <div className="aadhaar-method">
            <div className="method-header">
              <span className="method-icon">📸</span>
              <div>
                <div className="method-title">Card Images</div>
                <div className="method-desc">Capture name and Aadhaar number separately</div>
              </div>
            </div>

            <ImageCapture
              label="Name"
              onCapture={handleNameCapture}
              preview={namePreview}
              loading={nameLoading}
            />
            {nameStatus === 'success' && (
              <div className="ocr-badge success">✅ Name & Aadhar number extracted</div>
            )}
            {nameStatus === 'error' && (
              <div className="ocr-badge error">❌ Could not extract name, aadhar — fill manually</div>
            )}

            <ImageCapture
              label="Aadhaar Number"
              onCapture={handleNumCapture}
              preview={numPreview}
              loading={numLoading}
            />
            {numStatus === 'success' && (
              <div className="ocr-badge success">✅ Aadhaar number extracted</div>
            )}
            {numStatus === 'error' && (
              <div className="ocr-badge error">❌ Could not extract number — fill manually</div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* ── Customer Details ── */}
      <div className="customer-details">
        <h3 className="section-title">👤 Customer Details</h3>
        <p className="section-hint">Auto-filled from Aadhaar. Edit if needed.</p>

        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              type="text"
              value={formData.fullName || ''}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Aadhaar Number</label>
            <input
              className="form-input"
              type="text"
              value={formData.aadhaarNumber || ''}
              onChange={(e) => handleChange('aadhaarNumber', e.target.value)}
              placeholder="12-digit Aadhaar number"
              maxLength={12}
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Contact Number *</label>
            <input
              className="form-input"
              type="tel"
              value={formData.contactNumber || ''}
              onChange={(e) => handleChange('contactNumber', e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Check-In Date &amp; Time *</label>
            <input
              className="form-input"
              type="datetime-local"
              value={formData.checkIn || ''}
              onChange={(e) => handleChange('checkIn', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Check-Out Date &amp; Time *</label>
            <input
              className="form-input"
              type="datetime-local"
              value={formData.checkOut || ''}
              onChange={(e) => handleChange('checkOut', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-primary btn-lg" onClick={handleNext}>
          Next: Select Room Type →
        </button>
      </div>
    </div>
  );
}
