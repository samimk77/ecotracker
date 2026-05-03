import { useState, useEffect, useMemo } from 'react';
import {
  Camera, MapPin, Share2, AlertCircle, ShieldCheck, Video, AlertTriangle, ShieldAlert,
  Filter, X, ChevronRight, Activity, Wifi, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import api from '../api';
import CreateIssueModal from '../components/CreateIssueModal';
import toast from 'react-hot-toast';
import PointsModal from '../components/PointsModal';

/* ─────────────────────────────────────────────────────────
   DESIGN TOKENS (Command Center)
───────────────────────────────────────────────────────── */
const T = {
  bg: '#050806',
  surface: '#0a0f0c',
  card: '#0c120e',
  border: '#1a261f',
  accent: '#00e5a0',
  danger: '#e11d48',
  amber: '#f5a623',
  text: '#f8fafc',
  muted: '#64748b',
};

/* ─────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────── */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const rad = (deg) => (deg * Math.PI) / 180;
  const φ1 = rad(lat1);
  const φ2 = rad(lat2);
  const Δφ = rad(lat2 - lat1);
  const Δλ = rad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const getUserFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (token) return JSON.parse(atob(token.split('.')[1]));
  } catch (_) { }
  return null;
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
};

const Divider = ({ style }) => <div style={{ height: 1, background: T.border, width: '100%', ...style }} />;

/* ─────────────────────────────────────────────────────────
   MODULE: ISSUE CARD
───────────────────────────────────────────────────────── */
const IssueCard = ({ issue, user, location, onUpvote, onDislike, onVerify }) => {
  const isCritical = issue.urgencyLevel === 'critical';
  const statusColor = isCritical ? T.danger : (issue.status === 'resolved' ? T.accent : T.amber);
  
  const dist = location?.lat && issue.location?.coordinates
    ? getDistance(location.lat, location.lng, issue.location.coordinates[1], issue.location.coordinates[0])
    : null;

  return (
    <article style={{ display: 'flex', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
      {/* Colored vertical bar */}
      <div style={{ width: 3, background: statusColor, flexShrink: 0 }} />
      


      {/* Content */}
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ color: statusColor, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '2px 6px', border: `1px solid ${statusColor}40`, borderRadius: 4, background: `${statusColor}15` }}>
            {issue.category?.replace('_', ' ')}
          </span>
          <span style={{ color: T.muted }}>
            posted by <span style={{ color: T.accent, fontWeight: 600 }}>u/{(issue.author?.name || 'eco_warrior').toLowerCase().replace(' ', '_')}</span> {timeAgo(issue.createdAt || new Date())}
          </span>
          <span style={{ color: T.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={10} /> {issue.wardName || 'Sector'} {dist && `- ${(dist / 1000).toFixed(1)} km`}
          </span>
        </div>
        
        {/* Title & Desc */}
        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3 }}>{issue.title}</h3>
        <p style={{ margin: '0 0 12px', fontSize: 14, color: T.muted, lineHeight: 1.5 }}>{issue.description}</p>
        
        {/* Media */}
        {issue.beforeImage && (
           <div style={{ width: '100%', maxHeight: 240, borderRadius: 6, overflow: 'hidden', marginBottom: 12, position: 'relative', border: `1px solid ${T.border}` }}>
             <img src={issue.beforeImage} alt={issue.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             {isCritical && <span style={{ position: 'absolute', top: 10, right: 10, background: T.danger, color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 4, letterSpacing: '0.1em' }}>CRITICAL</span>}
           </div>
        )}

        {/* Status items */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, letterSpacing: '0.01em' }}>
           <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={14} color={isCritical ? T.danger : T.accent} /> Criticality: {isCritical ? '9.2' : '4.5'}/10</span>
           <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={14} color={T.accent} /> Verified by {issue.verificationCount || 0} users</span>
           {issue.status === 'escalated' && (
             <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
               <ShieldAlert size={14} color={T.amber} /> 
               Escalated to authorities
             </span>
           )}
        </div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 3, background: T.border, display: 'flex', borderRadius: 2, overflow: 'hidden' }}>
             <div style={{ width: '33%', background: T.accent }}></div>
             <div style={{ width: issue.status === 'escalated' ? '33%' : '0%', background: T.amber }}></div>
             <div style={{ width: issue.status === 'resolved' ? '34%' : '0%', background: T.accent }}></div>
          </div>
          <span style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{issue.status}</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 11, fontWeight: 600, color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '6px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
             <button onClick={() => onUpvote(issue._id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: issue.hasUpvoted ? T.accent : '#fff', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = T.accent} onMouseLeave={e => e.currentTarget.style.color = issue.hasUpvoted ? T.accent : '#fff'}>
               <ThumbsUp size={14} fill={issue.hasUpvoted ? T.accent : 'none'} />
               <span style={{ fontWeight: 800, color: issue.hasUpvoted ? T.accent : '#fff' }}>{issue.upvoteCount - (issue.dislikeCount||0)}</span>
             </button>
             <div style={{ width: 1, height: 12, background: T.border }} />
             <button onClick={() => onDislike(issue._id)} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', color: issue.hasDisliked ? T.danger : '#fff', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = T.danger} onMouseLeave={e => e.currentTarget.style.color = issue.hasDisliked ? T.danger : '#fff'}>
               <ThumbsDown size={14} fill={issue.hasDisliked ? T.danger : 'none'} />
             </button>
           </div>

           <button 
             onClick={() => { if (issue.userVerification !== 'verify') onVerify(issue._id); }} 
             style={{ 
                display: 'flex', alignItems: 'center', gap: 6, 
                background: issue.userVerification === 'verify' ? 'rgba(0, 229, 160, 0.08)' : 'rgba(255,255,255,0.03)', 
                border: issue.userVerification === 'verify' ? `1px solid ${T.accent}60` : '1px solid rgba(255,255,255,0.15)', 
                color: issue.userVerification === 'verify' ? T.accent : '#fff', 
                cursor: issue.userVerification === 'verify' ? 'default' : 'pointer', 
                padding: '6px 14px',
                borderRadius: 20,
                transition: 'all 0.2s' 
              }} 
              onMouseEnter={e => { if(issue.userVerification !== 'verify') e.currentTarget.style.color = T.accent; }} 
              onMouseLeave={e => { if(issue.userVerification !== 'verify') e.currentTarget.style.color = '#fff'; }}
            >
             <ShieldCheck size={14}/> {issue.userVerification === 'verify' ? 'Verified' : 'Verify'}
           </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 20, color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#fff'}>
              <Share2 size={14}/> Share
            </button>
           
           <div style={{ flex: 1 }}></div>
           <button style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', letterSpacing: '0.1em' }}>•••</button>
        </div>
      </div>
    </article>
  );
};

/* ─────────────────────────────────────────────────────────
   MODULE: RIGHT SIDEBAR COMPONENTS
───────────────────────────────────────────────────────── */
const UI_CONFIG = {
  garbage: { label: 'Waste & Garbage', color: T.accent },
  waterlogging: { label: 'Waterlogging', color: '#4facfe' },
  deforestation: { label: 'Deforestation', color: T.accent },
  air_pollution: { label: 'Air Pollution', color: T.amber },
  others: { label: 'Others', color: '#a78bfa' },
  illegal_dumping: { label: 'Illegal Dumping', color: '#f472b6' },
  water_scarcity: { label: 'Water Scarcity', color: '#a78bfa' },
};

const AreaStats = ({ issues, selectedCategory, onSelectCategory }) => {
  const criticals = issues.filter(i => i.urgencyLevel === 'critical').length;
  const resolved = issues.filter(i => i.status === 'resolved').length;
  
  // Aggregate counts
  const counts = issues.reduce((acc, iss) => {
    const cat = (iss.category || 'garbage').toLowerCase().replace(' ', '_');
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const displayItems = Object.keys(UI_CONFIG).map(key => ({
    id: key,
    ...UI_CONFIG[key],
    count: counts[key] || 0,
  })).sort((a, b) => b.count - a.count);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 24 }}>
      {/* 4 Stats Grid */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: T.muted, marginBottom: 12 }}>AREA STATS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { v: issues.length || 48, l: 'REPORTS THIS WEEK' },
            { v: resolved || 12, l: 'RESOLVED' },
            { v: '8.4k', l: 'TOTAL UPVOTES' },
            { v: '312', l: 'ACTIVE USERS' },
          ].map(stat => (
            <div key={stat.l} style={{ background: T.card, border: `1px solid ${T.border}`, padding: '16px', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4, lineHeight: 1 }}>{stat.v}</div>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.05em' }}>{stat.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Alerts Strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: T.muted }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.danger }} />
        {criticals || 2} Critical Alerts
      </div>

      <Divider />

      {/* Filter By Type */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: T.muted }}>FILTER BY TYPE</div>
          <ChevronRight size={14} color={T.muted} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {displayItems.map(item => {
            const active = selectedCategory === item.id;
            return (
            <div 
              key={item.id} 
              onClick={() => onSelectCategory(active ? 'all' : item.id)}
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                background: active ? '#1a261f' : 'transparent',
                padding: '8px 10px', borderRadius: 8,
                border: active ? `1px solid ${T.border}` : '1px solid transparent'
              }} 
              className="filter-item"
            >
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                 <span style={{ fontSize: 13, color: active ? '#fff' : '#e2e8f0', fontWeight: 600 }}>{item.label}</span>
               </div>
               <span style={{ background: active ? T.accent : '#1a261f', border: `1px solid ${active ? T.accent : T.border}`, color: active ? '#000' : '#fff', fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                 {item.count}
               </span>
            </div>
          )})}
        </div>
      </div>

      <style>{`
        .filter-item:hover span:nth-child(2) { color: #fff !important; }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────────────────── */
export default function Feed() {
  const [issues, setIssues] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [awardedPoints, setAwardedPoints] = useState(null);
  const [awardAction, setAwardAction] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { location } = useLocation();
  const user = getUserFromToken();
  const isRegularUser = !user || user.role === 'user';

  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const wardParam = searchParams.get('ward');
  const idParam = searchParams.get('id');

  const fetchIssues = async () => {
    try {
      setLoadingIssues(true);
      const res = await api.get('/issues');
      if (res.data.success) setIssues(res.data.issues);
    } catch (err) {
      console.error('Failed to fetch issues', err);
    } finally {
      setLoadingIssues(false);
    }
  };

  useEffect(() => { fetchIssues(); }, []);

  const displayIssues = useMemo(() => {
    let filtered = issues;
    if (idParam) return issues.filter(iss => iss._id === idParam);
    if (wardParam) filtered = filtered.filter(iss => iss.wardName === wardParam);
    if (latParam && lngParam) {
      const targetLat = parseFloat(latParam);
      const targetLng = parseFloat(lngParam);
      filtered = filtered.filter(iss => {
        if (!iss.location?.coordinates) return false;
        const [lng, lat] = iss.location.coordinates;
        return getDistance(targetLat, targetLng, lat, lng) <= 3500; 
      });
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(iss => (iss.category || 'garbage').toLowerCase().replace(' ', '_') === selectedCategory);
    }
    return filtered;
  }, [issues, latParam, lngParam, wardParam, idParam, selectedCategory]);

  const handleUpvote = async (id) => {
    try {
      const res = await api.post(`/issues/${id}/upvote`);
      if (res.data.success) {
        setIssues(prev => prev.map(iss => iss._id === id ? {
          ...iss,
          hasUpvoted: res.data.upvoted,
          upvoteCount: res.data.upvoteCount,
          urgencyScore: res.data.urgencyScore,
          urgencyLevel: res.data.urgencyLevel,
        } : iss));
      }
    } catch (e) { console.error(e); }
  };
  const handleDislike = async (id) => {
    try {
      const res = await api.post(`/issues/${id}/dislike`, { lat: location?.lat, lng: location?.lng });
      if (res.data.deleted) {
        alert('Issue deleted due to high dislikes.');
        setIssues(prev => prev.filter(iss => iss._id !== id));
      } else {
        setIssues(prev => prev.map(iss => iss._id === id ? {
          ...iss,
          hasDisliked: !iss.hasDisliked,
          dislikeCount: res.data.dislikeCount,
        } : iss));
      }
    } catch (e) { alert(e.response?.data?.message || 'Dislike failed'); }
  };
  const handleVerify = async (id) => {
    if (!location?.lat) { alert('Location required to verify.'); return; }
    try {
      const res = await api.post(`/issues/${id}/verify`, { type: 'verify', lat: location.lat, lng: location.lng });
      toast.success('Community verification successful!');
      if (res.data.pointsGained > 0) {
        setAwardedPoints(res.data.pointsGained);
        setAwardAction('verify');
      }
      setIssues(prev => prev.map(iss => iss._id === id ? {
        ...iss,
        userVerification: 'verify',
        verificationCount: res.data.verificationCount,
        urgencyScore: res.data.urgencyScore,
      } : iss));
    }
    catch (e) { toast.error(e.response?.data?.message || 'Verification failed'); }
  };

  return (
    <div style={{
      height: '100vh', background: T.bg, color: T.text,
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      <style>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #1a261f; border-radius: 4px; }
      `}</style>

      <div style={{
        maxWidth: 1200, width: '100%', margin: '0 auto', padding: '32px 24px 0',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 300px',
        gap: 40,
        flex: 1,
        overflow: 'hidden',
      }}>
        
        {/* LEFT COLUMN (MAIN FEED) */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>
          
          <div style={{ flexShrink: 0 }}>
            {/* Feed Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Community Feed</h2>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 500 }}>{displayIssues.length} active issues · your area</div>
            </div>

          </div>

          {/* Compose Box */}
          {isRegularUser && (
            <div onClick={() => setIsModalOpen(true)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = T.accent} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a2620', color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{user?.name?.charAt(0) || 'A'}</div>
              <div style={{ flex: 1, color: '#e2e8f0', fontSize: 14 }}>Report an environmental issue in your area...</div>
              <div style={{ display: 'flex', gap: 16, color: T.muted, fontSize: 11, fontWeight: 700 }}>
                 <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Camera size={13}/> Photo</span>
                 <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Video size={13}/> Video</span>
                 <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><MapPin size={13}/> Location</span>
              </div>
            </div>
          )}
          </div>

          {/* Issue List */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 12, paddingBottom: 32 }}>
          {loadingIssues ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: T.muted }}>
              <Activity size={24} color={T.accent} className="animate-pulse" style={{ marginBottom: 12, margin: '0 auto' }} />
              <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em' }}>SYNCHRONIZING FEED...</p>
            </div>
          ) : displayIssues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: T.card, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1a2620', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Wifi size={20} color={T.muted} />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>No issues found matching the criteria.</p>
            </div>
          ) : (
            displayIssues.map(issue => (
              <IssueCard
                key={issue._id}
                issue={issue}
                user={user}
                location={location}
                onUpvote={handleUpvote}
                onDislike={handleDislike}
                onVerify={handleVerify}
              />
            ))
          )}
          </div>

        </div>

        <div className="right-sidebar" style={{ height: '100%', overflowY: 'auto', paddingBottom: 32, paddingRight: 8 }}>
          <AreaStats issues={issues} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        </div>

      </div>

      <CreateIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { fetchIssues(); toast.success("Report transmitted."); }}
      />
      {awardedPoints && <PointsModal points={awardedPoints} action={awardAction} onClose={() => { setAwardedPoints(null); setAwardAction(null); }} />}
    </div>
  );
}
