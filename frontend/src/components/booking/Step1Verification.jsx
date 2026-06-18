// frontend/src/components/booking/Step1Verification.jsx
import React, { useState } from 'react';
import ImageCapture from './ImageCapture';
import { processOcrFront, processOcrBack } from '../../services/api';
import './Step1Verification.css';

export default function Step1Verification({ formData, onChange, onNext }) {
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [frontLoading, setFrontLoading] = useState(false);
  const [backLoading, setBackLoading] = useState(false);
  const [error, setError] = useState('');
  const [ocrStatus, setOcrStatus] = useState({ front: '', back: '' });

  async function handleFrontCapture(imageDataUrl) {
    setFrontPreview(imageDataUrl);
    if (!imageDataUrl) {
      setOcrStatus((s) => ({ ...s, front: '' }));
      return;
    }

    setFrontLoading(true);
    setError('');
    try {
      const result = await processOcrFront(imageDataUrl);
      if (result.success) {
        const { fullName, dob, age, gender, aadhaarNumber } = result.data;
        onChange({
          ...formData,
          fullName: fullName || formData.fullName,
          dob: dob || formData.dob,
          age: age || formData.age,
          gender: gender || formData.gender,
          aadhaarNumber: aadhaarNumber || formData.aadhaarNumber,
        });
        setOcrStatus((s) => ({ ...s, front: 'success' }));
      }
    } catch (err) {
      setError('OCR failed for front side. Please fill details manually.');
      setOcrStatus((s) => ({ ...s, front: 'error' }));
    } finally {
      setFrontLoading(false);
    }
  }

  async function handleBackCapture(imageDataUrl) {
    setBackPreview(imageDataUrl);
    if (!imageDataUrl) {
      setOcrStatus((s) => ({ ...s, back: '' }));
      return;
    }

    setBackLoading(true);
    setError('');
    try {
      const result = await processOcrBack(imageDataUrl);
      if (result.success) {
        const { address } = result.data;
        onChange({ ...formData, address: address || formData.address });
        setOcrStatus((s) => ({ ...s, back: 'success' }));
      }
    } catch (err) {
      setError('OCR failed for back side. Please enter address manually.');
      setOcrStatus((s) => ({ ...s, back: 'error' }));
    } finally {
      setBackLoading(false);
    }
  }

  function handleChange(field, value) {
    onChange({ ...formData, [field]: value });
  }

  function validate() {
    if (!formData.fullName?.trim()) return 'Please enter customer name';
    if (!formData.contactNumber?.trim()) return 'Please enter contact number';
    if (!formData.checkIn?.trim()) return 'Please enter check-in date & time';
    if (!formData.checkOut?.trim()) return 'Please enter check-out date & time';
    return null;
  }

  function handleNext() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    onNext();
  }

  return (
    <div className="step1">
      {/* Aadhaar Upload Section */}
      <div className="aadhaar-section">
        <h3 className="section-title">📇 Aadhaar Card Upload</h3>
        <p className="section-hint">Upload Aadhaar to auto-fill customer details</p>

        <div className="aadhaar-captures">
          <ImageCapture
            label="📄 Front Side of Aadhaar"
            onCapture={handleFrontCapture}
            preview={frontPreview}
            loading={frontLoading}
          />
          {ocrStatus.front === 'success' && (
            <div className="ocr-badge success">✅ Details extracted successfully</div>
          )}

          <ImageCapture
            label="📄 Back Side of Aadhaar"
            onCapture={handleBackCapture}
            preview={backPreview}
            loading={backLoading}
          />
          {ocrStatus.back === 'success' && (
            <div className="ocr-badge success">✅ Address extracted successfully</div>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Customer Details Form */}
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
              placeholder={
                backPreview
                  ? 'Auto-filled from back side'
                  : 'Enter address manually'
              }
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
