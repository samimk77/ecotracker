import { useState, useEffect } from 'react';
import { Calendar, Shield, Zap, Globe, Target, ArrowRight, Camera, Video, MoreHorizontal, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const meRes = await api.get('/auth/me');
        if (meRes.data.success) {
          const userId = meRes.data.user._id;
          const profileRes = await api.get(`/profile/${userId}`);
          if (profileRes.data.success) {
            setProfileData(profileRes.data);
          }
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="flex justify-center items-center h-screen text-primary">LOADING ARCHIVE...</div>;
  if (!profileData) return <div className="p-8 text-danger">ERROR: AUTH_SESSION_EXPIRED</div>;

  const { user, history } = profileData;
  const stats = user.stats || {};
  
  const score = user.stats?.sustainabilityScore || 82; // Dynamic score with fallback

  return (
    <div className="container py-10 flex-col gap-8">
      <div className="flex-col gap-1">
        <h4 className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Operational Overview</h4>
        <h1 className="text-2xl font-bold tracking-tight">Impact Dashboard</h1>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Sustainability Score */}
        <div className="lg:col-span-4 glass-card p-8 flex-col items-center text-center gap-6 relative overflow-hidden">
          <div className="relative flex items-center justify-center" style={{ width: '200px', height: '200px' }}>
            <svg viewBox="0 0 100 100" className="w-full h-full rotate-[-90deg]">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(52,211,153,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-primary)" strokeWidth="8" 
                strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - score/100)} strokeLinecap="round" 
                style={{ filter: 'drop-shadow(0 0 8px var(--color-primary))' }} />
            </svg>
            <div className="absolute flex-col">
              <span className="text-5xl font-bold">{score}</span>
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Score</span>
            </div>
          </div>
          
          <div className="flex-col gap-2">
            <h3 className="font-bold text-sm uppercase">Sustainability Score</h3>
            <p className="text-xs text-muted leading-relaxed">
              Your current score reflects an 8% increase in reforestation efficiency this quarter.
            </p>
          </div>

          <button className="btn btn-primary w-full py-3 text-[10px] tracking-widest">GENERATE REPORT</button>
        </div>

        {/* Right Column: Stats Grid */}
        <div className="lg:col-span-8 flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* CO2 Offset */}
            <div className="glass-card p-6 flex-col gap-4">
              <div className="flex justify-between items-start">
                <Globe className="text-muted" size={20} />
                <span className="text-primary text-[10px] font-bold">+12.4%</span>
              </div>
              <div className="flex-col">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">CO2 Offset</span>
                <span className="text-xl font-bold uppercase">4,892 Tons</span>
              </div>
              <div className="progress-bar-bg h-1">
                <div className="progress-bar-fill" style={{ width: '65%' }}></div>
              </div>
            </div>

            {/* Resolved Issues */}
            <div className="glass-card p-6 flex-col gap-4">
              <div className="flex justify-between items-start">
                <Shield className="text-muted" size={20} />
                <span className="text-primary text-[10px] font-bold">98%</span>
              </div>
              <div className="flex-col">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Resolved Issues</span>
                <span className="text-xl font-bold uppercase">1,204 Units</span>
              </div>
              <div className="progress-bar-bg h-1">
                <div className="progress-bar-fill" style={{ width: '98%' }}></div>
              </div>
            </div>
          </div>

          {/* Impact Fund */}
          <div className="glass-card p-8 flex justify-between items-center relative overflow-hidden group">
            <div className="flex-col gap-2 relative z-10">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Impact Fund</span>
              <h2 className="text-3xl font-bold">$842,500.00</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-6 h-6 rounded-full border-2 border-bg" />
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-bg bg-surface flex items-center justify-center text-[8px] font-bold">+12</div>
                </div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest ml-2">Active Contributors</span>
              </div>
            </div>
            <Zap className="text-primary opacity-5 absolute -right-4 -bottom-4 group-hover:scale-125 transition-transform" size={160} />
          </div>
        </div>
      </div>

      {/* Recent Verified Actions */}
      <div className="glass-card p-8 flex-col gap-8">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-widest">Recent Verified Actions</h3>
          <button className="text-[10px] font-bold text-muted flex items-center gap-1 hover:text-primary transition-all">
            VIEW ALL <ArrowRight size={14} />
          </button>
        </div>

        <div className="flex-col gap-6">
          {history.recentVerifiedActions.map((action) => (
            <div key={action.id} className="flex justify-between items-center group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={action.avatar} alt={action.title} className="w-12 h-12 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all" />
                  <div className="absolute -bottom-1 -right-1 bg-bg p-0.5 rounded">
                    <Shield size={12} className="text-primary" />
                  </div>
                </div>
                <div className="flex-col gap-0.5">
                  <h4 className="text-sm font-bold tracking-tight">{action.title}</h4>
                  <p className="text-[10px] text-muted font-medium uppercase">{action.location} • Verified by {action.verifiedBy}</p>
                </div>
              </div>
              <div className="text-right flex-col">
                <span className="text-sm font-bold text-primary">{action.metric}</span>
                <span className="text-[10px] text-muted font-bold uppercase tracking-widest">{action.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-4">
        <button className="text-[10px] font-bold text-muted hover:text-danger tracking-widest transition-colors" onClick={() => {
          localStorage.removeItem('token');
          navigate('/login');
        }}>TERMINATE SESSION</button>
        <span className="text-[10px] font-bold text-primary/30 tracking-[0.3em]">ECOIMPACT_ENCRYPTED_V4.2</span>
      </div>
    </div>
  );
};

export default Profile;

