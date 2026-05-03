import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, ShieldPlus, ArrowRight } from 'lucide-react';
import api from '../api';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const roles = [
    { id: 'user', label: 'User', desc: 'Civic Participant' },
    { id: 'moderator', label: 'Moderator', desc: 'Sector Manager' },
    { id: 'authority', label: 'Authority', desc: 'Gov Official' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Deployment failed. Identity conflict detected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      background: '#020604'
    }}>
      {/* ── IMMERSIVE BACKGROUND ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(52, 211, 153, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(52, 211, 153, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
        opacity: 0.4
      }}></div>

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '15%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, var(--color-primary-glow) 0%, transparent 70%)',
        filter: 'blur(60px)',
        opacity: 0.3,
        animation: 'pulse 8s infinite alternate'
      }}></div>

      {/* ── SCANNING LINE ── */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '2px',
        background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
        opacity: 0.2,
        zIndex: 5,
        animation: 'scan 4s linear infinite'
      }}></div>

      <div className="w-full" style={{ maxWidth: '460px', position: 'relative', zIndex: 10 }}>
        {/* System Meta Info */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '12px',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: 'var(--color-primary)',
          opacity: 0.6,
          letterSpacing: '1px'
        }}>
          <span>NODE_DEPLOY_V2.0</span>
          <span>PROTOCOL: P2P_GREEN</span>
        </div>

        <div className="glass-card" style={{ 
          padding: '2.5rem', 
          borderRadius: '24px', 
          border: '1px solid rgba(52, 211, 153, 0.2)',
          background: 'rgba(10, 20, 15, 0.8)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(52, 211, 153, 0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              display: 'inline-flex', 
              padding: '1.25rem', 
              borderRadius: '20px', 
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              marginBottom: '1.5rem'
            }}>
              <ShieldPlus className="text-primary" size={42} strokeWidth={1.5} />
            </div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 800, 
              marginBottom: '8px',
              letterSpacing: '-1px',
              color: '#fff'
            }}>Register Node</h1>
            <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Deploying Identity to Grid</p>
          </div>

          {/* Role Selector Tabs */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '4px',
            borderRadius: '16px',
            display: 'flex',
            marginBottom: '2rem',
            position: 'relative',
            border: '1px solid rgba(52, 211, 153, 0.1)'
          }}>
            <div style={{
              position: 'absolute',
              height: 'calc(100% - 8px)',
              width: `calc(100% / ${roles.length} - 5px)`,
              background: 'var(--color-primary)',
              borderRadius: '12px',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: `translateX(${roles.findIndex(r => r.id === formData.role) * 100}%)`,
              opacity: 0.1,
              zIndex: 1
            }}></div>
            
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setFormData({ ...formData, role: role.id })}
                style={{
                  flex: 1,
                  padding: '12px 6px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'transparent',
                  color: formData.role === role.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 2,
                  transition: 'color 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>{role.label}</span>
                <span style={{ fontSize: '8px', opacity: 0.5, fontWeight: 600 }}>{role.desc}</span>
              </button>
            ))}
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              marginBottom: '1.5rem',
              fontSize: '12px',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>Full Identity Name</label>
              <div style={{ position: 'relative' }}>
                <User className="absolute" size={18} style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(52, 211, 153, 0.4)' }} />
                <input 
                  type="text" 
                  style={{ 
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    padding: '14px 14px 14px 48px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="Agent Alpha"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>Operator Email</label>
              <div style={{ position: 'relative' }}>
                <Mail className="absolute" size={18} style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(52, 211, 153, 0.4)' }} />
                <input 
                  type="email" 
                  style={{ 
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    padding: '14px 14px 14px 48px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="name@sector.eco"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>Encryption Key</label>
              <div style={{ position: 'relative' }}>
                <Lock className="absolute" size={18} style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(52, 211, 153, 0.4)' }} />
                <input 
                  type="password" 
                  style={{ 
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    padding: '14px 14px 14px 48px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '16px', 
                borderRadius: '14px', 
                marginTop: '12px',
                background: 'var(--color-primary)',
                color: '#000',
                border: 'none',
                fontSize: '13px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 4px 20px rgba(52, 211, 153, 0.3)'
              }}
            >
              {loading ? 'Initializing Node...' : 'Deploy Identity Node'} 
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Existing Node? <Link to="/login" style={{ color: 'var(--color-primary)', marginLeft: '8px', borderBottom: '1px solid rgba(52, 211, 153, 0.3)' }}>Authenticate Session</Link>
            </p>
          </div>
        </div>

        {/* Footer text */}
        <div style={{ marginTop: '24px', textAlign: 'center', opacity: 0.4, fontSize: '9px', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Identity Protocol v4.0.1 • Authorized Deployment Only
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse {
          from { transform: scale(1); opacity: 0.2; }
          to { transform: scale(1.1); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default Register;




