import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, Globe } from 'lucide-react';
import api from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
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
        top: '20%',
        left: '15%',
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

      <div className="w-full" style={{ maxWidth: '420px', position: 'relative', zIndex: 10 }}>
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
          <span>SYS_BOOT_ID: 0x8F22</span>
          <span>TERM_ENC: RSA_4096</span>
        </div>

        <div className="glass-card" style={{ 
          padding: '3rem 2.5rem', 
          borderRadius: '24px', 
          border: '1px solid rgba(52, 211, 153, 0.2)',
          background: 'rgba(10, 20, 15, 0.8)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(52, 211, 153, 0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ 
              display: 'inline-flex', 
              padding: '1.25rem', 
              borderRadius: '20px', 
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              marginBottom: '1.5rem',
              boxShadow: '0 0 20px rgba(52, 211, 153, 0.1)'
            }}>
              <Shield className="text-primary" size={42} strokeWidth={1.5} />
            </div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 800, 
              marginBottom: '8px',
              letterSpacing: '-1px',
              background: 'linear-gradient(to bottom, #fff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Command Access</h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.3em' }}>System Online</p>
            </div>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              marginBottom: '2rem',
              fontSize: '12px',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Globe size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>Operator ID</label>
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
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  placeholder="name@sector.eco"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>Access Key</label>
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
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 20px rgba(52, 211, 153, 0.3)'
              }}
              onMouseEnter={e => {
                if(!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(52, 211, 153, 0.4)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(52, 211, 153, 0.3)';
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  Authenticating...
                </>
              ) : (
                <>
                  Authorize Session
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              No Identity Node? <Link to="/register" style={{ color: 'var(--color-primary)', marginLeft: '8px', borderBottom: '1px solid rgba(52, 211, 153, 0.3)' }}>Register Here</Link>
            </p>
          </div>
        </div>

        {/* Footer text */}
        <div style={{ marginTop: '24px', textAlign: 'center', opacity: 0.4, fontSize: '9px', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          THRYVE Global Network © 2026 • Verified Tactical Operation
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          from { transform: scale(1); opacity: 0.2; }
          to { transform: scale(1.1); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default Login;


