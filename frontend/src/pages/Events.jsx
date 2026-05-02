import { useState, useEffect, useRef } from 'react';
import {
  Calendar, MapPin, Clock, Users, Plus, Search, Filter,
  Trophy, MessageSquare, Shield, ArrowRight, Zap, TrendingUp,
  Info, X, Check, ChevronRight, Activity, Flame, Star, Share2, Bookmark, Map
} from 'lucide-react';
import PointsModal from '../components/PointsModal';
import LeafletMap from '../components/LeafletMap';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const LIBRARIES = ['places'];

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const TOKEN = {
  bg: '#07090f',
  surface: '#0e1118',
  card: '#111620',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  accent: '#00e5a0',
  accentDim: 'rgba(0,229,160,0.1)',
  accentGlow: 'rgba(0,229,160,0.2)',
  danger: '#ff4d4d',
  muted: 'rgba(255,255,255,0.35)',
  mutedMid: 'rgba(255,255,255,0.55)',
  white: '#ffffff',
};

/* ─────────────────────────────────────────────
   SAMPLE DATA
───────────────────────────────────────────── */
const CATEGORIES = ['All', 'Cleanup', 'Town Hall', 'Plantation', 'Awareness', 'Drive', 'Inspection'];
const TABS = ['upcoming', 'live', 'past', 'mine'];

const BACKEND_CAT_MAP = {
  'Plantation': 'tree_plantation',
  'Cleanup': 'cleanup',
  'Awareness': 'awareness',
  'Drive': 'recycling',
  'Inspection': 'water_conservation',
  'Town Hall': 'other'
};

const REVERSE_CAT_MAP = {
  'tree_plantation': 'Plantation',
  'cleanup': 'Cleanup',
  'awareness': 'Awareness',
  'recycling': 'Drive',
  'water_conservation': 'Inspection',
  'other': 'Town Hall'
};

const CAT_COLOR = {
  'Town Hall':  { bg: 'rgba(168,85,247,0.1)', text: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  'Plantation': { bg: 'rgba(0,229,160,0.08)', text: '#00e5a0', border: 'rgba(0,229,160,0.2)' },
  'Awareness':  { bg: 'rgba(251,146,60,0.1)', text: '#fb923c', border: 'rgba(251,146,60,0.25)' },
  'Cleanup':    { bg: 'rgba(56,189,248,0.1)', text: '#38bdf8', border: 'rgba(56,189,248,0.25)' },
  'Drive':      { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  'Inspection': { bg: 'rgba(239,68,68,0.1)', text: '#f87171', border: 'rgba(239,68,68,0.25)' },
};

/* ─────────────────────────────────────────────
   ATOMS
───────────────────────────────────────────── */
const CategoryBadge = ({ cat }) => {
  const c = CAT_COLOR[cat] || { bg: 'rgba(255,255,255,0.08)', text: TOKEN.mutedMid, border: TOKEN.border };
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4,
    }}>{cat}</span>
  );
};

const XPBadge = ({ xp }) => (
  <span style={{
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'rgba(0,229,160,0.08)', color: TOKEN.accent,
    border: `1px solid rgba(0,229,160,0.2)`,
    fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
    textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4,
  }}>
    <Star size={9} /> +{xp} XP
  </span>
);

const LivePill = () => (
  <span style={{
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(255,77,77,0.1)', color: TOKEN.danger,
    border: `1px solid rgba(255,77,77,0.25)`,
    fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
    textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4,
  }}>
    <span style={{
      width: 6, height: 6, borderRadius: '50%',
      background: TOKEN.danger,
      animation: 'livePulse 1.4s ease-in-out infinite',
      display: 'inline-block',
    }} />
    LIVE
  </span>
);

const ProgressBar = ({ value, total }) => {
  const pct = Math.min(100, Math.round((value / total) * 100));
  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 2,
          background: `linear-gradient(90deg, ${TOKEN.accent}, rgba(0,229,160,0.6))`,
          transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
    </div>
  );
};

const MetaRow = ({ icon: Icon, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: TOKEN.muted, fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>
    <Icon size={11} color={TOKEN.accent} />
    {label}
  </div>
);

/* ─────────────────────────────────────────────
   MODULE: EVENT CARD
───────────────────────────────────────────── */
const EventCard = ({ event, onRsvp, onDetail }) => {
  const [hover, setHover] = useState(false);
  const isPast = event.status === 'past';
  const isLive = event.status === 'live';

  return (
    <div
      onClick={() => onDetail(event)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: TOKEN.card,
        border: `1px solid ${hover ? (isLive ? 'rgba(255,77,77,0.35)' : TOKEN.borderHover) : (isLive ? 'rgba(255,77,77,0.2)' : TOKEN.border)}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Card top strip */}
      <div style={{
        padding: '20px 20px 16px',
        background: hover
          ? 'linear-gradient(135deg, rgba(0,229,160,0.04) 0%, transparent 100%)'
          : 'transparent',
        transition: 'background 0.3s',
        borderBottom: `1px solid ${TOKEN.border}`,
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <CategoryBadge cat={event.cat} />
            {isLive && <LivePill />}
            {!isLive && <XPBadge xp={event.xp} />}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1, opacity: hover ? 1 : 0.5, transition: 'opacity 0.2s, transform 0.2s', transform: hover ? 'scale(1.1)' : 'scale(1)' }}>
            {event.emoji}
          </div>
        </div>

        <h3 style={{
          margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
          color: hover ? TOKEN.white : TOKEN.mutedMid,
          transition: 'color 0.2s',
          lineHeight: 1.3,
        }}>
          {event.title}
        </h3>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: TOKEN.muted, lineHeight: 1.55, fontWeight: 400,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {event.desc}
        </p>
      </div>

      {/* Card meta */}
      <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MetaRow icon={Calendar} label={event.date} />
          <MetaRow icon={Clock} label={event.time} />
          <MetaRow icon={MapPin} label={event.ward} />
          <MetaRow icon={Users} label={`${event.reg} joined`} />
        </div>

        <div style={{ marginTop: 4 }}>
          <ProgressBar value={event.reg} total={event.total} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: TOKEN.muted }}>
            <span style={{ fontWeight: 600 }}>{event.reg} responders</span>
            <span style={{ color: TOKEN.accent, fontWeight: 700 }}>{Math.round((event.reg / event.total) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: `1px solid ${TOKEN.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', 
            border: `1px solid ${TOKEN.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: TOKEN.accent,
            overflow: 'hidden'
          }}>
            {event.organizer?.avatar ? (
              <img src={event.organizer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              event.owner.charAt(0)
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 8, color: TOKEN.muted, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Organized by</span>
            <span style={{ fontSize: 11, color: TOKEN.white, fontWeight: 600 }}>{event.owner}</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); if (!isPast) onRsvp(event.id); }}
          style={{
            padding: '6px 14px', borderRadius: 7, border: 'none',
            fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
            textTransform: 'uppercase', cursor: isPast ? 'default' : 'pointer',
            transition: 'all 0.18s',
            background: isPast
              ? 'rgba(255,255,255,0.04)'
              : event.rsvped
                ? TOKEN.accentDim
                : TOKEN.accent,
            color: isPast ? TOKEN.muted : event.rsvped ? TOKEN.accent : '#000',
            outline: event.rsvped && !isPast ? `1px solid rgba(0,229,160,0.3)` : 'none',
          }}
        >
          {isPast ? 'Ended' : event.rsvped ? '✓ Joined' : 'RSVP'}
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MODULE: SIDEBAR
───────────────────────────────────────────── */
const Sidebar = ({ selected, onSelect, user, events }) => (
  <aside style={{
    width: 220, flexShrink: 0,
    background: TOKEN.surface,
    borderRight: `1px solid ${TOKEN.border}`,
    display: 'flex', flexDirection: 'column',
    padding: '28px 0',
  }}>
    {/* Brand */}
    <div style={{ padding: '0 20px 24px', borderBottom: `1px solid ${TOKEN.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: TOKEN.accentDim,
          border: `1px solid rgba(0,229,160,0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Activity size={15} color={TOKEN.accent} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em', color: TOKEN.white }}>CivicPulse</span>
      </div>
      <p style={{ margin: 0, fontSize: 10, color: TOKEN.muted, fontWeight: 600, letterSpacing: '0.08em' }}>Ward 84 · Bengaluru</p>
    </div>

    {/* User card */}
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${TOKEN.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: TOKEN.accentDim, border: `1px solid rgba(0,229,160,0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: TOKEN.accent,
          overflow: 'hidden'
        }}>
          {user?.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.name?.charAt(0) || 'U')}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: TOKEN.white }}>{user?.name || 'Authorized User'}</div>
          <div style={{ fontSize: 10, color: TOKEN.accent, fontWeight: 600, letterSpacing: '0.06em' }}>{user?.role?.toUpperCase() || 'CITIZEN'}</div>
        </div>
      </div>
    </div>

    {/* Categories */}
    <div style={{ padding: '20px 20px 0', flex: 1 }}>
      <p style={{ margin: '0 0 10px 4px', fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: TOKEN.muted, textTransform: 'uppercase' }}>
        Filter by type
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {CATEGORIES.map(cat => {
          const active = selected === cat;
          const c = CAT_COLOR[cat];
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: active ? (c ? c.bg : TOKEN.accentDim) : 'transparent',
                color: active ? (c ? c.text : TOKEN.accent) : TOKEN.muted,
                fontSize: 12, fontWeight: active ? 700 : 500,
                transition: 'all 0.15s',
                outline: active && c ? `1px solid ${c.border}` : 'none',
              }}
            >
              {cat}
              {active && <ChevronRight size={12} />}
            </button>
          );
        })}
      </div>
    </div>

    {/* Stats block */}
    <div style={{ padding: '16px 20px 0', marginTop: 'auto' }}>
      <div style={{
        background: TOKEN.accentDim,
        border: `1px solid rgba(0,229,160,0.15)`,
        borderRadius: 10, padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Flame size={13} color={TOKEN.accent} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: TOKEN.accent }}>
            Impact
          </span>
        </div>
        {[[user?.stats?.impactScore || '0', 'Impact Points'], [events.filter(e => e.rsvped).length, 'Joined Events']].map(([v, l]) => (
          <div key={l} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: TOKEN.white, letterSpacing: '-0.03em', lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 9, color: TOKEN.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{l}</div>
          </div>
        ))}
        <div style={{ borderTop: `1px solid rgba(0,229,160,0.15)`, paddingTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
          <TrendingUp size={11} color={TOKEN.accent} />
          <span style={{ fontSize: 9, fontWeight: 700, color: TOKEN.accent, letterSpacing: '0.06em' }}>+12% this month</span>
        </div>
      </div>
    </div>
  </aside>
);

/* ─────────────────────────────────────────────
   MODULE: TAB BAR
───────────────────────────────────────────── */
const TabBar = ({ active, onChange }) => (
  <div style={{
    display: 'flex', gap: 0, borderBottom: `1px solid ${TOKEN.border}`,
    padding: '0 24px',
    background: TOKEN.surface,
  }}>
    {TABS.map(tab => {
      const isActive = active === tab;
      return (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: '14px 18px', border: 'none', background: 'transparent',
            cursor: 'pointer', position: 'relative',
            fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: isActive ? TOKEN.accent : TOKEN.muted,
            transition: 'color 0.18s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {tab === 'live' && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: TOKEN.danger,
              animation: 'livePulse 1.4s ease-in-out infinite',
              display: 'inline-block',
            }} />
          )}
          {tab}
          {isActive && (
            <span style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 2, background: TOKEN.accent, borderRadius: 2,
              boxShadow: `0 0 10px ${TOKEN.accentGlow}`,
            }} />
          )}
        </button>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────────
   MODULE: SEARCH BAR
───────────────────────────────────────────── */
const SearchBar = ({ value, onChange, onCreate }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 24px',
    borderBottom: `1px solid ${TOKEN.border}`,
    background: TOKEN.surface,
  }}>
    <div style={{ position: 'relative', flex: 1 }}>
      <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: TOKEN.muted }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search events, wards, organizers…"
        style={{
          width: '100%', padding: '9px 12px 9px 34px', borderRadius: 9,
          background: TOKEN.card, border: `1px solid ${TOKEN.border}`,
          color: TOKEN.white, fontSize: 12, outline: 'none',
          boxSizing: 'border-box', fontFamily: 'inherit',
        }}
      />
    </div>
    <button
      onClick={onCreate}
      style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
        background: TOKEN.accent, color: '#000', border: 'none',
        borderRadius: 9, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
        textTransform: 'uppercase', cursor: 'pointer',
        boxShadow: `0 0 20px ${TOKEN.accentGlow}`,
        transition: 'all 0.18s',
        whiteSpace: 'nowrap',
      }}
    >
      <Plus size={13} /> New Event
    </button>
  </div>
);

/* ─────────────────────────────────────────────
   MODULE: EMPTY STATE
───────────────────────────────────────────── */
const EmptyState = ({ onReset }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 14, padding: 60 }}>
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: TOKEN.card, border: `1px solid ${TOKEN.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Info size={24} color={TOKEN.muted} />
    </div>
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: TOKEN.white }}>No events found</h3>
      <p style={{ margin: 0, fontSize: 12, color: TOKEN.muted, maxWidth: 260, lineHeight: 1.6 }}>
        Try adjusting your filters or search query to find active community events.
      </p>
    </div>
    <button
      onClick={onReset}
      style={{
        background: 'transparent', border: `1px solid rgba(0,229,160,0.3)`,
        color: TOKEN.accent, padding: '8px 20px', borderRadius: 8,
        fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
        textTransform: 'uppercase', cursor: 'pointer',
      }}
    >
      Reset filters
    </button>
  </div>
);

/* ─────────────────────────────────────────────
   MODULE: DETAIL MODAL
───────────────────────────────────────────── */
const DetailModal = ({ event, onClose, onRsvp }) => {
  if (!event) return null;
  const isPast = event.status === 'past';
  const pct = Math.round((event.reg / event.total) * 100);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }} />
      <div style={{
        position: 'relative', zIndex: 10000, width: '100%', maxWidth: 680,
        background: TOKEN.card, border: `1px solid ${TOKEN.border}`,
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Modal header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: `1px solid ${TOKEN.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          background: 'linear-gradient(135deg, rgba(0,229,160,0.04) 0%, transparent 60%)',
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>{event.emoji}</div>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <CategoryBadge cat={event.cat} />
                {event.status === 'live' && <LivePill />}
                <XPBadge xp={event.xp} />
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: TOKEN.white, lineHeight: 1.2 }}>
                {event.title}
              </h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${TOKEN.border}`, borderRadius: 8, padding: 7, cursor: 'pointer', color: TOKEN.muted, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left: description + meta */}
          <div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: TOKEN.mutedMid, lineHeight: 1.7, fontWeight: 400 }}>{event.desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: Calendar, label: 'Date', value: event.date },
                { icon: Clock, label: 'Time', value: event.time },
                { icon: MapPin, label: 'Venue', value: event.venue },
                { icon: Shield, label: 'Ward', value: event.ward },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: TOKEN.accentDim, border: `1px solid rgba(0,229,160,0.15)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={13} color={TOKEN.accent} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: TOKEN.muted, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ fontSize: 13, color: TOKEN.white, fontWeight: 600 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: progress + action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: TOKEN.surface, border: `1px solid ${TOKEN.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: TOKEN.muted, marginBottom: 16 }}>
                Participation
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: TOKEN.white, letterSpacing: '-0.04em', lineHeight: 1 }}>{event.reg}</div>
                  <div style={{ fontSize: 10, color: TOKEN.muted, marginTop: 4 }}>of {event.total} slots</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: TOKEN.accent }}>{pct}%</div>
              </div>
              <ProgressBar value={event.reg} total={event.total} />
            </div>

            <div style={{ background: TOKEN.accentDim, border: `1px solid rgba(0,229,160,0.15)`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: TOKEN.accent, marginBottom: 6 }}>XP Reward</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: TOKEN.white }}>+{event.xp} XP</div>
              <div style={{ fontSize: 10, color: TOKEN.muted, marginTop: 4 }}>Includes verified contribution bonus</div>
            </div>

            <button
              onClick={() => { if (!isPast) onRsvp(event.id); }}
              style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: isPast ? 'default' : 'pointer',
                background: isPast
                  ? 'rgba(255,255,255,0.05)'
                  : event.rsvped
                    ? TOKEN.accentDim
                    : TOKEN.accent,
                color: isPast ? TOKEN.muted : event.rsvped ? TOKEN.accent : '#000',
                outline: event.rsvped && !isPast ? `1px solid rgba(0,229,160,0.3)` : 'none',
                transition: 'all 0.2s',
              }}
            >
              {isPast ? 'Event Ended' : event.rsvped ? '✓ You Are Registered' : 'RSVP to this Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MODULE: CREATE MODAL
───────────────────────────────────────────── */
const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 9,
  background: TOKEN.surface, border: `1px solid ${TOKEN.border}`,
  color: TOKEN.white, fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const labelStyle = {
  fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
  textTransform: 'uppercase', color: TOKEN.muted,
  display: 'block', marginBottom: 6,
};

const CreateModal = ({ onClose, data, setData, onSubmit }) => {
  const autocompleteRef = useRef(null);

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setData({
          ...data,
          venue: place.formatted_address || place.name,
          lat: lat.toFixed(6),
          lng: lng.toFixed(6)
        });
      }
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }} />
      <div style={{
        position: 'relative', zIndex: 10000, width: '100%', maxWidth: 520,
        background: TOKEN.card, border: `1px solid ${TOKEN.border}`,
        borderRadius: 18, overflow: 'hidden',
      }}>
      {/* Header */}
      <div style={{
        padding: '22px 28px', borderBottom: `1px solid ${TOKEN.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, background: TOKEN.accentDim,
            border: `1px solid rgba(0,229,160,0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={16} color={TOKEN.accent} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: TOKEN.white, letterSpacing: '-0.02em' }}>New Initiative</div>
            <div style={{ fontSize: 10, color: TOKEN.muted, fontWeight: 500 }}>Create a community event</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: TOKEN.muted, cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {/* Form */}
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18, maxHeight: 480, overflowY: 'auto' }}>
        <div>
          <label style={labelStyle}>Initiative Title</label>
          <input 
            type="text" 
            placeholder="e.g. Ward 84 Pipeline Audit" 
            style={inputStyle} 
            value={data.title}
            onChange={(e) => setData({...data, title: e.target.value})}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select 
              style={{ ...inputStyle, appearance: 'none' }}
              value={data.category}
              onChange={(e) => setData({...data, category: e.target.value})}
            >
              {Object.entries(BACKEND_CAT_MAP).map(([label, value]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Capacity</label>
            <input 
              type="number" 
              style={inputStyle} 
              value={data.capacity}
              onChange={(e) => setData({...data, capacity: parseInt(e.target.value)})}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea 
            placeholder="Outline the objective and requirements..." 
            style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} 
            value={data.description}
            onChange={(e) => setData({...data, description: e.target.value})}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Start Date & Time</label>
            <input 
              type="datetime-local" 
              style={inputStyle} 
              value={data.date}
              onChange={(e) => setData({...data, date: e.target.value})}
            />
          </div>
          <div>
            <label style={labelStyle}>End Date & Time</label>
            <input 
              type="datetime-local" 
              style={inputStyle} 
              value={data.endDate}
              onChange={(e) => setData({...data, endDate: e.target.value})}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Venue / Location Search</label>
            <Autocomplete
              onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
              onPlaceChanged={onPlaceChanged}
            >
              <input 
                type="text" 
                placeholder="Search for a location via Google Maps..." 
                style={inputStyle} 
                value={data.venue}
                onChange={(e) => setData({...data, venue: e.target.value})}
              />
            </Autocomplete>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Sector / Ward</label>
            <input 
              type="text" 
              placeholder="e.g. Ward 84, Indiranagar" 
              style={inputStyle} 
              value={data.wardName}
              onChange={(e) => setData({...data, wardName: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '18px 28px', borderTop: `1px solid ${TOKEN.border}`,
        display: 'flex', gap: 12,
      }}>
        <button onClick={onClose} style={{
          flex: 1, padding: '12px', borderRadius: 9,
          background: 'transparent', border: `1px solid ${TOKEN.border}`,
          color: TOKEN.muted, fontSize: 10, fontWeight: 800,
          letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
        }}>
          Cancel
        </button>
        <button 
          onClick={onSubmit}
          style={{
            flex: 1, padding: '12px', borderRadius: 9,
            background: TOKEN.accent, border: 'none',
            color: '#000', fontSize: 10, fontWeight: 800,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
            boxShadow: `0 0 20px ${TOKEN.accentGlow}`,
          }}
        >
          Deploy Initiative
        </button>
      </div>
    </div>
  </div>
);
};

/* ─────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────── */
const Events = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES
  });

  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [awardedPoints, setAwardedPoints] = useState(null);
  const [awardAction, setAwardAction] = useState(null);
  const navigate = useNavigate();

  // Create Form State
  const [newMission, setNewMission] = useState({
    title: '',
    category: 'cleanup',
    description: '',
    date: '',
    endDate: '',
    venue: '',
    wardName: '',
    lat: '',
    lng: '',
    capacity: 50,
    fundingGoal: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const userRes = await api.get('/auth/me');
      if (userRes.data.success) {
        setUser(userRes.data.user);
      }
      const eventsRes = await api.get('/events');
      if (eventsRes.data.success) {
        // Map backend data to frontend format
        const mapped = eventsRes.data.events.map(e => ({
          ...e,
          id: e._id,
          emoji: e.category === 'tree_plantation' ? '🌱' : e.category === 'cleanup' ? '🧹' : e.category === 'awareness' ? '💨' : '🏛',
          cat: REVERSE_CAT_MAP[e.category] || 'Other',
          date: new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: new Date(e.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          venue: e.address || 'Global Sector',
          ward: e.wardName || 'Ward 84',
          xp: 50,
          reg: e.participantCount || 0,
          total: e.capacity || 100,
          owner: e.organizer?.name || 'Admin',
          ownerId: e.organizer?._id || e.organizer,
          rsvped: e.hasJoined,
          status: e.status === 'ongoing' ? 'live' : e.status === 'completed' ? 'past' : 'upcoming'
        }));
        setEvents(mapped);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(e => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || e.ward.toLowerCase().includes(q) || e.owner.toLowerCase().includes(q);
    const matchCat = selectedCategory === 'All' || e.cat === selectedCategory;
    const matchTab = activeTab === 'mine'
      ? (e.ownerId === user?._id || e.rsvped)
      : e.status === activeTab;
    return matchSearch && matchCat && matchTab;
  });

  const handleRsvp = async (id) => {
    try {
      const res = await api.post(`/events/${id}/join`);
      const joined = res.data.joined;
      const count = res.data.participantCount;

      setEvents(prev => prev.map(e =>
        e.id === id ? { ...e, rsvped: joined, reg: count } : e
      ));

      if (detailEvent?.id === id) {
        setDetailEvent(prev => ({ ...prev, rsvped: joined, reg: count }));
      }

      if (res.data.pointsGained > 0) {
        setAwardedPoints(res.data.pointsGained);
        setAwardAction('event');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update RSVP');
    }
  };

  const handleCreateMission = async () => {
    try {
      // For demo, we use user's location if available
      const lat = user?.location?.coordinates[1] || 12.9716;
      const lng = user?.location?.coordinates[0] || 77.5946;

      const res = await api.post('/events', {
        ...newMission,
        lat,
        lng,
        address: newMission.venue
      });

      if (res.data.success) {
        setCreateOpen(false);
        fetchInitialData(); // Refresh list

        if (res.data.pointsGained > 0) {
          setAwardedPoints(res.data.pointsGained);
          setAwardAction('event');
        }

        setNewMission({
          title: '',
          category: 'cleanup',
          description: '',
          date: '',
          endDate: '',
          venue: '',
          wardName: '',
          lat: '',
          lng: '',
          capacity: 50,
          fundingGoal: 0
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create mission');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: TOKEN.bg, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <Activity size={40} color={TOKEN.accent} className="animate-pulse" />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.4em', color: TOKEN.accent }}>SYNCHRONIZING_CORE...</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: TOKEN.bg, color: TOKEN.white, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        select option { background: #111620; color: #fff; }
        
        /* Calendar Icon Visibility */
        input::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.5;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        input::-webkit-calendar-picker-indicator:hover {
          opacity: 0.9;
        }
      `}</style>

      {/* ── Sidebar ── */}
      <Sidebar selected={selectedCategory} onSelect={setSelectedCategory} user={user} events={events} />

      {/* ── Map Panel (left) + Events Content (center) ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Leaflet Map Panel — fixed left column ── */}
        <div style={{
          width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${TOKEN.border}`, position: 'relative',
        }}>
          {/* Map label */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 1000,
            background: 'rgba(11,15,26,0.85)', backdropFilter: 'blur(8px)',
            border: `1px solid ${TOKEN.border}`, borderRadius: 8,
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: TOKEN.accent,
            textTransform: 'uppercase',
          }}>
            <Map size={12} />
            {events.length} Events On Map
          </div>
          <LeafletMap
            center={{ lat: 12.9716, lng: 77.5946 }}
            data={events.map(e => ({ ...e, location: e.location || { coordinates: [77.5946, 12.9716] } }))}
            type="events"
          />
        </div>

        {/* ── Events Content — center ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} onCreate={() => setCreateOpen(true)} />
          <TabBar active={activeTab} onChange={setActiveTab} />

          {/* Content area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {/* Hero banner — only on upcoming + no filter */}
            {activeTab === 'upcoming' && !searchQuery && selectedCategory === 'All' && (
              <div style={{
                marginBottom: 24, padding: '28px 32px',
                background: 'linear-gradient(135deg, rgba(0,229,160,0.08) 0%, rgba(0,229,160,0.02) 50%, transparent 100%)',
                border: `1px solid rgba(0,229,160,0.12)`,
                borderRadius: 16, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,229,160,0.04)', pointerEvents: 'none' }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: TOKEN.accent, textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                  Community Action
                </span>
                <h2 style={{ margin: '0 0 10px', fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: TOKEN.white, lineHeight: 1.1 }}>
                  Monitor · Report · Resolve
                </h2>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: TOKEN.muted, maxWidth: 480, lineHeight: 1.65 }}>
                  Join verified community initiatives in your ward. Earn XP, contribute to official records, and help make Bengaluru better.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
                    background: TOKEN.accent, color: '#000', border: 'none',
                    borderRadius: 9, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
                    textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    <Zap size={13} /> Quick Join
                  </button>
                  <button style={{
                    padding: '10px 20px', background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${TOKEN.border}`, color: TOKEN.mutedMid,
                    borderRadius: 9, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    Learn More
                  </button>
                </div>
              </div>
            )}

            {filteredEvents.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {filteredEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRsvp={handleRsvp}
                    onDetail={setDetailEvent}
                  />
                ))}
              </div>
            ) : (
              <EmptyState onReset={() => { setSearchQuery(''); setSelectedCategory('All'); }} />
            )}
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {detailEvent && <DetailModal event={detailEvent} onClose={() => setDetailEvent(null)} onRsvp={handleRsvp} />}
      {createOpen && (
        <CreateModal 
          onClose={() => setCreateOpen(false)} 
          data={newMission}
          setData={setNewMission}
          onSubmit={handleCreateMission}
        />
      )}

      {awardedPoints && (
        <PointsModal 
          points={awardedPoints} 
          action={awardAction} 
          onClose={() => {
            setAwardedPoints(null);
            setAwardAction(null);
          }} 
        />
      )}
    </div>
  );
};

export default Events;
