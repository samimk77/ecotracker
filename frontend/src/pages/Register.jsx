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
    { id: 'user', label: 'User' },
    { id: 'moderator', label: 'Moderator' },
    { id: 'authority', label: 'Authority' }
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
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--color-bg)'
    }}>
      {/* Background Decorative Orbs */}
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '40%',
        height: '40%',
        background: 'var(--color-primary-glow)',
        filter: 'blur(100px)',
        borderRadius: '50%'
      }}></div>

      <div className="w-full" style={{ maxWidth: '440px', position: 'relative', zIndex: 10 }}>
        <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid var(--color-border)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              display: 'inline-flex', 
              padding: '1rem', 
              borderRadius: '1rem', 
              background: 'var(--color-primary-glow)',
              marginBottom: '1rem'
            }}>
              <ShieldPlus className="text-primary" size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Register Identity</h1>
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Deploy New Eco-Node</p>
          </div>

          {/* Role Selector Tabs */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '4px',
            borderRadius: '12px',
            display: 'flex',
            marginBottom: '2rem',
            position: 'relative',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{
              position: 'absolute',
              height: 'calc(100% - 8px)',
              width: `calc(100% / ${roles.length} - 5px)`,
              background: 'var(--color-primary)',
              borderRadius: '8px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: `translateX(${roles.findIndex(r => r.id === formData.role) * 100}%)`,
              opacity: 0.15
            }}></div>
            
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setFormData({ ...formData, role: role.id })}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: formData.role === role.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 2,
                  transition: 'color 0.3s'
                }}
              >
                {role.label}
              </button>
            ))}
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

          <form onSubmit={handleSubmit} className="flex-col gap-5">
            <div className="flex-col gap-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Full Identity Name</label>
              <div className="relative">
                <User className="absolute text-muted" size={18} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '40px' }}
                  placeholder="Agent Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex-col gap-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Operator Email</label>
              <div className="relative">
                <Mail className="absolute text-muted" size={18} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: '40px' }}
                  placeholder="name@sector.eco"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              {loading ? 'Initializing...' : 'Deploy Node'} 
              {!loading && <ArrowRight size={16} className="ml-2" />}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p className="text-xs text-muted uppercase tracking-widest">
              Existing Identity? <Link to="/login" className="text-primary font-bold">Authenticate</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;




