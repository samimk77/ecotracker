import { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, AlertTriangle, MapPin, Clock, 
  ChevronRight, Activity, Search, Filter, HardDrive,
  Zap, ArrowRight, CornerDownRight, Target
} from 'lucide-react';
import api from '../api';
import { useLocation } from '../context/LocationContext';
import toast from 'react-hot-toast';

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const TOKEN = {
  bg: '#0a0b10',
  surface: 'rgba(16, 18, 27, 0.7)',
  border: 'rgba(255, 255, 255, 0.08)',
  primary: '#10b981',
  primaryGlow: 'rgba(16, 18, 129, 0.15)',
  danger: '#ef4444',
  text: '#ffffff',
  textDim: '#94a3b8',
  fontMono: '"JetBrains Mono", "Fira Code", monospace'
};

const Moderator = () => {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [searchQuery, setSearchQuery] = useState('');
  const { location } = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (e) {}
    };
    fetchUser();
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/issues');
      setIssues(res.data.issues);
    } catch (err) {
      toast.error('Failed to fetch governance queue');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, note) => {
    if (action === 'approve') {
      const issue = issues.find(i => i._id === id);
      if (issue && location.lat) {
        const dist = getDistance(location.lat, location.lng, issue.location.coordinates[1], issue.location.coordinates[0]);
        if (dist > 10000) {
          toast.error(`Operational Restriction: Distance too great (${(dist/1000).toFixed(1)}km)`);
          return;
        }
      } else if (!location.lat) {
        toast.error("Location identity required for moderation.");
        return;
      }
    }

    try {
      await api.put(`/issues/${id}/moderate`, { action, note, lat: location.lat, lng: location.lng });
      toast.success(`Action applied: ${action.toUpperCase()}`);
      fetchIssues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleEscalate = async (id) => {
    try {
      setLoading(true);
      const res = await api.post(`/issues/${id}/escalate`);
      if (res.data.success) {
        toast.success("AI Brief dispatched to Ward Authority");
        fetchIssues();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Escalation failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter(iss => {
    const matchesFilter = filter === 'all' || iss.status === filter;
    const matchesSearch = iss.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         iss.wardName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: TOKEN.bg, 
      color: TOKEN.text,
      padding: '2rem',
      fontFamily: 'var(--font-body)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decor */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Header Section */}
      <header style={{ position: 'relative', zIndex: 1, marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: TOKEN.primary, color: '#000', padding: '2px 8px', fontSize: 10, fontWeight: 900, borderRadius: 4, letterSpacing: '0.1em' }}>
              SECTOR_MOD_V.2.4
            </div>
            <div style={{ color: TOKEN.primary, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em' }}>
              IDENTITY_AUTHORIZED: {user?.name?.toUpperCase()}
            </div>
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.9 }}>
            GOVERNANCE<br/><span style={{ color: TOKEN.primary }}>TERMINAL</span>
          </h1>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TOKEN.textDim, marginBottom: 4, letterSpacing: '0.2em' }}>OPERATIONAL_STATUS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TOKEN.primary }}>
            <Activity size={16} className="animate-pulse" />
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: TOKEN.fontMono }}>LINK_ACTIVE_SECURE</span>
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <div style={{ 
        position: 'relative', zIndex: 1,
        display: 'flex', gap: '1.5rem', marginBottom: '2rem',
        padding: '1.5rem', borderRadius: 20,
        background: TOKEN.surface, border: `1px solid ${TOKEN.border}`,
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: TOKEN.textDim }} size={18} />
          <input 
            type="text" 
            placeholder="SEARCH SECTOR DATA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 12px 12px 48px',
              background: 'rgba(0,0,0,0.3)', border: `1px solid ${TOKEN.border}`,
              borderRadius: 12, color: TOKEN.text, fontSize: 13,
              fontFamily: TOKEN.fontMono, outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 14, border: `1px solid ${TOKEN.border}` }}>
          {['open', 'verified', 'flagged', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: filter === f ? TOKEN.primary : 'transparent',
                color: filter === f ? '#000' : TOKEN.textDim,
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {f === 'open' ? 'PENDING' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ height: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ 
            width: 40, height: 40, border: `3px solid ${TOKEN.primary}22`,
            borderTopColor: TOKEN.primary, borderRadius: '50%'
          }} className="animate-spin" />
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.4em', color: TOKEN.primary }}>SYNCING_GRID_DATA...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
          {filteredIssues.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem', background: TOKEN.surface, borderRadius: 24, border: `1px dotted ${TOKEN.border}` }}>
              <HardDrive size={48} color={TOKEN.textDim} style={{ marginBottom: 20, opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: TOKEN.textDim, letterSpacing: '0.1em' }}>QUEUE_IS_EMPTY: NO_REPORTS_FOUND</div>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div 
                key={issue._id} 
                className="group"
                style={{
                  background: TOKEN.surface, border: `1px solid ${TOKEN.border}`,
                  borderRadius: 24, padding: '1.5rem', backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                {/* Status Glow */}
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
                  background: issue.status === 'open' ? TOKEN.primary : (issue.status === 'verified' ? '#3b82f6' : TOKEN.danger)
                }} />

                <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ 
                    width: 100, height: 100, borderRadius: 16, overflow: 'hidden', 
                    background: 'rgba(0,0,0,0.5)', border: `1px solid ${TOKEN.border}`,
                    flexShrink: 0
                  }}>
                    {issue.beforeImage ? (
                      <img src={issue.beforeImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Issue" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={24} color={TOKEN.textDim} />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 10, fontWeight: 900, color: TOKEN.primary, letterSpacing: '0.1em', marginBottom: 4 }}>
                        {issue.category?.toUpperCase()} // {issue._id.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 10, color: TOKEN.textDim, fontFamily: TOKEN.fontMono }}>
                        XP_GRANT: +{issue.urgencyScore}
                      </div>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>{issue.title}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: TOKEN.textDim }}>
                        <MapPin size={12} /> {issue.wardName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: TOKEN.textDim }}>
                        <Clock size={12} /> {new Date(issue.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, 
                  fontSize: 13, color: TOKEN.textDim, marginBottom: '1.5rem',
                  border: `1px solid ${TOKEN.border}`, minHeight: 60
                }}>
                  {issue.description}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{issue.upvoteCount}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: TOKEN.textDim }}>UPVOTES</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: TOKEN.danger }}>{issue.dislikeCount || 0}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: TOKEN.textDim }}>DISLIKES</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    {issue.status === 'open' && (
                      <>
                        <button 
                          onClick={() => handleAction(issue._id, 'flag', 'Rejected by command')}
                          style={{
                            padding: '10px 18px', borderRadius: 12, border: `1px solid ${TOKEN.danger}44`,
                            background: 'transparent', color: TOKEN.danger,
                            fontSize: 11, fontWeight: 800, cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          REJECT
                        </button>
                        <button 
                          onClick={() => handleAction(issue._id, 'approve', 'Verified by command')}
                          style={{
                            padding: '10px 18px', borderRadius: 12, border: 'none',
                            background: TOKEN.primary, color: '#000',
                            fontSize: 11, fontWeight: 900, cursor: 'pointer',
                            boxShadow: `0 4px 12px ${TOKEN.primary}44`,
                            transition: 'all 0.2s'
                          }}
                        >
                          VERIFY & PUBLISH
                        </button>
                      </>
                    )}

                    {issue.status === 'verified' && (
                      <button 
                        onClick={() => handleEscalate(issue._id)}
                        style={{
                          padding: '10px 18px', borderRadius: 12, border: 'none',
                          background: TOKEN.danger, color: '#fff',
                          fontSize: 11, fontWeight: 900, cursor: 'pointer',
                          boxShadow: `0 4px 12px ${TOKEN.danger}44`,
                          transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', gap: 8
                        }}
                      >
                        <Zap size={14} /> ESCALATE TO AUTHORITIES
                      </button>
                    )}

                    {issue.status === 'escalated' && (
                      <div style={{ 
                        padding: '10px 18px', borderRadius: 12, 
                        background: 'rgba(255,255,255,0.05)', border: `1px solid ${TOKEN.border}`,
                        color: TOKEN.textDim, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em'
                      }}>
                        AWAITING_AUTHORITY_SYNC
                      </div>
                    )}
                  </div>
                </div>

                {/* Tactical Overlays */}
                <div style={{ position: 'absolute', top: 12, right: 12, opacity: 0.1 }}>
                  <Target size={48} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .group:hover {
          transform: translateY(-4px);
          border-color: ${TOKEN.primary}44 !important;
          box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        }
      `}</style>
    </div>
  );
};

export default Moderator;
