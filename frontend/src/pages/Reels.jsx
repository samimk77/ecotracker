import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Eye, Upload, X, Volume2, VolumeX, Leaf, MapPin, Trash2, Play, ChevronUp, ChevronDown, IndianRupee } from 'lucide-react';
import api from '../api';
import PointsModal from '../components/PointsModal';

const T = {
  bg: 'var(--color-bg)',
  accent: 'var(--color-primary)',
  border: 'var(--color-border)',
  muted: 'var(--color-text-dim)',
  card: 'var(--color-card)',
  surface: 'var(--color-surface)',
  text: 'var(--color-text)',
};

const CAT_LABELS = {
  cleanup: '🧹 Cleanup', tree_plantation: '🌱 Plantation',
  awareness: '💨 Awareness', water_conservation: '💧 Water',
  wildlife: '🦋 Wildlife', recycling: '♻️ Recycling', other: '🌍 Other',
};

/* ══════════════════════════════════════
   REEL ITEM — renders a single video
══════════════════════════════════════ */
function ReelItem({ reel, index, onLike, onDelete, onFund, currentUser, isActive }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  // Play / pause based on isActive prop
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
      api.post(`/reels/${reel._id}/view`).catch(() => {});
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  }, [isActive, reel._id]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const isOwner = currentUser && reel.user?._id === currentUser._id;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#111', borderRadius: 16, overflow: 'hidden' }}>
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        loop muted={muted} playsInline
        onClick={togglePlay}
        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }}
      />

      {/* Play overlay */}
      {!playing && (
        <div onClick={togglePlay} style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)', cursor: 'pointer',
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={28} color="#fff" fill="#fff" style={{ marginLeft: 5 }} />
          </div>
        </div>
      )}

      {/* Top-right controls */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8 }}>
        <button onClick={() => setMuted(m => !m)} style={{
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
          border: `1px solid ${T.border}`, borderRadius: '50%',
          width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          {muted ? <VolumeX size={16} color="#fff" /> : <Volume2 size={16} color="#fff" />}
        </button>
        {isOwner && (
          <button onClick={() => onDelete(reel._id)} style={{
            background: 'rgba(180,20,20,0.6)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,80,80,0.3)', borderRadius: '50%',
            width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Trash2 size={15} color="#fff" />
          </button>
        )}
      </div>

      {/* Bottom gradient info */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '80px 16px 20px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.88))',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#000',
          }}>
            {reel.user?.avatar
              ? <img src={reel.user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : reel.user?.name?.charAt(0) || 'U'}
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
            {reel.user?.name || 'EcoContributor'}
          </span>
        </div>
        {reel.caption && (
          <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.55 }}>
            {reel.caption}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
            background: 'rgba(0,229,160,0.15)', color: T.accent, border: '1px solid rgba(0,229,160,0.3)',
          }}>
            {CAT_LABELS[reel.category] || '🌍 Other'}
          </span>
          {reel.wardName && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={10} /> {reel.wardName}
            </span>
          )}
        </div>
      </div>

      {/* Right action strip */}
      <div style={{
        position: 'absolute', right: 10, bottom: 80,
        display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center',
      }}>
        <button onClick={() => onLike(reel._id)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
            border: `1px solid ${reel.hasLiked ? 'rgba(255,77,77,0.5)' : T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Heart size={20} color={reel.hasLiked ? '#ff4d4d' : '#fff'} fill={reel.hasLiked ? '#ff4d4d' : 'none'} />
          </div>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{reel.likeCount}</span>
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
            border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Eye size={18} color="rgba(255,255,255,0.7)" />
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{reel.viewCount}</span>
        </div>
        
        {/* Crowdfund Option (First Reel Only) */}
        {index === 0 && (
          <button onClick={() => onFund(reel)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            marginTop: 4,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e5a0, #009966)',
              boxShadow: '0 4px 16px rgba(0,229,160,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IndianRupee size={20} color="#000" />
            </div>
            <span style={{ fontSize: 11, color: '#00e5a0', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>FUND</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   UPLOAD MODAL
══════════════════════════════════════ */
function UploadModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ caption: '', category: 'cleanup', wardName: '' });
  const [uploading, setUploading] = useState(false);

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('video', file);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const res = await api.post('/reels', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) onUploaded(res.data.reel, res.data.pointsGained);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const inp = {
    background: T.surface, border: `1px solid ${T.border}`, color: T.text,
    borderRadius: 8, padding: '10px 12px', fontSize: 13, width: '100%',
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  };
  const lbl = {
    fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
    textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 6,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }} />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 480, background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Leaf size={18} color={T.accent} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Upload Reel</div>
              <div style={{ fontSize: 10, color: T.muted }}>Share your eco-contribution · +15 XP</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 440, overflowY: 'auto' }}>
          <div>
            <label style={lbl}>Video (MP4 / MOV / WebM · max 100MB)</label>
            {!preview ? (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 140, border: `2px dashed ${T.border}`, borderRadius: 12, cursor: 'pointer', gap: 8, color: T.muted,
              }}>
                <Upload size={26} />
                <span style={{ fontSize: 12 }}>Click to select video</span>
                <input type="file" accept="video/*" onChange={handleFile} style={{ display: 'none' }} />
              </label>
            ) : (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxHeight: 200 }}>
                <video src={preview} muted style={{ width: '100%', objectFit: 'cover' }} />
                <button onClick={() => { setFile(null); setPreview(null); }} style={{
                  position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)',
                  border: 'none', borderRadius: '50%', width: 28, height: 28,
                  cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><X size={13} /></button>
              </div>
            )}
          </div>
          <div>
            <label style={lbl}>Caption</label>
            <textarea value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              placeholder="Describe your eco contribution..." maxLength={300}
              style={{ ...inp, minHeight: 72, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ ...inp, appearance: 'none' }}>
                {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Ward / Area</label>
              <input value={form.wardName} onChange={e => setForm(f => ({ ...f, wardName: e.target.value }))}
                placeholder="e.g. Koramangala" style={inp} />
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 9, background: 'transparent', border: `1px solid var(--color-border)`, color: T.muted, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!file || uploading} style={{
            flex: 2, padding: 11, borderRadius: 9, border: 'none',
            background: file && !uploading ? T.accent : 'var(--color-border)',
            color: file && !uploading ? '#000' : T.muted,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: file && !uploading ? 'pointer' : 'default',
          }}>
            {uploading ? 'Uploading…' : '🎬 Post Reel'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   FUND MODAL
══════════════════════════════════════ */
function FundModal({ reel, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleFund = () => {
    if (!amount || isNaN(amount) || amount <= 0) return alert('Enter a valid amount');
    setProcessing(true);
    // Simulate API call for funding
    setTimeout(() => {
      setProcessing(false);
      onSuccess(amount);
    }, 1500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }} />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 400, background: T.card, border: `1px solid ${T.accent}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 0 40px rgba(0,229,160,0.15)' }}>
        <div style={{ padding: '24px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,229,160,0.15)', border: `1px solid rgba(0,229,160,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <IndianRupee size={28} color={T.accent} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Fund this Initiative</h2>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Support <strong>{reel.user?.name || 'EcoContributor'}</strong>'s work.</p>
        </div>
        <div style={{ padding: 24 }}>
          <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 8 }}>Contribution Amount</label>
          <div style={{ display: 'flex', alignItems: 'center', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '4px 12px' }}>
            <span style={{ color: T.accent, fontWeight: 800, fontSize: 18, marginRight: 8 }}>₹</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 24, fontWeight: 700, width: '100%', outline: 'none' }} autoFocus />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
            {[100, 500, 1000].map(val => (
              <button key={val} onClick={() => setAmount(val)} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${amount == val ? T.accent : T.border}`, color: amount == val ? T.accent : '#fff', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
                ₹{val}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '16px 24px', display: 'flex', gap: 12, background: 'var(--color-surface)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 9, background: 'transparent', border: `1px solid var(--color-border)`, color: T.muted, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleFund} disabled={processing || !amount} style={{ flex: 2, padding: 12, borderRadius: 9, background: T.accent, border: 'none', color: '#000', fontSize: 11, fontWeight: 800, cursor: (processing || !amount) ? 'default' : 'pointer', opacity: (processing || !amount) ? 0.5 : 1 }}>
            {processing ? 'Processing...' : 'Confirm Funding'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   NAV ARROW BUTTON
══════════════════════════════════════ */
function NavBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 48, height: 48, borderRadius: '50%', border: 'none',
      background: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(8px)',
      color: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
      cursor: disabled ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s',
      outline: 'none',
      boxShadow: disabled ? 'none' : 'var(--shadow-main)',
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(0,229,160,0.25)'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════
   ROOT PAGE
══════════════════════════════════════ */
const CATS = [
  { id: 'all', label: '🌍 All' }, { id: 'cleanup', label: '🧹 Cleanup' },
  { id: 'tree_plantation', label: '🌱 Plantation' }, { id: 'awareness', label: '💨 Awareness' },
  { id: 'water_conservation', label: '💧 Water' }, { id: 'wildlife', label: '🦋 Wildlife' },
  { id: 'recycling', label: '♻️ Recycling' },
];

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [points, setPoints] = useState(null);
  const [activeCat, setActiveCat] = useState('all');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fundReel, setFundReel] = useState(null);

  useEffect(() => {
    api.get('/auth/me').then(r => { if (r.data.success) setCurrentUser(r.data.user); }).catch(() => {});
    fetchReels('all');
  }, []);

  const fetchReels = async (cat) => {
    setLoading(true);
    setCurrentIdx(0);
    try {
      const url = `/reels?limit=50${cat !== 'all' ? `&category=${cat}` : ''}`;
      const res = await api.get(url);
      if (res.data.success) setReels(res.data.reels);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCat = cat => { setActiveCat(cat); fetchReels(cat); };
  const goNext = () => setCurrentIdx(i => Math.min(i + 1, reels.length - 1));
  const goPrev = () => setCurrentIdx(i => Math.max(i - 1, 0));

  // keyboard & mouse wheel navigation
  const isScrolling = useRef(false);

  const handleWheel = (e) => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    
    if (e.deltaY > 0) {
      goNext();
    } else if (e.deltaY < 0) {
      goPrev();
    }

    // prevent rapid double-scrolling
    setTimeout(() => {
      isScrolling.current = false;
    }, 600);
  };

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowUp') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reels.length]);

  const handleLike = async id => {
    try {
      const res = await api.post(`/reels/${id}/like`);
      setReels(prev => prev.map(r => r._id === id ? { ...r, hasLiked: res.data.liked, likeCount: res.data.likeCount } : r));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this reel?')) return;
    try {
      await api.delete(`/reels/${id}`);
      setReels(prev => {
        const next = prev.filter(r => r._id !== id);
        setCurrentIdx(i => Math.min(i, next.length - 1));
        return next;
      });
    } catch { alert('Delete failed'); }
  };

  const handleUploaded = (reel, pts) => {
    setReels(prev => [{ ...reel, hasLiked: false }, ...prev]);
    setCurrentIdx(0);
    setUploadOpen(false);
    if (pts) setPoints(pts);
  };

  const topBarH = '52px';
  const feedH = `calc(100vh - ${topBarH})`;
  const cardH = feedH;
  const cardW = `calc(${feedH} * 9 / 16)`;

  return (
    <div style={{ 
      width: '100%', height: '100%', 
      background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', 
      overflow: 'hidden', fontFamily: 'var(--font-body)', color: T.text
    }}>
      <style>{`select option { background: #0f1420; } * { box-sizing: border-box; }`}</style>

      {/* ── Top bar ── */}
      <div style={{
        height: topBarH, flexShrink: 0,
        background: 'var(--color-surface)', backdropFilter: 'var(--glass-blur)',
        borderBottom: `1px solid var(--color-border)`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', gap: 12,
      }}>
        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 1 }}>
          {CATS.map(c => (
            <button key={c.id} onClick={() => handleCat(c.id)} style={{
              padding: '5px 14px', borderRadius: 20, border: `1px solid ${activeCat === c.id ? T.accent : 'var(--color-border)'}`,
              background: activeCat === c.id ? T.accent : 'var(--color-surface-elevated)',
              color: activeCat === c.id ? '#000' : 'var(--color-text-muted)',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.18s',
            }}>{c.label}</button>
          ))}
        </div>

        {/* Counter + Upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {reels.length > 0 && (
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>
              {currentIdx + 1} / {reels.length}
            </span>
          )}
          <button onClick={() => setUploadOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
            background: T.accent, color: '#000', border: 'none', borderRadius: 20,
            fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
            textTransform: 'uppercase', cursor: 'pointer',
            boxShadow: '0 0 16px rgba(0,229,160,0.25)',
          }}>
            <Upload size={13} /> Upload
          </button>
        </div>
      </div>

      {/* ── Feed area ── */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent, fontSize: 11, letterSpacing: '0.2em' }}>
          LOADING REELS...
        </div>
      ) : reels.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 56 }}>🎬</div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>No reels yet</h3>
          <p style={{ margin: 0, color: T.muted, fontSize: 13 }}>Be the first to share an eco-contribution!</p>
          <button onClick={() => setUploadOpen(true)} style={{ padding: '10px 24px', background: T.accent, color: '#000', border: 'none', borderRadius: 9, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
            Upload First Reel
          </button>
        </div>
      ) : (
        <div
          onWheel={handleWheel}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 24, padding: '0 24px',
            height: feedH,
          }}
        >
          {/* Prev button */}
          <NavBtn onClick={goPrev} disabled={currentIdx === 0}>
            <ChevronUp size={22} />
          </NavBtn>

          {/* 9:16 card */}
          <div style={{ width: cardW, height: cardH, maxWidth: '100%', flexShrink: 0, position: 'relative' }}>
            <ReelItem
              key={reels[currentIdx]?._id}
              reel={reels[currentIdx]}
              index={currentIdx}
              onLike={handleLike}
              onDelete={handleDelete}
              onFund={setFundReel}
              currentUser={currentUser}
              isActive={true}
            />
          </div>

          {/* Next button */}
          <NavBtn onClick={goNext} disabled={currentIdx === reels.length - 1}>
            <ChevronDown size={22} />
          </NavBtn>
        </div>
      )}

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onUploaded={handleUploaded} />}
      {fundReel && <FundModal reel={fundReel} onClose={() => setFundReel(null)} onSuccess={(amount) => { setFundReel(null); alert(`Successfully funded ₹${amount} to this initiative!`); }} />}
      {points && <PointsModal points={points} action="reel" onClose={() => setPoints(null)} />}
    </div>
  );
}
