import { Link, useLocation } from 'react-router-dom';
import { Shield, Bell, User } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;

  const NavLink = ({ to, children }) => {
    const isActive = path === to;
    return (
      <Link 
        to={to} 
        style={{ 
          color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)', 
          fontWeight: isActive ? 600 : 400,
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        {children}
      </Link>
    );
  };

  return (
    <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
        <Shield size={24} />
        EcoImpact
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <NavLink to="/">Impact</NavLink>
        <NavLink to="/feed">Feed</NavLink>
        <NavLink to="/telemetry">Telemetry</NavLink>
        
        {(() => {
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const user = JSON.parse(atob(token.split('.')[1]));
              if (user.role === 'moderator' || user.role === 'authority') {
                return <NavLink to="/moderator">Terminal</NavLink>;
              }
            } catch (e) {}
          }
          return null;
        })()}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: '1rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--color-border)' }}>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
            <Bell size={20} />
          </button>
          <Link to="/profile" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem', borderRadius: '50%', color: 'var(--color-primary)' }}>
            <User size={20} />
          </Link>
          {localStorage.getItem('token') && (
            <button 
              onClick={() => { localStorage.removeItem('token'); window.location.href='/login'; }}
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: 'var(--color-danger)', 
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '0.4rem 0.8rem', 
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.1em'
              }}
            >
              LOGOUT
            </button>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
