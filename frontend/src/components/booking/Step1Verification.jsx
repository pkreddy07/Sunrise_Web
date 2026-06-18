// frontend/src/components/booking/Step1Verification.jsx
import React, { useState } from 'react';
import ImageCapture from './ImageCapture';
import { processOcrFront, processOcrBack } from '../../services/api';
import './Step1Verification.css';

export default function Step1Verification({ formData, onChange, onNext }) {
  // ── QR method state ──────────────────────────────────────
  const [qrPreview, setQrPreview]   = useState(null);
  const [qrLoading, setQrLoading]   = useState(false);
  const [qrStatus,  setQrStatus]    = useState(''); // '' | 'success' | 'error'

  // ── Photos method state ──────────────────────────────────
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview,  setBackPreview]  = useState(null);
  const [frontLoading, setFrontLoading] = useState(false);
  const [backLoading,  setBackLoading]  = useState(false);
  const [photoStatus,  setPhotoStatus]  = useState({ front: '', back: '' });

  const [error, setError] = useState('');

  // ── QR handler — QR extraction only, no OCR fallback ────
  async function handleQrCapture(imageDataUrl) {
    setQrPreview(imageDataUrl);
    if (!imageDataUrl) { setQrStatus(''); return; }

    setQrLoading(true);
    setError('');
    try {
      const result = await processOcrBack(imageDataUrl, false);
      if (result.success && result.data.source === 'qr') {
        const { fullName, dob, age, gender, aadhaarNumber, address } = result.data;
        onChange({
          ...formData,
          fullName:      fullName      || formData.fullName,
          dob:           dob           || formData.dob,
          age:           age           || formData.age,
          gender:        gender        || formData.gender,
          aadhaarNumber: aadhaarNumber || formData.aadhaarNumber,
          address:       address       || formData.address,
        });
        setQrStatus('success');
      } else {
        // QR not found in this image
        setQrStatus('error');
      }
    } catch {
      setQrStatus('error');
    } finally {
      setQrLoading(false);
    }
  }

  // ── Front handler — OCR only ─────────────────────────────
  async function handleFrontCapture(imageDataUrl) {
    setFrontPreview(imageDataUrl);
    if (!imageDataUrl) { setPhotoStatus((s) => ({ ...s, front: '' })); return; }

    setFrontLoading(true);
    setError('');
    try {
      const result = await processOcrFront(imageDataUrl);
      if (result.success) {
        const { fullName, dob, age, gender, aadhaarNumber } = result.data;
        onChange({
          ...formData,
          fullName:      fullName      || formData.fullName,
          dob:           dob           || formData.dob,
          age:           age           || formData.age,
          gender:        gender        || formData.gender,
          aadhaarNumber: aadhaarNumber || formData.aadhaarNumber,
        });
        setPhotoStatus((s) => ({ ...s, front: 'success' }));
      }
    } catch {
      setError('OCR failed for front side. Please fill details manually.');
      setPhotoStatus((s) => ({ ...s, front: 'error' }));
    } finally {
      setFrontLoading(false);
    }
  }

  // ── Back handler — OCR only (skip QR) ───────────────────
  async function handleBackCapture(imageDataUrl) {
    setBackPreview(imageDataUrl);
    if (!imageDataUrl) { setPhotoStatus((s) => ({ ...s, back: '' })); return; }

    setBackLoading(true);
    setError('');
    try {
      const result = await processOcrBack(imageDataUrl, true); // useOcr: true
      if (result.success) {
        onChange({ ...formData, address: result.data.address || formData.address });
        setPhotoStatus((s) => ({ ...s, back: 'success' }));
      }
    } catch {
      setError('OCR failed for back side. Please enter address manually.');
      setPhotoStatus((s) => ({ ...s, back: 'error' }));
    } finally {
      setBackLoading(false);
    }
  }

  function handleChange(field, value) {
    onChange({ ...formData, [field]: value });
  }

  function validate() {
    if (!formData.fullName?.trim())     return 'Please enter customer name';
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

  const anyPreview = qrPreview || backPreview;

  return (
    <div className="step1">
      {/* ── Aadhaar Upload ── */}
      <div className="aadhaar-section">
        <h3 className="section-title">📇 Aadhaar Card Upload</h3>
        <p className="section-hint">Choose a method to auto-fill customer details</p>

        <div className="aadhaar-methods">
          {/* ── Method 1: Scan QR ── */}
          <div className="aadhaar-method">
            <div className="method-header">
              <span className="method-icon">📱</span>
              <div>
                <div className="method-title">Scan QR Code</div>
                <div className="method-desc">Capture the QR on the address side — fills all fields instantly</div>
              </div>
            </div>

            <ImageCapture
              label="Aadhaar Address Side (QR)"
              onCapture={handleQrCapture}
              preview={qrPreview}
              loading={qrLoading}
            />

            {qrStatus === 'success' && (
              <div className="ocr-badge success">✅ All details extracted from QR code</div>
            )}
            {qrStatus === 'error' && (
              <div className="ocr-badge error">❌ QR not readable — try Front + Back Photos</div>
            )}
          </div>

          {/* ── OR Divider ── */}
          <div className="method-or-divider">
            <div className="or-bar" />
            <div className="or-circle">OR</div>
            <div className="or-bar" />
          </div>

          {/* ── Method 2: Front + Back Photos ── */}
          <div className="aadhaar-method">
            <div className="method-header">
              <span className="method-icon">📸</span>
              <div>
                <div className="method-title">Front + Back Photos</div>
                <div className="method-desc">Upload both sides separately using OCR</div>
              </div>
            </div>

            <ImageCapture
              label="Front Side (Name & DOB)"
              onCapture={handleFrontCapture}
              preview={frontPreview}
              loading={frontLoading}
            />
            {photoStatus.front === 'success' && (
              <div className="ocr-badge success">✅ Name & details extracted</div>
            )}
            {photoStatus.front === 'error' && (
              <div className="ocr-badge error">❌ Extraction failed — fill manually</div>
            )}

            <ImageCapture
              label="Back Side (Address)"
              onCapture={handleBackCapture}
              preview={backPreview}
              loading={backLoading}
            />
            {photoStatus.back === 'success' && (
              <div className="ocr-badge success">✅ Address extracted</div>
            )}
            {photoStatus.back === 'error' && (
              <div className="ocr-badge error">❌ Extraction failed — fill manually</div>
            )}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* ── Customer Details Form ── */}
      <div className="customer-details">
        <h3 className="section-title">👤 Customer Details</h3>
        <p className="section-hint">Auto-filled from Aadhaar. Edit if needed.</p>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              type="text"
              value={formData.fullName || ''}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input
              className="form-input"
              type="text"
              value={formData.dob || ''}
              onChange={(e) => handleChange('dob', e.target.value)}
              placeholder="DD/MM/YYYY"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Age</label>
            <input
              className="form-input"
              type="text"
              value={formData.age || ''}
              readOnly
              placeholder="Auto calculated"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select
              className="form-input"
              value={formData.gender || ''}
              onChange={(e) => handleChange('gender', e.target.value)}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label className="form-label">Contact Number *</label>
            <input
              className="form-input"
              type="tel"
              value={formData.contactNumber || ''}
              onChange={(e) => handleChange('contactNumber', e.target.value)}
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
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
            <label className="form-label">Address</label>
            <textarea
              className="form-input"
              rows={3}
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder={anyPreview ? 'Auto-filled from Aadhaar' : 'Enter address manually'}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Check-In Date & Time *</label>
            <input
              className="form-input"
              type="datetime-local"
              value={formData.checkIn || ''}
              onChange={(e) => handleChange('checkIn', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Check-Out Date & Time *</label>
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
