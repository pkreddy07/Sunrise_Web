// frontend/src/components/booking/ImageCapture.jsx
import React, { useRef, useState, useCallback } from 'react';
import './ImageCapture.css';

export default function ImageCapture({ label, onCapture, preview, loading }) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);

  async function openCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
      });
      setStream(mediaStream);
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      alert('Camera not available. Please upload an image instead.');
    }
  }

  function closeCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    closeCamera();
    onCapture(dataUrl);
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      onCapture(ev.target.result);
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  }

  return (
    <div className="image-capture">
      <div className="capture-label">{label}</div>

      {preview ? (
        <div className="capture-preview">
          <img src={preview} alt="Captured" />
          {loading && (
            <div className="capture-processing">
              <div className="spinner"></div>
              <span>Processing OCR...</span>
            </div>
          )}
          <button
            className="capture-retake"
            onClick={() => {
              onCapture(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            type="button"
          >
            🔄 Retake
          </button>
        </div>
      ) : (
        <div className="capture-actions">
          <button
            type="button"
            className="capture-btn camera-btn"
            onClick={openCamera}
          >
            📷 Open Camera
          </button>
          <button
            type="button"
            className="capture-btn upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            📁 Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Camera Modal */}
      {cameraOpen && (
        <div className="camera-modal">
          <div className="camera-modal-inner">
            <div className="camera-header">
              <span>📷 {label}</span>
              <button onClick={closeCamera} type="button">✕</button>
            </div>
            <div className="camera-viewfinder">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />
              <div className="camera-guide-overlay">
                <div className="guide-box"></div>
              </div>
            </div>
            <div className="camera-footer">
              <button
                type="button"
                className="camera-capture-btn"
                onClick={capturePhoto}
              >
                📸 Capture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
