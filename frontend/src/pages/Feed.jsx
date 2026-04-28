import { useState, useEffect } from 'react';
import { Camera, MapPin, Share2, AlertCircle, ThumbsUp, ThumbsDown, ShieldCheck, Play, Video } from 'lucide-react';
import api from '../api';
import CreateIssueModal from '../components/CreateIssueModal';
import { useLocation } from '../context/LocationContext';
import LeafletMap from '../components/LeafletMap';

// Helper to calculate distance in meters
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const Feed = () => {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ co2: '1.24 T/HR', drones: '482 UNIT' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { location, error: locError } = useLocation();

  const fetchIssues = async () => {
    try {
      const res = await api.get('/issues');
      if (res.data.success) {
        setIssues(res.data.issues);
      }
    } catch (err) {
      console.error("Failed to fetch issues", err);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleUpvote = async (id) => {
    try {
      await api.post(`/issues/${id}/upvote`);
      fetchIssues(); // refresh list
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async (id) => {
    try {
      const res = await api.post(`/issues/${id}/dislike`, {
        lat: location.lat,
        lng: location.lng
      });
      if (res.data.deleted) {
        alert("This issue has been automatically deleted due to high community dislike (threshold reached).");
      }
      fetchIssues();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Dislike failed');
    }
  };

  const handleVerify = async (id) => {
    if (!location.lat) {
      alert("Location tracking is required to verify issues.");
      return;
    }
    try {
      await api.post(`/issues/${id}/verify`, { 
        type: 'verify',
        lat: location.lat,
        lng: location.lng
      });
      fetchIssues(); // refresh list
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleModerate = async (id, action) => {
    if (action === 'approve') {
      const issue = issues.find(i => i._id === id);
      if (issue && location.lat) {
        const dist = getDistance(location.lat, location.lng, issue.location.coordinates[1], issue.location.coordinates[0]);
        if (dist > 10000) { // 10km
          alert(`Operational Restriction: You must be within 10km of the report to perform a Moderator Approval. Current distance: ${(dist/1000).toFixed(1)}km`);
          return;
        }
      } else if (!location.lat) {
        alert("Location identity required for moderator validation.");
        return;
      }
    }

    try {
      await api.put(`/issues/${id}/moderate`, { 
        action, 
        comment: `Action by moderator from Feed`,
        lat: location.lat,
        lng: location.lng 
      });
      fetchIssues();
    } catch (err) {
      alert(err.response?.data?.message || 'Moderator action failed');
    }
  };

  // Convert status string to step index
  const getStatusIndex = (status) => {
    if (status === 'open') return 1;
    if (status === 'verified') return 2;
    if (status === 'escalated') return 3;
    if (status === 'resolved') return 4;
    return 1;
  };

  const StatusProgress = ({ status }) => {
    const idx = getStatusIndex(status);
    return (
      <div className="flex items-center w-full mt-4 mb-4 gap-1">
        {['SUBMITTED', 'VERIFIED', 'ESCALATED', 'RESOLVED'].map((step, i) => {
          const isActive = i < idx;
          const isCurrent = i === idx - 1;
          return (
            <div key={step} className="flex-col w-full" style={{ opacity: isActive ? 1 : 0.3 }}>
              <div 
                style={{ 
                  height: '4px', 
                  background: isActive ? 'var(--color-primary)' : 'var(--color-border)', 
                  marginBottom: '8px',
                  borderRadius: '2px',
                  boxShadow: isCurrent ? 'var(--shadow-glow)' : 'none'
                }} 
              />
              <span className="text-xs font-bold" style={{ letterSpacing: '0.05em' }}>{step}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container py-8" style={{ display: 'grid', gridTemplateColumns: '250px minmax(500px, 1fr) 300px', gap: '2rem' }}>
      
      {/* Left Column */}
      <div className="flex-col gap-6">
        <div className="glass-card p-6">
          <h4 className="text-sm font-bold text-muted mb-4" style={{ letterSpacing: '0.1em' }}>PLANETARY PULSE</h4>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold">CO2 RECOVERY</span>
            <span className="text-xs font-bold text-primary">{stats.co2}</span>
          </div>
          <div className="progress-bar-bg mb-4"><div className="progress-bar-fill" style={{ width: '65%' }}></div></div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold">ACTIVE DRONES</span>
            <span className="text-xs font-bold text-primary">{stats.drones}</span>
          </div>
        </div>
      </div>

      {/* Middle Column (Feed) */}
      <div className="flex-col gap-6">
        {/* Post Box - Hidden for Moderators/Authorities */}
        {(() => {
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const user = JSON.parse(atob(token.split('.')[1]));
              if (user.role !== 'user') return null;
            } catch (e) {}
          }
          return (
            <div className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-primary mb-6" onClick={() => setIsModalOpen(true)}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(52,211,153,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle className="text-primary" size={20} />
              </div>
              <div className="flex-1 text-muted font-medium">POST AN ENVIRONMENTAL ISSUE...</div>
              <div className="flex gap-3">
                <Camera className="text-muted hover:text-primary transition-colors" size={20} />
                <Video className="text-muted hover:text-primary transition-colors" size={20} />
                <MapPin className="text-muted hover:text-primary transition-colors" size={20} />
              </div>
            </div>
          );
        })()}

        <CreateIssueModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchIssues} 
        />

        {/* Issues List */}
        {issues.length === 0 ? <p className="text-center text-muted mt-8">No issues reported yet. Be the first!</p> : null}
        
        {issues.map(issue => (
          <div key={issue._id} className="glass-card p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img src={issue.author?.avatar || `https://i.pravatar.cc/150?u=${issue.author?._id || 'anon'}`} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />
                <div>
                  <h5 className="text-xs font-bold text-primary">{issue.author?.name || 'Anonymous'}</h5>
                  <span className="text-xs text-muted">{new Date(issue.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted">
                <MapPin size={12} /> {issue.wardName || issue.address || 'Unknown Location'}
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2 uppercase">{issue.title}</h3>
            <p className="text-sm text-muted mb-4">{issue.description}</p>

            {issue.beforeImage && !issue.video && (
              <div style={{ position: 'relative', height: '240px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                <img src={issue.beforeImage} alt={issue.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                  <span className="text-xs font-bold px-2 py-1" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '4px' }}>
                    {issue.category.toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {issue.video && (
              <div style={{ position: 'relative', height: '240px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem', background: '#000' }}>
                <video 
                  src={issue.video} 
                  controls 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                  <span className="text-xs font-bold px-2 py-1 flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '4px' }}>
                    <Play size={10} /> VIDEO EVIDENCE
                  </span>
                </div>
              </div>
            )}

            <StatusProgress status={issue.status} />

            <div className="flex justify-between items-center mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-6">
                {(() => {
                  const token = localStorage.getItem('token');
                  let user = null;
                  if (token) {
                    try { user = JSON.parse(atob(token.split('.')[1])); } catch (e) {}
                  }
                  
                  const isMod = user && (user.role === 'moderator' || user.role === 'authority');

                  if (isMod) {
                    return (
                      <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <div className="flex items-center gap-1.5 text-muted">
                          <ThumbsUp size={14} className="opacity-50" />
                          <span className="text-xs font-bold tracking-tight">{issue.upvoteCount || 0}</span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-1.5 text-danger">
                          <ThumbsDown size={14} className="opacity-50" />
                          <span className="text-xs font-bold tracking-tight">{issue.dislikeCount || 0}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleUpvote(issue._id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${
                          issue.hasUpvoted 
                            ? 'bg-primary text-bg shadow-[0_0_15px_rgba(52,211,153,0.3)]' 
                            : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary border border-white/5'
                        }`}
                      >
                        <ThumbsUp size={14} />
                        {issue.upvoteCount || 0}
                      </button>

                      <button 
                        onClick={() => handleDislike(issue._id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${
                          issue.hasDisliked 
                            ? 'bg-danger text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                            : 'bg-white/5 text-muted hover:bg-white/10 hover:text-danger border border-white/5'
                        }`}
                        title="Dislike - 20 dislikes from nearby users will delete this report"
                      >
                        <ThumbsDown size={14} />
                        {issue.dislikeCount || 0}
                      </button>
                    </div>
                  );
                })()}

                {(() => {
                  const dist = location.lat && issue.location?.coordinates 
                    ? getDistance(location.lat, location.lng, issue.location.coordinates[1], issue.location.coordinates[0])
                    : null;
                  const isNear = dist !== null && dist <= 1000;
                  
                  if (!isNear) {
                    return (
                      <div className="flex items-center gap-2 text-primary font-bold text-[11px] tracking-widest uppercase ml-2 sonar-pulse">
                        <MapPin size={12} />
                        {(dist/1000).toFixed(1)} KM AWAY
                      </div>
                    );
                  }

                  return (
                    <button 
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                        issue.userVerification === 'verify'
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-white/5 text-primary border border-primary/20 hover:bg-primary/10'
                      }`}
                      onClick={() => handleVerify(issue._id)}
                    >
                      <ShieldCheck size={14} /> 
                      APPROVE ({issue.verificationCount})
                    </button>
                  );
                })()}

                {/* Administrative Governance Controls */}
                {(() => {
                  const token = localStorage.getItem('token');
                  if (token) {
                    try {
                      const user = JSON.parse(atob(token.split('.')[1]));
                      if ((user.role === 'moderator' || user.role === 'authority') && (issue.status === 'open' || issue.status === 'escalated')) {
                        return (
                          <div className="flex gap-2 ml-4 pl-6 border-l border-white/10">
                            <button 
                              onClick={() => handleModerate(issue._id, 'flag')}
                              className="px-5 py-2.5 rounded-xl text-danger border border-danger/40 bg-danger/10 hover:bg-danger/30 text-[11px] font-black transition-all glow-pulse-red tracking-wider uppercase"
                            >
                              REJECT
                            </button>
                            <button 
                              onClick={() => handleModerate(issue._id, 'approve')}
                              className="px-5 py-2.5 rounded-xl bg-primary text-[#000] text-[11px] font-black hover:shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all glow-pulse-green tracking-wider uppercase"
                            >
                              MOD APPROVE
                            </button>
                          </div>
                        );
                      }
                    } catch (e) {}
                  }
                  return null;
                })()}
              </div>
              <Share2 className="text-muted cursor-pointer hover:text-primary transition-all" size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Right Column */}
      <div className="flex-col gap-6">
        <div className="glass-card p-6">
          <h4 className="text-xs font-bold text-muted mb-4" style={{ letterSpacing: '0.1em' }}>MAP_OVERLAY</h4>
          <div style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid rgba(52,211,153,0.2)' }}>
            <LeafletMap 
              center={location.lat ? { lat: location.lat, lng: location.lng } : { lat: issues[0]?.location?.coordinates[1] || 0, lng: issues[0]?.location?.coordinates[0] || 0 }} 
              issues={issues}
            />
          </div>
          <div className="flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-muted">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)' }} /> {issues.filter(i => i.urgencyLevel === 'critical').length} CRITICAL ALERTS
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-muted">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} /> {issues.length} PENDING ACTIONS
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h4 className="text-xs font-bold text-muted mb-4" style={{ letterSpacing: '0.1em' }}>GLOBAL_LEADERS</h4>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-muted">01</span>
              <div>
                <h5 className="text-sm font-bold text-primary">ECO_WATCHER_ALPHA</h5>
                <span className="text-xs text-muted">4.8K IMPACT PTS</span>
              </div>
            </div>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
