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
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--color-bg)'
    }}>
      {/* Background Decorative Orbs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '40%',
        height: '40%',
        background: 'var(--color-primary-glow)',
        filter: 'blur(100px)',
        borderRadius: '50%'
      }}></div>

      <div className="w-full" style={{ maxWidth: '400px', position: 'relative', zIndex: 10 }}>
        <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid var(--color-border)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              display: 'inline-flex', 
              padding: '1rem', 
              borderRadius: '1rem', 
              background: 'var(--color-primary-glow)',
              marginBottom: '1rem'
            }}>
              <Shield className="text-primary" size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Access Terminal</h1>
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Secure Civic Gateway</p>
          </div>

          {error && (
            <div className="text-danger" style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.5rem',
              fontSize: '0.75rem',
              border: '1px solid var(--color-danger)'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-col gap-6">
            <div className="flex-col gap-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Operator Email</label>
              <div className="relative">
                <Mail className="absolute text-muted" size={18} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: '40px' }}
                  placeholder="name@sector.eco"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex-col gap-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Encryption Key</label>
              <div className="relative">
                <Lock className="absolute text-muted" size={18} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', marginTop: '1rem' }}
            >
              {loading ? 'Decrypting...' : 'Authenticate Identity'} 
              {!loading && <ArrowRight size={16} className="ml-2" />}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p className="text-xs text-muted uppercase tracking-widest">
              No Identity? <Link to="/register" className="text-primary font-bold">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


