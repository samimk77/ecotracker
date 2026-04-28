import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, MapPin, Clock } from 'lucide-react';
import api from '../api';
import { useLocation } from '../context/LocationContext';

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const Moderator = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [error, setError] = useState('');
  const { location } = useLocation();

  // Event Form State
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', category: 'cleanup', date: '', capacity: 0
  });

  // Guest List State
  const [guestList, setGuestList] = useState(null);
  const [showGuestList, setShowGuestList] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (e) {}
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (activeTab === 'governance') fetchIssues();
    if (activeTab === 'events') fetchEvents();
  }, [activeTab]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await api.get('/issues');
      setIssues(res.data.issues);
    } catch (err) {
      setError('Failed to fetch governance queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      setEvents(res.data.events);
    } catch (err) {
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, comment) => {
    if (action === 'approve') {
      const issue = issues.find(i => i._id === id);
      if (issue && location.lat) {
        const dist = getDistance(location.lat, location.lng, issue.location.coordinates[1], issue.location.coordinates[0]);
        if (dist > 10000) {
          alert(`Operational Restriction: Distance too great (${(dist/1000).toFixed(1)}km). You must be within 10km to approve.`);
          return;
        }
      } else if (!location.lat) {
        alert("Location identity required for moderation.");
        return;
      }
    }

    try {
      await api.put(`/issues/${id}/moderate`, { 
        action, 
        comment,
        lat: location.lat,
        lng: location.lng
      });
      fetchIssues();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handlePublishEvent = async (e) => {
    e.preventDefault();
    if (!location.lat) {
      alert("Location required to publish event.");
      return;
    }
    try {
      await api.post('/events', {
        ...newEvent,
        lat: location.lat,
        lng: location.lng
      });
      setShowEventForm(false);
      setNewEvent({ title: '', description: '', category: 'cleanup', date: '', capacity: 0 });
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish event');
    }
  };

  const handleViewGuestList = async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}`);
      setGuestList(res.data.event);
      setShowGuestList(true);
    } catch (err) {
      alert('Failed to fetch guest list');
    }
  };

  const filteredIssues = issues.filter(iss => {
    if (filter === 'all') return true;
    return iss.status === filter;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {activeTab === 'dashboard' ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-8">
          <div className="flex-col gap-2">
            <h4 className="text-primary font-black tracking-[0.4em] uppercase text-xs mb-4">Identity Verified: {user?.role}</h4>
            <h1 className="text-6xl font-black mb-4">HI, {user?.name?.split(' ')[0].toUpperCase()}</h1>
            <p className="text-muted text-sm tracking-widest uppercase opacity-60">WELCOME TO THE ECOIMPACT COMMAND CENTER</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mt-12">
            <button 
              onClick={() => setActiveTab('events')}
              className="glass-card p-10 flex flex-col items-center gap-6 group hover:border-primary transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-bg transition-all">
                <Calendar size={32} />
              </div>
              <div className="flex-col gap-2">
                <h3 className="text-2xl font-black tracking-tight">ECO-ACTION HUB</h3>
                <p className="text-xs text-muted font-bold uppercase tracking-widest">Publish & Manage Community Events</p>
              </div>
            </button>

            <button 
              onClick={() => setActiveTab('governance')}
              className="glass-card p-10 flex flex-col items-center gap-6 group hover:border-danger transition-all hover:scale-[1.02] cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center text-danger group-hover:bg-danger group-hover:text-white transition-all">
                <Shield size={32} />
              </div>
              <div className="flex-col gap-2">
                <h3 className="text-2xl font-black tracking-tight">GOVERNANCE PORTAL</h3>
                <p className="text-xs text-muted font-bold uppercase tracking-widest">Review & Verify Environmental Reports</p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-muted"
              >
                <ArrowRight size={20} className="rotate-180" />
              </button>
              <div>
                <h1 className="text-4xl font-bold flex items-center gap-3">
                  <Shield className="text-primary" size={36} />
                  {activeTab === 'governance' ? 'Governance Terminal' : 'Eco-Event Hub'}
                </h1>
                <div className="flex gap-4 mt-4">
                  <button 
                    onClick={() => setActiveTab('governance')}
                    className={`pb-2 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === 'governance' ? 'text-primary border-primary' : 'text-muted border-transparent opacity-50'}`}
                  >
                    GOVERNANCE
                  </button>
                  <button 
                    onClick={() => setActiveTab('events')}
                    className={`pb-2 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${activeTab === 'events' ? 'text-primary border-primary' : 'text-muted border-transparent opacity-50'}`}
                  >
                    ECO-EVENTS
                  </button>
                </div>
              </div>
            </div>
        
        {activeTab === 'governance' && (
          <div className="flex gap-2 bg-bg-light p-1 rounded-xl border border-white/5">
            {['all', 'open', 'verified', 'flagged'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-[#000]' : 'text-muted hover:bg-white/5'}`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'events' && (
          <button 
            onClick={() => setShowEventForm(true)}
            className="px-6 py-2 rounded-xl bg-primary text-[#000] text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all"
          >
            PUBLISH EVENT
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : activeTab === 'governance' ? (
        <div className="grid gap-6">
          {filteredIssues.length === 0 ? (
            <div className="glass-card text-center" style={{ padding: '4rem' }}>
              <CheckCircle className="text-muted mx-auto mb-4" size={48} />
              <p className="text-muted">Verification queue is empty. All issues processed.</p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div key={issue._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'start' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '1rem', background: 'var(--color-bg-light)', overflow: 'hidden', flexShrink: 0 }}>
                  {issue.images?.[0] ? (
                    <img src={issue.images[0]} alt="Issue" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle className="text-muted" />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{issue.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {issue.wardName || 'Unknown Location'}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(issue.createdAt).toLocaleDateString()}</span>
                        <span className={`px-2 py-0.5 rounded uppercase font-bold text-[8px] ${
                          issue.urgencyLevel === 'high' ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'
                        }`}>
                          {issue.urgencyLevel}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Reputation Impact</div>
                      <div className="text-primary font-bold">+{issue.urgencyScore} XP</div>
                    </div>
                  </div>

                  <p className="text-sm text-muted mb-4 line-clamp-2">{issue.description}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="flex gap-4">
                      <div style={{ textAlign: 'center' }}>
                        <div className="text-xs font-bold">{issue.upvoteCount}</div>
                        <div className="text-[8px] text-muted uppercase">Upvotes</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div className="text-xs font-bold text-danger">{issue.dislikeCount || 0}</div>
                        <div className="text-[8px] text-muted uppercase">Dislikes</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {(issue.status === 'open' || issue.status === 'escalated') && (
                        <>
                          <button 
                            onClick={() => handleAction(issue._id, 'flag', 'Rejected by moderator')}
                            className="px-5 py-2 rounded-xl text-danger border border-danger/40 hover:bg-danger/10 text-[10px] font-bold"
                          >
                            REJECT
                          </button>
                          <button 
                            onClick={() => handleAction(issue._id, 'approve', 'Verified by moderator')}
                            className="px-5 py-2 rounded-xl bg-primary text-[#000] text-[10px] font-black"
                          >
                            APPROVE
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {events.length === 0 ? (
            <div className="glass-card text-center" style={{ padding: '4rem' }}>
              <Clock className="text-muted mx-auto mb-4" size={48} />
              <p className="text-muted">No community events published yet.</p>
            </div>
          ) : (
            events.map((event) => (
              <div key={event._id} className="glass-card p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-primary mb-1">{event.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted mb-3">
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(event.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 uppercase tracking-widest font-black text-white/40">{event.category}</span>
                  </div>
                  <p className="text-sm text-muted max-w-xl">{event.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-white mb-1">{event.participantCount || 0}</div>
                  <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4">PARTICIPANTS</div>
                  <button 
                    onClick={() => handleViewGuestList(event._id)}
                    className="text-[10px] font-bold text-muted hover:text-white underline uppercase"
                  >
                    View Guest List
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Event Creation Modal */}
      {showEventForm && (
        <div className="modal-overlay">
          <div className="modal-content p-8 max-w-md">
            <h2 className="text-2xl font-black text-primary mb-6 uppercase tracking-widest">Publish Eco-Event</h2>
            <form onSubmit={handlePublishEvent} className="flex flex-col gap-4">
              <input 
                type="text" placeholder="EVENT TITLE" required className="form-input"
                value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})}
              />
              <textarea 
                placeholder="DESCRIPTION" required className="form-input h-32"
                value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="date" required className="form-input"
                  value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                />
                <input 
                  type="number" placeholder="CAPACITY" className="form-input"
                  value={newEvent.capacity} onChange={e => setNewEvent({...newEvent, capacity: e.target.value})}
                />
              </div>
              <select 
                className="form-input" value={newEvent.category} 
                onChange={e => setNewEvent({...newEvent, category: e.target.value})}
              >
                <option value="cleanup">CLEANUP DRIVE</option>
                <option value="tree_plantation">TREE PLANTATION</option>
                <option value="awareness">AWARENESS CAMP</option>
              </select>
              
              <div className="flex gap-4 mt-4">
                <button type="button" onClick={() => setShowEventForm(false)} className="flex-1 btn text-muted">CANCEL</button>
                <button type="submit" className="flex-1 btn btn-primary">PUBLISH</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest List Modal */}
      {showGuestList && guestList && (
        <div className="modal-overlay">
          <div className="modal-content p-8 max-w-md">
            <h2 className="text-2xl font-black text-primary mb-2 uppercase tracking-widest">Guest List</h2>
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-6">{guestList.title}</p>
            
            <div className="flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
              {guestList.participants?.length === 0 ? (
                <p className="text-muted text-xs italic">No participants registered yet.</p>
              ) : (
                guestList.participants?.map(user => (
                  <div key={user._id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-col">
                      <div className="text-sm font-bold">{user.name}</div>
                      <div className="text-[10px] text-muted">{user.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={() => setShowGuestList(false)} 
              className="btn btn-primary w-full mt-8"
            >
              CLOSE MANIFEST
            </button>
          </div>
        </div>
      )}
    </>
  )}
</div>
);
};

export default Moderator;
