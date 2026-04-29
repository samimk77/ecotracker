import React, { useEffect, useState } from 'react';
import { Zap, Trophy, Star, X } from 'lucide-react';

const TOKEN = {
  bg: '#05080f',
  surface: '#0d121d',
  accent: '#00e5a0',
  accentDim: 'rgba(0, 229, 160, 0.1)',
  white: '#f0f4ff',
  muted: '#8a9ab0',
  border: 'rgba(255, 255, 255, 0.08)',
};

const PointsModal = ({ points, action, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      // Auto-close after 5 seconds if user doesn't
      // setIsVisible(false);
      // setTimeout(onClose, 500);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!points) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2, 4, 8, 0.85)',
      backdropFilter: 'blur(10px)',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.4s ease',
    }}>
      <style>{`
        @keyframes modalEnter {
          from { transform: scale(0.8) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes shine {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes particle {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--x), var(--y)) scale(0); opacity: 0; }
        }
      `}</style>

      <div style={{
        width: 380,
        background: TOKEN.surface,
        borderRadius: 24,
        border: `1px solid ${TOKEN.accent}`,
        boxShadow: `0 24px 64px rgba(0, 229, 160, 0.15), inset 0 0 20px rgba(0, 229, 160, 0.05)`,
        padding: '40px 32px',
        position: 'relative',
        animation: 'modalEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Shine effect */}
        <div style={{
          position: 'absolute',
          top: 0, height: '100%', width: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(0, 229, 160, 0.1), transparent)',
          animation: 'shine 3s infinite linear',
        }} />

        {/* Close Button */}
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 400);
          }}
          style={{
            position: 'absolute', top: 20, right: 20,
            background: 'transparent', border: 'none', color: TOKEN.muted,
            cursor: 'pointer', zIndex: 2
          }}
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: TOKEN.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: `0 0 30px ${TOKEN.accent}`,
          animation: 'float 3s infinite ease-in-out',
          position: 'relative',
          zIndex: 1
        }}>
          <Zap size={40} color="#000" fill="#000" />
        </div>

        {/* Text Content */}
        <h2 style={{
          fontSize: 14, fontWeight: 800, color: TOKEN.accent,
          letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 8px'
        }}>
          Impact Awarded
        </h2>
        <div style={{
          fontSize: 48, fontWeight: 900, color: TOKEN.white,
          letterSpacing: '-0.04em', margin: '0 0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
        }}>
          <span style={{ color: TOKEN.accent }}>+</span>
          {points}
          <span style={{ fontSize: 18, color: TOKEN.muted, fontWeight: 700, letterSpacing: '0' }}>XP</span>
        </div>

        <p style={{
          fontSize: 14, color: TOKEN.muted, lineHeight: 1.6,
          margin: '0 0 32px'
        }}>
          {action === 'report' ? (
            <>Outstanding contribution! Your report helps maintain tactical oversight of <b>Indiranagar Ward</b>.</>
          ) : action === 'event' ? (
            <>Mission accomplished! Your participation has directly improved the ecological health of the sector.</>
          ) : action === 'verify' ? (
            <>Field verification complete! You've confirmed a local anomaly, providing critical data for sector command.</>
          ) : (
            <>You've earned impact points for your contribution to the community.</>
          )}
        </p>

        {/* Action Button */}
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 400);
          }}
          style={{
            width: '100%',
            padding: '16px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${TOKEN.border}`,
            borderRadius: 12,
            color: TOKEN.white,
            fontSize: 11, fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            zIndex: 1
          }}
          onMouseEnter={(e) => e.target.style.borderColor = TOKEN.accent}
          onMouseLeave={(e) => e.target.style.borderColor = TOKEN.border}
        >
          Collect Points
        </button>

        {/* Particles decor */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 4, height: 4, borderRadius: '50%',
            background: TOKEN.accent,
            '--x': `${(Math.random() - 0.5) * 400}px`,
            '--y': `${(Math.random() - 0.5) * 400}px`,
            animation: 'particle 1s ease-out infinite'
          }} />
        ))}
      </div>
    </div>
  );
};

export default PointsModal;
