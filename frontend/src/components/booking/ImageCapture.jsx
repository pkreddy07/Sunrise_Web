// frontend/src/components/booking/ImageCapture.jsx
import React, { useRef, useState, useCallback } from 'react';
import './ImageCapture.css';

export default function ImageCapture({ label, onCapture, preview, loading }) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const guideBoxRef = useRef(null);
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
    const guideBox = guideBoxRef.current;
    if (!video || !canvas) return;

    const vW = video.videoWidth;
    const vH = video.videoHeight;
    const cW = video.clientWidth;
    const cH = video.clientHeight;

    if (guideBox && vW && vH && cW && cH) {
      // object-fit:cover scale: whichever axis fills the container
      const scale = Math.max(cW / vW, cH / vH);
      // how many video-pixels are hidden on each side due to cover cropping
      const hiddenX = (vW * scale - cW) / 2 / scale;
      const hiddenY = (vH * scale - cH) / 2 / scale;

      // guide box position in display-pixels relative to the video element
      const videoRect = video.getBoundingClientRect();
      const guideRect = guideBox.getBoundingClientRect();
      const gLeft = guideRect.left - videoRect.left;
      const gTop  = guideRect.top  - videoRect.top;
      const gW    = guideRect.width;
      const gH    = guideRect.height;

      // convert to actual video-pixel coordinates
      const sx = gLeft / scale + hiddenX;
      const sy = gTop  / scale + hiddenY;
      const sw = gW / scale;
      const sh = gH / scale;

      canvas.width  = Math.round(sw);
      canvas.height = Math.round(sh);
      canvas.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    } else {
      // fallback: full frame
      canvas.width  = vW;
      canvas.height = vH;
      canvas.getContext('2d').drawImage(video, 0, 0);
    }

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
                <div className="guide-box" ref={guideBoxRef}></div>
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
