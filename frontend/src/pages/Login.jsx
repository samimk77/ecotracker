import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import api from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="glass-card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-glow mb-4">
            <Shield className="text-primary" size={32} />
          </div>
          <h1 className="text-3xl mb-2">Initialize Session</h1>
          <p className="text-muted text-sm uppercase tracking-widest">Secure Civic Gateway</p>
        </div>

        {error && <div className="bg-danger/10 border border-danger text-danger p-3 rounded mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex-col gap-2">
            <label className="text-xs font-bold text-muted uppercase">Terminal Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="email" 
                className="form-input pl-10" 
                placeholder="operator@ecoimpact.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex-col gap-2">
            <label className="text-xs font-bold text-muted uppercase">Access Cryptokey</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="password" 
                className="form-input pl-10" 
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full py-3 mt-2">
            Authenticate <ArrowRight size={18} className="ml-2" />
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-muted">
          New Operator? <Link to="/register" className="text-primary font-bold">Register Identity</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
