import React from 'react';
import { MapPin, Mail, Calendar, ShieldCheck } from 'lucide-react';

const ProfileHero = ({ user, xpPercent = 65 }) => {
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';

  return (
    <div className="pd-hero pd-fade-up" style={{ animationDelay: '0.1s' }}>
      <div className="pd-hero-main">
        {/* Avatar Section */}
        <div className="pd-avatar-wrap">
          <div className="pd-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div style={{
            position: 'absolute',
            bottom: '5px',
            right: '5px',
            width: '18px',
            height: '18px',
            background: 'var(--pd-accent)',
            borderRadius: '50%',
            border: '3px solid var(--pd-surface)'
          }}></div>
        </div>

        {/* User Details */}
        <div className="pd-info">
          <h1 className="pd-name">{user?.name || 'Anonymous User'}</h1>
          <div className="pd-meta">
            <span className="pd-meta-item">
              <MapPin size={14} /> {user?.wardName || 'Unassigned Sector'}
            </span>
            <span className="pd-meta-item">
              <Mail size={14} /> {user?.email}
            </span>
            <span className="pd-meta-item">
              <Calendar size={14} /> Joined {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="pd-tags">
            {user?.role === 'moderator' && <span className="pd-tag pd-tag-mod">🛡️ Moderator</span>}
            {user?.role === 'authority' && <span className="pd-tag pd-tag-mod">🏛️ Authority</span>}
            <span className="pd-tag pd-tag-verified">✅ Verified Citizen</span>
          </div>
        </div>
      </div>

      {/* Experience / Impact Progression */}
      <div className="pd-xp-card">
        <div className="pd-xp-info">
          <span className="pd-xp-lvl">LEVEL {Math.floor((user?.stats?.impactScore || 0) / 100) + 1} IMPACT WARRIOR</span>
          <span className="pd-xp-pts">{user?.stats?.impactScore || 0} / {(Math.floor((user?.stats?.impactScore || 0) / 100) + 1) * 100} XP</span>
        </div>
        <div className="pd-xp-track">
          <div 
            className="pd-xp-fill" 
            style={{ width: `${(user?.stats?.impactScore || 0) % 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHero;
