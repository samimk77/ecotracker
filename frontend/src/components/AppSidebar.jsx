import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, Home as HomeIcon, AlertTriangle, Calendar, Film,
  Sun, Moon, User, Zap, ChevronRight, BarChart2, LogOut, Sparkles
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const getUserFromToken = () => {
  try {
    const t = localStorage.getItem('token');
    if (t) return JSON.parse(atob(t.split('.')[1]));
  } catch (_) {}
  return null;
};

const NAV_ITEMS = [
  { id: 'home',        label: 'Dashboard',   icon: HomeIcon,  route: '/'        },
  { id: 'feed',        label: 'Issues',      icon: AlertTriangle, route: '/feed'    },
  { id: 'events-page', label: 'Events',      icon: Calendar,  route: '/events'  },
  { id: 'reels',       label: 'Spotlight',   icon: Film,      route: '/reels'   },
];

const MOD_ITEM = { id: 'moderator', label: 'Terminal', icon: BarChart2, route: '/moderator' };

const ACTION_ITEMS = [
  { id: 'smart-sort', label: 'Smart Sort', icon: Sparkles, action: 'open-smart-sort', color: '#a855f7' },
];

export default function AppSidebar() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = getUserFromToken();
  const [hoveredItem, setHoveredItem] = useState(null);

  const isMod = user && (user.role === 'moderator' || user.role === 'authority' || user.role === 'admin');
  const itemsToRender = isMod ? [...NAV_ITEMS, MOD_ITEM] : NAV_ITEMS;

  return (
    <aside style={{
      width: 220, minWidth: 220, height: '100vh',
      background: 'var(--sidebar-bg)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', zIndex: 200,
      boxShadow: '4px 0 32px rgba(0,0,0,0.15)',
      flexShrink: 0, overflowY: 'auto', overflowX: 'hidden',
    }}>
      {/* ── Logo ── */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px var(--color-primary-glow)',
          }}>
            <Shield size={18} color="#000" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-text)', letterSpacing: '0.02em', lineHeight: 1 }}>THRYVE</div>
          </div>
        </Link>
      </div>

      {/* ── Navigation ── */}
      <div style={{ padding: '16px 12px 8px' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', paddingLeft: 8 }}>Navigate</span>
      </div>
      <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {itemsToRender.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.route;
          const isHov = hoveredItem === item.id;
          return (
            <Link
              key={item.id}
              to={item.route}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                background: isActive ? 'var(--color-primary-glow)' : (isHov ? 'var(--color-border)' : 'transparent'),
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                textDecoration: 'none', transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {isActive && <div style={{
                position: 'absolute', left: 0, top: '20%', height: '60%',
                width: 3, background: 'var(--color-primary)',
                borderRadius: '0 3px 3px 0',
              }} />}
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: isActive ? 'var(--color-primary-glow)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, letterSpacing: '0.01em' }}>
                {item.label}
              </span>
              {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
            </Link>
          );
        })}
      </nav>

      {/* ── Actions ── */}
      <div style={{ padding: '16px 12px 8px' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.15em', paddingLeft: 8 }}>AI Tools</span>
      </div>
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ACTION_ITEMS.map(item => {
          const Icon = item.icon;
          const isHov = hoveredItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (pathname !== '/') navigate('/');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('open:smart-sort'));
                }, 100);
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, border: 'none',
                background: isHov ? 'rgba(168,85,247,0.1)' : 'transparent',
                color: isHov ? '#a855f7' : 'var(--color-text-muted)',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: isHov ? 'rgba(168,85,247,0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={15} strokeWidth={isHov ? 2.5 : 1.8} />
              </div>
              <span style={{ fontSize: 13, fontWeight: isHov ? 700 : 500, letterSpacing: '0.01em' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Bottom controls ── */}
      <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          onMouseEnter={() => setHoveredItem('theme')}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '9px 12px', borderRadius: 10, border: 'none', width: '100%',
            background: hoveredItem === 'theme' ? 'var(--color-border)' : 'transparent',
            color: 'var(--color-text-muted)', cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </div>
          <span style={{ fontSize: 12, fontWeight: 500 }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Profile */}
        <Link
          to="/profile"
          onMouseEnter={() => setHoveredItem('profile')}
          onMouseLeave={() => setHoveredItem(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '9px 12px', borderRadius: 10, width: '100%',
            background: hoveredItem === 'profile' ? 'var(--color-border)' : 'transparent',
            color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--color-primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={14} color="var(--color-primary)" />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'My Profile'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-dim)', textTransform: 'capitalize' }}>{user?.role || 'user'}</div>
          </div>
        </Link>

        {/* Logout */}
        <button
          onMouseEnter={() => setHoveredItem('logout')}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '9px 12px', borderRadius: 10, border: 'none', width: '100%',
            background: hoveredItem === 'logout' ? 'rgba(239,68,68,0.08)' : 'transparent',
            color: hoveredItem === 'logout' ? 'var(--color-danger)' : 'var(--color-text-dim)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={14} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 500 }}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
