import { useState, useRef, useEffect } from "react";
import {
  X, Camera, Video, MapPin, Upload, Loader2, CheckCircle2,
  RefreshCw, StopCircle, Image, Film, Tag, FileText, AlignLeft
} from "lucide-react";
import api from "../api";
import { useLocation } from "../context/LocationContext";
import MapComponent from "./MapComponent";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"];

// ─── Design Tokens ────────────────────────────────────────────────────────────
const G = {
  bg: "#080e0b",
  surface: "#0d1a12",
  card: "#111a14",
  border: "rgba(74,222,128,0.15)",
  borderHi: "rgba(74,222,128,0.45)",
  primary: "#4ade80",
  primaryD: "#22c55e",
  muted: "#374151",
  mutedTxt: "#6b7280",
  text: "#e5e7eb",
  textDim: "#9ca3af",
  danger: "#f87171",
};

const CATEGORIES = [
  { value: "garbage", label: "Garbage", emoji: "🗑" },
  { value: "waterlogging", label: "Waterlogging", emoji: "💧" },
  { value: "deforestation", label: "Deforestation", emoji: "🌳" },
  { value: "air_pollution", label: "Air Pollution", emoji: "💨" },
  { value: "sewage", label: "Sewage", emoji: "⚠️" },
  { value: "other", label: "Other", emoji: "📍" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      {Icon && <Icon size={12} color={G.mutedTxt} />}
      <span style={{
        fontSize: 11, fontWeight: 800, letterSpacing: "0.28em",
        textTransform: "uppercase", color: G.mutedTxt, fontFamily: "'DM Mono', monospace"
      }}>{children}</span>
    </div>
  );
}

function Input({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${focused ? G.borderHi : G.border}`,
        borderRadius: 7, padding: "10px 14px",
        fontSize: 14, color: G.text, outline: "none", width: "100%",
        fontFamily: "'DM Mono', monospace", boxSizing: "border-box",
        boxShadow: focused ? `0 0 0 3px rgba(74,222,128,0.07)` : "none",
        transition: "all 0.15s",
        ...style
      }}
      {...props}
    />
  );
}

function Textarea({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${focused ? G.borderHi : G.border}`,
        borderRadius: 7, padding: "10px 14px",
        fontSize: 14, color: G.text, outline: "none", width: "100%",
        fontFamily: "'DM Mono', monospace", boxSizing: "border-box",
        resize: "none", lineHeight: 1.7,
        boxShadow: focused ? `0 0 0 3px rgba(74,222,128,0.07)` : "none",
        transition: "all 0.15s",
        ...style
      }}
      {...props}
    />
  );
}

// ─── IssueFormFields ──────────────────────────────────────────────────────────
function IssueFormFields({ formData, setFormData }) {
  const set = k => e => setFormData(p => ({ ...p, [k]: e.target.value }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <SectionLabel icon={FileText}>Anomaly Title</SectionLabel>
        <Input
          required placeholder="Sector Observation Label"
          value={formData.title} onChange={set("title")}
        />
      </div>

      <div>
        <SectionLabel icon={AlignLeft}>Description</SectionLabel>
        <Textarea
          required rows={5}
          placeholder="Detailed impact analysis of the anomaly observed..."
          value={formData.description} onChange={set("description")}
        />
      </div>

      <div>
        <SectionLabel icon={Tag}>Category</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
          {CATEGORIES.map(({ value, label, emoji }) => {
            const active = formData.category === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFormData(p => ({ ...p, category: value }))}
                style={{
                  padding: "7px 4px",
                  border: `1px solid ${active ? G.primary : G.border}`,
                  borderRadius: 7,
                  background: active ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.03)",
                  color: active ? G.primary : G.textDim,
                  fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.1em", cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  transition: "all 0.15s", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 3,
                  boxShadow: active ? `0 0 12px rgba(74,222,128,0.1)` : "none",
                }}
              >
                <span style={{ fontSize: 18 }}>{emoji}</span>
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── LocationSection ──────────────────────────────────────────────────────────
function LocationSection({ formData, setFormData, isManual, setIsManual, locating, onLocate, isLoaded, autocompleteRef, onPlaceChanged, onMapClick }) {
  const hasCoords = !!(formData.lat && formData.lng);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionLabel icon={MapPin}>Geolocation Data</SectionLabel>
        <button
          type="button"
          onClick={() => setIsManual(!isManual)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 10, fontWeight: 800, color: G.primary,
            letterSpacing: "0.06em", textTransform: "uppercase",
            fontFamily: "'DM Mono', monospace", padding: 0,
          }}
        >
          {isManual ? "⟳ Auto Detect" : "✎ Manual Entry"}
        </button>
      </div>

      {isManual ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {isLoaded ? (
            <Autocomplete 
              onLoad={ref => autocompleteRef.current = ref}
              onPlaceChanged={onPlaceChanged}
            >
              <Input placeholder="Search address or landmark..." />
            </Autocomplete>
          ) : (
            <Input placeholder="Search address or landmark..." />
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <Input
              type="number" step="any" placeholder="Latitude"
              value={formData.lat}
              onChange={e => setFormData(p => ({ ...p, lat: parseFloat(e.target.value) }))}
            />
            <Input
              type="number" step="any" placeholder="Longitude"
              value={formData.lng}
              onChange={e => setFormData(p => ({ ...p, lng: parseFloat(e.target.value) }))}
            />
          </div>
          <div style={{ height: 120, borderRadius: 8, overflow: 'hidden', border: `1px solid ${G.border}` }}>
            <MapComponent 
              center={{ lat: parseFloat(formData.lat) || 0, lng: parseFloat(formData.lng) || 0 }} 
              onMapClick={onMapClick}
            />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${hasCoords ? G.borderHi : G.border}`,
            borderRadius: 7, padding: "9px 12px",
          }}>
            <span style={{
              fontSize: 11, fontFamily: "'DM Mono', monospace",
              color: hasCoords ? G.primary : G.muted,
              fontStyle: hasCoords ? "normal" : "italic",
              fontWeight: hasCoords ? 600 : 400,
            }}>
              {hasCoords
                ? `${parseFloat(formData.lat).toFixed(5)}, ${parseFloat(formData.lng).toFixed(5)}`
                : "Scanning for satellites…"}
            </span>
            <button
              type="button" onClick={onLocate} disabled={locating}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: locating ? G.primary : G.mutedTxt, padding: 2, display: "flex",
              }}
            >
              {locating
                ? <RefreshCw size={13} style={{ animation: "spin 0.8s linear infinite" }} />
                : <MapPin size={13} />}
            </button>
          </div>
          {hasCoords && (
            <div style={{ height: 120, borderRadius: 8, overflow: 'hidden', border: `1px solid ${G.border}` }}>
              <MapComponent center={{ lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MockMap() {
  return (
    <div style={{
      height: 120, borderRadius: 8, overflow: "hidden",
      border: `1px solid ${G.border}`, position: "relative",
      background: "#0a1a0f",
    }}>
      {/* Grid lines */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {[0, 25, 50, 75, 100].map(p => (
          <line key={`h${p}`} x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`}
            stroke="rgba(74,222,128,0.08)" strokeWidth="1" />
        ))}
        {[0, 20, 40, 60, 80, 100].map(p => (
          <line key={`v${p}`} x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%"
            stroke="rgba(74,222,128,0.08)" strokeWidth="1" />
        ))}
        {/* Roads */}
        <path d="M0,60 Q120,45 240,60 T480,55" stroke="rgba(74,222,128,0.18)" strokeWidth="2" fill="none" />
        <path d="M160,0 Q150,60 165,120" stroke="rgba(74,222,128,0.12)" strokeWidth="2" fill="none" />
        {/* Pin */}
        <circle cx="50%" cy="50%" r="6" fill={G.primary} opacity="0.9" />
        <circle cx="50%" cy="50%" r="10" fill="none" stroke={G.primary} strokeWidth="1" opacity="0.5">
          <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div style={{
        position: "absolute", bottom: 6, right: 8,
        fontSize: 8, fontWeight: 700, letterSpacing: "0.15em",
        color: "rgba(74,222,128,0.4)", fontFamily: "'DM Mono', monospace",
        textTransform: "uppercase",
      }}>
        SECTOR MAP
      </div>
    </div>
  );
}

// ─── MediaSection ─────────────────────────────────────────────────────────────
function MediaSection({ image, video, onSetImage, onSetVideo, onStartCamera }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <SectionLabel icon={Image}>Media Uplink</SectionLabel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { icon: Camera, label: "Live Photo", mode: "photo" },
          { icon: Video, label: "Live Video", mode: "video" },
        ].map(({ icon: Icon, label, mode }) => (
          <button
            key={mode} type="button"
            onClick={() => onStartCamera(mode)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 7, padding: "14px 8px",
              background: "rgba(74,222,128,0.04)",
              border: `1.5px dashed rgba(74,222,128,0.22)`,
              borderRadius: 8, cursor: "pointer", color: G.mutedTxt,
              fontSize: 9, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.14em", fontFamily: "'DM Mono', monospace",
              transition: "all 0.18s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = G.primary;
              e.currentTarget.style.color = G.primary;
              e.currentTarget.style.background = "rgba(74,222,128,0.08)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(74,222,128,0.22)";
              e.currentTarget.style.color = G.mutedTxt;
              e.currentTarget.style.background = "rgba(74,222,128,0.04)";
            }}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { icon: Image, label: "Upload Image", file: image, onChange: onSetImage },
          { icon: Film, label: "Upload Video", file: video, onChange: onSetVideo },
        ].map(({ icon: Icon, label, file, onChange }) => (
          <label key={label} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.03)",
            border: `1px dashed ${G.border}`,
            borderRadius: 6, padding: "7px 9px", cursor: "pointer",
            fontSize: 9, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: file ? G.primary : G.mutedTxt,
            fontFamily: "'DM Mono', monospace", overflow: "hidden",
            transition: "all 0.15s",
          }}>
            <Icon size={12} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {file ? file.name.substring(0, 14) + "…" : label}
            </span>
            <input type="file" style={{ display: "none" }}
              onChange={e => onChange(e.target.files[0])} />
          </label>
        ))}
      </div>

      {(image || video) && (
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          {image && (
            <div style={{
              width: 52, height: 40, borderRadius: 5, overflow: "hidden",
              border: `1px solid ${G.borderHi}`, background: G.muted, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <img src={URL.createObjectURL(image)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CameraView ───────────────────────────────────────────────────────────────
function CameraView({ mode, isRecording, onCapture, onStartRecording, onStopRecording, onClose, videoRef }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        position: "relative", borderRadius: 10, overflow: "hidden",
        background: "#000", border: `1px solid ${G.borderHi}`,
        aspectRatio: "16/9",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <video ref={videoRef} autoPlay playsInline style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }} />
        
        {/* Overlays */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          <div style={{
            position:"absolute", top:0, left:0, right:0,
            height:1, background: `linear-gradient(90deg, transparent, ${G.primary}, transparent)`,
            animation:"scanline 3s linear infinite",
          }} />
        </div>

        {isRecording && (
          <div style={{
            position: "absolute", top: 12, left: 12,
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(0,0,0,0.6)", border: "1px solid rgba(239,68,68,0.5)",
            color: G.danger, fontSize: 9, fontWeight: 800, letterSpacing: "0.2em",
            padding: "4px 10px", borderRadius: 4, fontFamily: "'DM Mono', monospace",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", background: G.danger,
              animation: "pulse 1s ease-in-out infinite",
            }} /> REC
          </div>
        )}
        <div style={{
          position: "absolute", bottom: 10, left: 12,
          background: "rgba(0,0,0,0.55)",
          fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
          color: "#d1fae5", padding: "3px 10px", borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.1)",
          fontFamily: "'DM Mono', monospace",
        }}>
          {mode === "photo" ? "📷 PHOTO MODE" : "🎬 VIDEO MODE"}
        </div>

        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
          {["TL", "TR"].map((_, i) => (
            <div key={i} style={{
              width: 10, height: 10,
              borderTop: `1px solid rgba(74,222,128,0.5)`,
              borderRight: i === 1 ? `1px solid rgba(74,222,128,0.5)` : "none",
              borderLeft: i === 0 ? `1px solid rgba(74,222,128,0.5)` : "none",
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
        {mode === "photo" ? (
          <ShutterBtn onClick={onCapture} variant="photo"><Camera size={20} /></ShutterBtn>
        ) : isRecording ? (
          <ShutterBtn onClick={onStopRecording} variant="stop"><StopCircle size={20} /></ShutterBtn>
        ) : (
          <ShutterBtn onClick={onStartRecording} variant="record"><Video size={20} /></ShutterBtn>
        )}
        <button
          type="button" onClick={onClose}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            border: `1px solid ${G.border}`,
            background: "rgba(255,255,255,0.05)",
            color: G.textDim, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        ><X size={16} /></button>
      </div>

      <p style={{
        textAlign: "center", fontSize: 9, fontWeight: 700,
        letterSpacing: "0.2em", textTransform: "uppercase",
        color: G.mutedTxt, fontFamily: "'DM Mono', monospace",
      }}>
        {mode === "photo" ? "Press shutter to capture" : isRecording ? "Recording… press stop" : "Press record to start"}
      </p>
    </div>
  );
}

function ShutterBtn({ children, onClick, variant }) {
  const colors = {
    photo: { bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.4)", color: G.primary },
    record: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.4)", color: G.danger },
    stop: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.6)", color: G.danger },
  };
  const c = colors[variant];
  return (
    <button type="button" onClick={onClick} style={{
      width: 54, height: 54, borderRadius: "50%",
      border: `2.5px solid ${c.border}`,
      background: c.bg, color: c.color, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 0 20px ${c.border}`,
      transition: "all 0.18s",
    }}>{children}</button>
  );
}

// ─── SuccessView ──────────────────────────────────────────────────────────────
function SuccessView() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "56px 16px", gap: 16, textAlign: "center",
    }}>
      <div style={{
        width: 76, height: 76, borderRadius: "50%",
        border: `2px solid ${G.primary}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 40px rgba(74,222,128,0.25), inset 0 0 20px rgba(74,222,128,0.05)`,
        animation: "glow-pulse 2s ease-in-out infinite",
      }}>
        <CheckCircle2 size={36} color={G.primary} />
      </div>
      <h3 style={{
        fontSize: "1.1rem", fontWeight: 800, textTransform: "uppercase",
        letterSpacing: "0.1em", color: "#f0fdf4", fontFamily: "'DM Mono', monospace", margin: 0,
      }}>Data Transmitted</h3>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
        textTransform: "uppercase", color: G.mutedTxt, margin: 0,
        fontFamily: "'DM Mono', monospace",
      }}>Planetary archive updated successfully.</p>
      <div style={{
        width: 160, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", background: G.primary, borderRadius: 2,
          animation: "progress-fill 2.2s linear forwards",
        }} />
      </div>
    </div>
  );
}

// ─── SubmitButton ─────────────────────────────────────────────────────────────
function SubmitButton({ loading }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="submit" disabled={loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative", overflow: "hidden",
        width: "100%", padding: "14px 24px",
        background: loading ? "rgba(74,222,128,0.5)" : hov ? G.primaryD : G.primary,
        border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        transform: hov && !loading ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hov && !loading ? "0 8px 30px rgba(74,222,128,0.3)" : "none",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontSize: 11, fontWeight: 800, letterSpacing: "0.2em",
        textTransform: "uppercase", color: "#052e16", position: "relative", zIndex: 1,
      }}>
        {loading
          ? <><Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> Syncing Data…</>
          : <><Upload size={15} /> Transmit Report to Sector Command</>
        }
      </div>
      {hov && !loading && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
          animation: "shimmer 0.5s ease forwards",
        }} />
      )}
    </button>
  );
}

// ─── Main Preview ─────────────────────────────────────────────────────────────
const CreateIssueModal = ({ isOpen, onClose, onSuccess }) => {
  const { location: liveLocation } = useLocation();
  const [view, setView] = useState("form"); // "form" | "camera" | "success"
  const [cameraMode, setCameraMode] = useState("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [formData, setFormData] = useState({
    title: "", description: "", category: "other", lat: "", lng: "", address: ""
  });
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const autocompleteRef = useRef(null);
  const isSubmittingRef = useRef(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries
  });

  useEffect(() => {
    if (isOpen) {
      setView("form");
      // Only auto-locate if we don't have text data yet to prevent overwriting during typing
      if (!formData.title && !formData.description) {
        if (liveLocation?.lat) {
          setFormData(prev => ({ ...prev, lat: liveLocation.lat, lng: liveLocation.lng }));
        } else {
          handleLocate();
        }
      }
    }
  }, [isOpen]); // Only run once when modal opens, or when specifically requested

  const handleStartCamera = async (mode) => {
    setCameraMode(mode);
    setView("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: mode === "video"
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied");
      setView("form");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setView("form");
    setIsRecording(false);
  };

  const capturePhoto = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
      setImage(file);
      stopCamera();
    }, "image/jpeg");
  };

  const startRecording = () => {
    chunksRef.current = [];
    const stream = videoRef.current.srcObject;
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/mp4" });
      const file = new File([blob], `video_${Date.now()}.mp4`, { type: "video/mp4" });
      setVideo(file);
    };
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    stopCamera();
  };

  const reverseGeocode = (lat, lng) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        setFormData(p => ({ ...p, address: results[0].formatted_address }));
      }
    });
  };

  const handleLocate = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFormData(p => ({ ...p, lat, lng }));
        reverseGeocode(lat, lng);
        setLocating(false);
      },
      () => { setLocating(false); setIsManual(true); }
    );
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        setFormData(p => ({
          ...p,
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      const data = new FormData();
      // Ensure we use the latest state values
      Object.keys(formData).forEach(k => {
        if (formData[k] !== undefined && formData[k] !== null) {
          data.append(k, formData[k]);
        }
      });
      
      if (image) data.append("image", image);
      if (video) data.append("video", video);

      const res = await api.post("/issues", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        setView("success");
        setTimeout(() => {
          if (onSuccess) onSuccess(res.data.pointsGained);
          if (onClose) onClose();
          isSubmittingRef.current = false;
        }, 2200);
      } else {
        isSubmittingRef.current = false;
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert(err.response?.data?.message || "Transmission failed. Please check your connection.");
      isSubmittingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060c08; }

        @keyframes spin       { to { transform: rotate(360deg) } }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes shimmer    { from{transform:translateX(-100%)} to{transform:translateX(100%)} }
        @keyframes glow-pulse {
          0%,100%{box-shadow:0 0 30px rgba(74,222,128,0.2)}
          50%    {box-shadow:0 0 50px rgba(74,222,128,0.45)}
        }
        @keyframes progress-fill { from{width:0%} to{width:100%} }
        @keyframes scanline {
          0%   { top:0%;    opacity:0.8 }
          100% { top:100%;  opacity:0 }
        }
        @keyframes modal-in {
          from { opacity:0; transform:translateY(16px) scale(0.98) }
          to   { opacity:1; transform:translateY(0)    scale(1)    }
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
        ::-webkit-scrollbar { width:4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(74,222,128,0.2); border-radius:2px }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 1000,
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)",
        padding: 16, fontFamily: "'DM Mono', monospace",
      }} onClick={onClose}>

        {/* Panel */}
        <div 
          onClick={e => e.stopPropagation()}
          style={{
            background: G.surface,
            border: `1px solid ${G.border}`,
            borderRadius: 14, width: "100%", maxWidth: 700,
            boxShadow: `0 0 80px rgba(74,222,128,0.06), 0 32px 80px rgba(0,0,0,0.6)`,
            animation: "modal-in 0.3s cubic-bezier(0.16,1,0.3,1)",
            overflow: "hidden",
          }}
        >

          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${G.border}`,
            background: G.surface,
          }}>
            <div>
              <p style={{
                fontSize: 11, fontWeight: 800, letterSpacing: "0.32em",
                color: G.primary, textTransform: "uppercase", marginBottom: 4,
              }}>Sector Report Form</p>
              <h2 style={{
                fontSize: "1.25rem", fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.06em", color: "#f0fdf4",
              }}>Environmental Anomaly Detection</h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button 
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${G.border}`,
                  borderRadius: 6, padding: 6, cursor: "pointer", color: G.textDim,
                  display: "flex", alignItems: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 24px 24px" }}>
            {view === "success" ? (
              <SuccessView />
            ) : view === "camera" ? (
              <CameraView
                mode={cameraMode}
                isRecording={isRecording}
                onCapture={capturePhoto}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onClose={stopCamera}
                videoRef={videoRef}
              />
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 24, marginBottom: 20,
                }}>
                  <IssueFormFields formData={formData} setFormData={setFormData} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <LocationSection
                      formData={formData} setFormData={setFormData}
                      isManual={isManual} setIsManual={setIsManual}
                      locating={locating} onLocate={handleLocate}
                      isLoaded={isLoaded} autocompleteRef={autocompleteRef}
                      onPlaceChanged={onPlaceChanged}
                      onMapClick={(lat, lng) => {
                        setFormData(p => ({ ...p, lat, lng }));
                        reverseGeocode(lat, lng);
                      }}
                    />
                    <MediaSection
                      image={image} video={video}
                      onSetImage={setImage} onSetVideo={setVideo}
                      onStartCamera={handleStartCamera}
                    />
                  </div>
                </div>

                <SubmitButton loading={loading} />
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
export default CreateIssueModal;
