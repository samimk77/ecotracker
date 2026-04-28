import { useState, useEffect } from 'react';
import { Leaf, MapPin, ThumbsUp, AlertTriangle, ArrowRight, Shield, Globe, Zap } from 'lucide-react';
import api from '../api';
import { Link } from 'react-router-dom';
import CreateIssueModal from '../components/CreateIssueModal';

const Home = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchIssues = async () => {
    try {
      const { data } = await api.get('/issues');
      if (data.success) {
        setIssues(data.issues.slice(0, 3)); // Show top 3
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  return (
    <div className="flex-col gap-12 pb-20">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.05), transparent)' }}>
        <div className="container flex-col items-center text-center gap-6">
          <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-xs uppercase animate-pulse-slow">
            <Shield size={14} /> Planetary Defense Protocol Active
          </div>
          <h1 className="text-6xl font-bold tracking-tighter" style={{ maxWidth: '800px', lineHeight: 1 }}>
            MONITOR. REPORT. <span className="text-primary">RESTORE.</span>
          </h1>
          <p className="text-lg text-muted" style={{ maxWidth: '600px' }}>
            The next-generation civic platform for environmental accountability. 
            Empowering citizens to protect our ecosystems with real-time data and AI-driven insights.
          </p>
          <div className="flex gap-4 mt-4">
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary py-3 px-8 flex items-center gap-2">
              <AlertTriangle size={18} /> REPORT AN ISSUE
            </button>
            <Link to="/feed" className="btn btn-outline py-3 px-8">VIEW FULL FEED</Link>
          </div>
        </div>

        <CreateIssueModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchIssues} 
        />

        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary opacity-5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-secondary opacity-5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* Stats Section */}
      <section className="container">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass-card p-8 flex items-center gap-6">
            <div className="p-4 rounded-lg" style={{ background: 'rgba(52,211,153,0.1)' }}>
              <Globe className="text-primary" size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-bold">142</h4>
              <p className="text-xs text-muted uppercase tracking-widest">Active Wards</p>
            </div>
          </div>
          <div className="glass-card p-8 flex items-center gap-6">
            <div className="p-4 rounded-lg" style={{ background: 'rgba(52,211,153,0.1)' }}>
              <Zap className="text-primary" size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-bold">8.4K</h4>
              <p className="text-xs text-muted uppercase tracking-widest">Issues Resolved</p>
            </div>
          </div>
          <div className="glass-card p-8 flex items-center gap-6">
            <div className="p-4 rounded-lg" style={{ background: 'rgba(52,211,153,0.1)' }}>
              <Leaf className="text-primary" size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-bold">12.5T</h4>
              <p className="text-xs text-muted uppercase tracking-widest">CO2 Offset</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Alerts Section */}
      <section className="container mt-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold uppercase tracking-tighter">Planetary Alerts</h2>
            <p className="text-muted">Live feed of environmental reports from active sectors.</p>
          </div>
          <Link to="/" className="text-primary font-bold text-sm flex items-center gap-2 hover:underline">
            VIEW FULL FEED <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {issues.map((issue) => (
              <div key={issue._id} className="glass-card overflow-hidden group">
                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                  <img 
                    src={issue.beforeImage || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'} 
                    alt={issue.title} 
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${issue.urgencyLevel === 'critical' ? 'bg-danger/20 border-danger text-danger' : 'bg-primary/20 border-primary text-primary'}`}>
                      {issue.urgencyLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-col gap-4">
                  <div className="flex-col gap-1">
                    <h3 className="text-lg font-bold tracking-tight uppercase group-hover:text-primary transition-colors">{issue.title}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-muted font-bold uppercase">
                      <MapPin size={10} /> {issue.wardName || 'Global Sector'}
                    </div>
                  </div>
                  <p className="text-sm text-muted line-clamp-2">{issue.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-border mt-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <ThumbsUp size={14} className="text-primary" /> {issue.upvoteCount}
                    </div>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{issue.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const Loader2 = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default Home;

