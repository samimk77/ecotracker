import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Leaf, AlertCircle, RotateCcw, Check, Sparkles, ScanLine } from 'lucide-react';
import api from '../api';
import { useLocation } from '../context/LocationContext';

function ModalHeader({ onClose, title = "AI Smart Sort", icon: Icon = Leaf }) {
  return (
    <div style={{
      padding: '18px 20px',
      borderBottom: '1px solid rgba(52,211,153,0.12)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(5,150,105,0.04) 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* subtle top line accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #34d399, #3b82f6, transparent)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, #34d399, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(52,211,153,0.4)',
        }}>
          <Icon style={{ width: 20, height: 20, color: '#030b08' }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#f0fdf4', letterSpacing: '-0.02em' }}>{title}</h2>
        </div>
      </div>
      <button onClick={onClose} style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: '#6ee7b7', transition: 'all 0.2s',
      }}>
        <X size={16} />
      </button>
    </div>
  );
}

function InitialScreen({ onStartCamera, onUploadClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
      {/* Hero section */}
      <div style={{
        textAlign: 'center', padding: '20px 16px 16px',
        background: 'radial-gradient(ellipse at center, rgba(52,211,153,0.06) 0%, transparent 70%)',
        borderRadius: 16, border: '1px solid rgba(52,211,153,0.08)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(5,150,105,0.1))',
          border: '1.5px solid rgba(52,211,153,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px', boxShadow: '0 0 24px rgba(52,211,153,0.15)',
        }}>
          <ScanLine size={26} color="#34d399" />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#6ee7b7', fontWeight: 600, lineHeight: 1.5 }}>
          Point your camera at any waste item.
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
          AI will classify it and tell you exactly how to dispose of it.
        </p>
      </div>

      {/* Camera button */}
      <button onClick={onStartCamera} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        width: '100%', padding: '15px 20px',
        background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(5,150,105,0.08))',
        border: '1.5px solid rgba(52,211,153,0.35)',
        borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: '0 0 20px rgba(52,211,153,0.08)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #34d399, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(52,211,153,0.4)',
        }}>
          <Camera size={18} color="#030b08" strokeWidth={2.5} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', letterSpacing: '-0.01em' }}>Open Camera</div>
          <div style={{ fontSize: 10, color: 'rgba(110,231,183,0.55)', fontWeight: 500 }}>Auto-scans in 3 seconds</div>
        </div>
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* Upload button */}
      <button onClick={onUploadClick} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        width: '100%', padding: '13px 20px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
      }}>
        <Upload size={18} color="rgba(255,255,255,0.5)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Upload from Gallery</span>
      </button>
    </div>
  );
}

/**
 * Camera View - Live video feed with countdown
 */
function CameraView({ videoRef, countdown, onCancel, onCapture }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(52,211,153,0.5)', boxShadow: '0 0 30px rgba(52,211,153,0.2)' }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
        {/* Corner brackets */}
        {[['top:8px', 'left:8px', 'borderTop', 'borderLeft'], ['top:8px', 'right:8px', 'borderTop', 'borderRight'], ['bottom:8px', 'left:8px', 'borderBottom', 'borderLeft'], ['bottom:8px', 'right:8px', 'borderBottom', 'borderRight']].map(([t, l, b1, b2], i) => (
          <div key={i} style={{ position: 'absolute', [t.split(':')[0]]: t.split(':')[1], [l.split(':')[0]]: l.split(':')[1], width: 20, height: 20, [b1]: '2.5px solid #34d399', [b2]: '2.5px solid #34d399', borderRadius: 2 }} />
        ))}
        {/* Scan line */}
        <div style={{ position: 'absolute', left: 8, right: 8, height: 2, background: 'linear-gradient(90deg,transparent,#34d399,transparent)', animation: 'bounce 2s infinite', top: '50%', opacity: 0.7 }} />
        {countdown !== null && countdown > 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <span style={{ fontSize: 80, fontWeight: 900, color: '#34d399', textShadow: '0 0 40px #34d399', lineHeight: 1 }}>{countdown}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.15em', marginTop: 8, textTransform: 'uppercase' }}>Auto-Scanning</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        <button onClick={onCapture} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#34d399,#059669)', border: 'none', color: '#030b08', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 0 20px rgba(52,211,153,0.35)' }}>Capture Now</button>
      </div>
    </div>
  );
}

/**
 * Image Preview with Loading/Error States
 */
function ImagePreview({ imageDataUrl, loading, error, onRetake, onRetry }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <img src={imageDataUrl} alt="Preview" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 14, border: '1px solid rgba(52,211,153,0.25)', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 14, boxShadow: 'inset 0 0 24px rgba(0,0,0,0.6)', pointerEvents: 'none' }} />
        {loading && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: 'linear-gradient(90deg,transparent,#34d399,transparent)', animation: 'bounce 1.5s infinite', opacity: 0.8 }} />
          </div>
        )}
      </div>
      {loading && (
        <div style={{ width: '100%', padding: '18px 20px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#34d399,#3b82f6,transparent)', animation: 'pulse 2s infinite' }} />
          <div style={{ position: 'relative', width: 48, height: 48 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#34d399', animation: 'spin 1s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '2px solid transparent', borderBottomColor: '#3b82f6', animation: 'spin 0.7s linear infinite reverse' }} />
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI Analyzing...</p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(110,231,183,0.6)', textAlign: 'center' }}>Checking material composition &amp; recyclability</p>
        </div>
      )}
      {!loading && error && (
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button onClick={onRetake} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Retake</button>
          <button onClick={onRetry} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 0 16px rgba(239,68,68,0.3)' }}>Retry Analysis</button>
        </div>
      )}
    </div>
  );
}

/**
 * Result Card - Shows classification results
 */
function ResultCard({ result, imageDataUrl, onReScan, onClose, nearestBin }) {
  const c = result.isRecyclable;
  const accent = c ? '#34d399' : '#f87171';
  const accentBg = c ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)';
  const accentBorder = c ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {/* Image + verdict banner */}
      <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
        <img src={imageDataUrl} alt="Analyzed" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,24,18,0.95) 0%, rgba(10,24,18,0.3) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 99, background: accentBg, border: `1px solid ${accentBorder}`, backdropFilter: 'blur(12px)', boxShadow: `0 0 24px ${accent}33` }}>
            {c ? <Leaf size={16} color={accent} /> : <AlertCircle size={16} color={accent} />}
            <span style={{ fontSize: 14, fontWeight: 800, color: accent, letterSpacing: '-0.01em' }}>{result.category}</span>
          </div>
        </div>
      </div>

      {/* Recommended Bin Guidance */}
      {nearestBin && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
          animation: 'pulse 2s infinite'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'rgba(59, 130, 246, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Sparkles size={18} color="#60a5fa" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nearest Smart Bin</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Bin {nearestBin.binId} is {nearestBin.dist.toFixed(2)}m away</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{nearestBin.fillLevel}% Full • Recommended for {result.category} disposal</div>
          </div>
        </div>
      )}

      {/* Info card */}
      <div style={{ background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: 16, padding: '14px 18px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: accent, opacity: 0.07, filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: c ? 'linear-gradient(135deg,#34d399,#059669)' : 'linear-gradient(135deg,#f87171,#b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 16px ${accent}44` }}>
            {c ? <Leaf size={20} color="#030b08" /> : <AlertCircle size={20} color="#fff" />}
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              {c ? '✅ Prime Recyclable' : '⚠️ General Waste'}
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{result.feedback}</p>
          </div>
        </div>
        {/* Confidence bar */}
        {result.confidence != null && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Confidence</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: accent }}>{Math.round(result.confidence * 100)}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round(result.confidence * 100)}%`, height: '100%', background: `linear-gradient(90deg, ${accent}, ${c ? '#059669' : '#b91c1c'})`, borderRadius: 99, transition: 'width 1s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={onReScan} style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${accentBorder}`, color: accent, fontWeight: 700, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <RotateCcw size={15} />Re-Scan Item
        </button>
        <button onClick={onClose} style={{ width: '100%', padding: '13px', borderRadius: 12, background: `linear-gradient(135deg, ${c ? '#34d399' : '#f87171'}, ${c ? '#059669' : '#b91c1c'})`, border: 'none', color: c ? '#030b08' : '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `0 0 20px ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Check size={15} />Confirm Disposal & Finish
        </button>
      </div>
    </div>
  );
}

/**
 * Error Alert - Generic error message display
 */
function ErrorAlert({ message }) {
  return (
    <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#fca5a5', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
      <AlertCircle size={14} style={{ flexShrink: 0 }} />
      {message}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SmartSortModal({ isOpen, onClose, onClassificationSuccess }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [nearestBin, setNearestBin] = useState(null);

  // Helper: calculate distance between two lat/lng points in meters
  const getDist = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  /**
   * Handle file selection from input
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Process and resize image file
   */
  const processFile = (file) => {
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 512;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

          setImage({ dataUrl, type: 'image/jpeg' });
          setResult(null);
        } catch (e) {
          console.error('Canvas scaling error', e);
          setError('Failed to process image.');
        }
      };
      img.onerror = () => {
        setError('Invalid image file. Please try another photo.');
      };
      img.src = reader.result;
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  /**
   * Camera setup effect
   */
  useEffect(() => {
    let isMounted = true;

    if (isCameraActive && !image) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (!isMounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCountdown(3);
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error('Camera error:', err);
          setError('Failed to access camera. Please allow permissions.');
          setIsCameraActive(false);
        });
    }

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCountdown(null);
    };
  }, [isCameraActive, image]);

  /**
   * Auto-capture countdown effect
   */
  useEffect(() => {
    let timer;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      takePhoto();
      setCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  /**
   * Auto-analyze when image is set
   */
  useEffect(() => {
    if (image && !result && !error && !loading) {
      classifyImage();
    }
  }, [image]);

  /**
   * Start camera capture
   */
  const startCamera = () => {
    setError('');
    setIsCameraActive(true);
  };

  /**
   * Stop camera and clean up
   */
  const stopCamera = () => {
    setIsCameraActive(false);
    setCountdown(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  /**
   * Capture photo from video stream
   */
  const takePhoto = () => {
    if (videoRef.current) {
      // Play retail scanner beep sound
      try {
        const scanner = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        scanner.volume = 1.0;
        scanner.play();
      } catch (e) { console.warn(e); }

      const canvas = document.createElement('canvas');
      const maxDim = 512;
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

      setImage({ dataUrl, type: 'image/jpeg' });
      stopCamera();
    }
  };

  const { location: userLoc } = useLocation();

  const classifyImage = async () => {
    if (!image) return;
    setLoading(true);
    setError('');
    try {
      const base64Data = image.dataUrl.split(',')[1];
      const res = await api.post('/ai/classify', {
        imageBase64: base64Data,
        mediaType: image.type,
      });

      // --- FIND NEAREST BIN ---
      let binsToScore = [];
      try {
        const binRes = await api.get('/iot/bins');
        if (binRes.data.success && binRes.data.bins.length > 0) {
          binsToScore = binRes.data.bins;
        }
      } catch (e) { console.warn("Failed to fetch bins for guidance", e); }

      const calculateAndSet = (uLat, uLng) => {
        if (binsToScore.length > 0) {
          const scoredBins = binsToScore.map(b => ({
            ...b,
            dist: getDist(uLat, uLng, b.location.coordinates[1], b.location.coordinates[0])
          })).sort((a, b) => a.dist - b.dist);
          setNearestBin(scoredBins[0]);
        }
      };

      // Priority: 1. Live GPS, 2. Context Location, 3. Bangalore Center
      const fallbackLat = userLoc?.lat || 12.9716;
      const fallbackLng = userLoc?.lng || 77.5946;
      calculateAndSet(fallbackLat, fallbackLng);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => calculateAndSet(pos.coords.latitude, pos.coords.longitude),
          (err) => console.warn("Geo error", err),
          { timeout: 5000 }
        );
      }

      setResult(res.data.data);

      // Play success sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.volume = 1.0; // Max volume
        audio.play();
      } catch (e) { console.warn("Audio play failed", e); }

      if (onClassificationSuccess) onClassificationSuccess(res.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to classify image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Confirm Disposal
   */
  const handleConfirmDisposal = async () => {
    // Play disposal confirmation sound (Mechanical/Digital Success)
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
      audio.volume = 1.0;
      audio.play();
    } catch (e) { console.warn(e); }

    if (nearestBin) {
      try {
        // Increment bin fill level on server
        await api.post(`/iot/dispose/${nearestBin.binId}`, { amount: 5 });
        // Emit event for map interaction
        window.dispatchEvent(new CustomEvent('bin:guide', {
          detail: { binId: nearestBin.binId, lat: nearestBin.location.coordinates[1], lng: nearestBin.location.coordinates[0] }
        }));
      } catch (e) { console.error("Disposal update failed", e); }
    }
    closeModal();
  };

  /**
   * Reset all state
   */
  const reset = () => {
    setImage(null);
    setResult(null);
    setError('');
    setCountdown(null);
    stopCamera();
  };

  /**
   * Close modal and reset
   */
  const closeModal = () => {
    reset();
    onClose();
  };

  /**
   * Handle re-scan action
   */
  const handleReScan = () => {
    reset();
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', padding: 16 }}>
      <div style={{ background: 'linear-gradient(145deg, #0b1e15, #081210)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 20, width: '100%', maxWidth: 440, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(52,211,153,0.05)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        <ModalHeader onClose={closeModal} />
        <div style={{ padding: '20px 20px', flex: 1, overflowY: 'auto' }}>
          {error && <ErrorAlert message={error} />}
          {!image && !isCameraActive && <InitialScreen onStartCamera={startCamera} onUploadClick={() => fileInputRef.current?.click()} />}
          {isCameraActive && !image && <CameraView videoRef={videoRef} countdown={countdown} onCancel={stopCamera} onCapture={takePhoto} />}
          {image && !result && <ImagePreview imageDataUrl={image.dataUrl} loading={loading} error={error} onRetake={reset} onRetry={classifyImage} />}
          {result && <ResultCard result={result} imageDataUrl={image.dataUrl} onReScan={handleReScan} onClose={handleConfirmDisposal} nearestBin={nearestBin} />}
        </div>
        <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
      </div>
    </div>
  );
}
