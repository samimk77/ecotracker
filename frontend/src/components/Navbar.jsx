import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Bell, User, Clock, CheckCircle, Zap, Activity, Globe, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { io } from 'socket.io-client';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';

const T = {
  accent: 'var(--color-primary)',
  surface: 'var(--color-bg)',
  card: 'var(--color-surface)',
  border: 'var(--color-border)',
  text: 'var(--color-text)',
  muted: 'var(--color-text-muted)',
  danger: 'var(--color-danger)',
};

/* ─── MODULAR SUB-COMPONENTS ─── */

const NavbarLogo = () => (
  <Link to="/" style={{ 
    display: 'flex', alignItems: 'center', gap: '0.75rem', 
    color: T.accent, fontSize: '1.25rem', fontWeight: 800, 
    textDecoration: 'none', letterSpacing: '-0.02em' 
  }}>
    <Shield size={24} fill={T.accent} fillOpacity={0.1} />
    EcoImpact
  </Link>
);

const NavLinks = ({ currentPath, t }) => {
  const links = [
    { label: t('nav.impact'), to: '/' },
    { label: t('nav.issues'), to: '/feed' },
    { label: t('nav.events'), to: '/events' },
    { label: t('nav.spotlight'), to: '/reels' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
      {links.map((link) => {
        const isActive = currentPath === link.to;
        return (
          <Link 
            key={link.to}
            to={link.to} 
            style={{ 
              color: isActive ? T.accent : T.muted, 
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {link.label}
            {isActive && (
              <span style={{
                position: 'absolute', bottom: -21, width: '100%',
                height: 3, background: T.accent, borderRadius: '4px 4px 0 0',
                boxShadow: `0 0 12px var(--color-primary-glow)`
              }} />
            )}
          </Link>
        );
      })}
    </div>
  );
};

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button 
      onClick={toggleTheme}
      style={{ 
        display: 'flex', alignItems: 'center', gap: '6px', 
        background: 'var(--color-surface)', 
        padding: '8px', borderRadius: '10px', 
        border: `1px solid var(--color-border)`,
        color: T.accent,
        cursor: 'pointer', transition: 'all 0.2s ease',
      }}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

const NotificationCenter = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setNotifications(res.data.notifications);
          setUnreadCount(res.data.notifications.filter(n => !n.isRead).length);
        }
      } catch (err) { console.error('Notif fetch error', err); }
    };

    fetchNotifications();
    
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { withCredentials: true });
    socket.emit('join:user', user.id);
    socket.on('notification:new', (data) => {
      setNotifications(prev => [{
        _id: Date.now(),
        title: data.title,
        message: data.message,
        createdAt: new Date(),
        isRead: false,
        type: 'issue_verified'
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Listen for IoT bin:full alerts from MapboxMap
    const handleBinFull = (e) => {
      const { binId, fillLevel } = e.detail;
      setNotifications(prev => [{
        _id: Date.now() + Math.random(),
        title: `🗑️ Bin ${binId} is FULL`,
        message: `Fill level reached ${fillLevel}%. Immediate collection required.`,
        createdAt: new Date(),
        isRead: false,
        type: 'iot_alert'
      }, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    };
    window.addEventListener('bin:full:alert', handleBinFull);

    return () => {
      socket.disconnect();
      window.removeEventListener('bin:full:alert', handleBinFull);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs && unreadCount > 0) {
      try {
        await api.put('/notifications/read');
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (err) { console.error('Mark read error', err); }
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        style={{ 
          background: 'transparent', border: 'none', color: showNotifs ? T.accent : T.muted, cursor: 'pointer',
          display: 'flex', alignItems: 'center', transition: 'color 0.2s', position: 'relative'
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, width: 8, height: 8,
            background: T.danger, borderRadius: '50%', border: `2px solid var(--color-bg)`
          }} />
        )}
      </button>

      {showNotifs && (
        <div style={{
          position: 'absolute', top: 40, right: -10, width: 320,
          background: 'var(--color-surface-elevated)', border: `1px solid var(--color-border)`,
          borderRadius: 14, boxShadow: 'var(--shadow-main)',
          overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
        }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid var(--color-border)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-text)' }}>Alerts</span>
            <span style={{ fontSize: 10, color: 'var(--color-text-dim)' }}>{notifications.length} Total</span>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: T.muted, fontSize: 13 }}>No active alerts.</div>
            ) : (
              notifications.map((n, i) => (
                <div key={n._id} style={{
                  padding: '16px 20px',
                  borderBottom: i < notifications.length - 1 ? `1px solid ${T.border}` : 'none',
                  background: n.isRead ? 'transparent' : 'rgba(0, 229, 160, 0.03)'
                }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: 8, background: n.type === 'issue_verified' ? 'rgba(0, 229, 160, 0.1)' : 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {n.type === 'issue_verified' ? <Zap size={14} color={T.accent} /> : <CheckCircle size={14} color={T.muted} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 8 }}>{n.message}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const UserControls = ({ user, t }) => {
  if (!user) return (
    <Link to="/login" style={{ 
      color: T.accent, fontSize: '0.75rem', fontWeight: 800, 
      textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase'
    }}>{t('nav.login')}</Link>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <Link to="/profile" style={{ 
        background: 'rgba(0, 229, 160, 0.08)', padding: '0.4rem', 
        borderRadius: '50%', color: T.accent, border: `1px solid ${T.accent}33`, 
        display: 'flex', transition: 'all 0.2s'
      }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 229, 160, 0.15)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 229, 160, 0.08)'}>
        <User size={20} />
      </Link>
      
      <button 
        onClick={() => { localStorage.removeItem('token'); window.location.href='/login'; }}
        style={{ 
          background: 'rgba(255, 68, 102, 0.08)', color: T.danger, 
          border: `1px solid rgba(255, 68, 102, 0.2)`,
          padding: '0.5rem 1rem', borderRadius: '8px',
          fontSize: '10px', fontWeight: 800, cursor: 'pointer',
          letterSpacing: '0.15em', transition: 'all 0.2s', textTransform: 'uppercase'
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 68, 102, 0.12)'}
        onMouseLeave={(e) => e.target.style.background = 'rgba(255, 68, 102, 0.08)'}
      >
        {t('nav.logout')}
      </button>
    </div>
  );
};

/* ─── MAIN COMPONENT ─── */

const Navbar = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const { t } = useLanguage();

  return (
    <nav style={{ 
      padding: '0 2rem', height: '4.5rem',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      borderBottom: `1px solid var(--color-border)`,
      background: 'var(--color-surface)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      boxShadow: 'var(--shadow-main)',
      position: 'sticky', top: 0, zIndex: 1000,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
        <NavbarLogo />
        <NavLinks currentPath={location.pathname} t={t} />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <ThemeToggle />
        <NotificationCenter user={user} />
        <Divider />
        <UserControls user={user} t={t} />
      </div>
    </nav>
  );
};

const Divider = () => <div style={{ width: 1, height: 24, background: T.border, margin: '0 4px' }} />;

export default Navbar;
