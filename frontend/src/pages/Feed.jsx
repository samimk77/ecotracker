import { useState, useEffect, useMemo } from 'react';
import {
  Camera, MapPin, Share2, AlertCircle, ThumbsUp, ThumbsDown,
  ShieldCheck, Play, Video, Activity, Wifi, Radio,
  TrendingUp, Zap, Clock, Filter, X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import api from '../api';
import CreateIssueModal from '../components/CreateIssueModal';
import LeafletMap from '../components/LeafletMap';
import toast from 'react-hot-toast';
import { buildMergedWards } from '../components/wardAggregation';
import PointsModal from '../components/PointsModal';

/* ─────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────── */
const T = {
  bg: '#060810',
  surface: '#0b0f1a',
  card: '#0f1420',
  cardHover: '#131929',
  border: 'rgba(255,255,255,0.05)',
  borderMid: 'rgba(255,255,255,0.09)',
  accent: '#00e5a0',
  accentDim: 'rgba(0,229,160,0.08)',
  accentBorder: 'rgba(0,229,160,0.18)',
  danger: '#ff4466',
  dangerDim: 'rgba(255,68,102,0.08)',
  amber: '#f5a623',
  white: '#f0f4ff',
  muted: 'rgba(255,255,255,0.55)',
  mutedMid: 'rgba(255,255,255,0.75)',
};

/* ─────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────── */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const rad = (deg) => (deg * Math.PI) / 180;
  const φ1 = rad(lat1);
  const φ2 = rad(lat2);
  const Δφ = rad(lat2 - lat1);
  const Δλ = rad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const getUserFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (token) return JSON.parse(atob(token.split('.')[1]));
  } catch (_) { }
  return null;
};

const fmt = (date) => new Intl.DateTimeFormat('en-IN', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
}).format(new Date(date));

/* ─────────────────────────────────────────────────────────
   ATOMS
───────────────────────────────────────────────────────── */
const Divider = ({ axis = 'h', style = {} }) =>
  axis === 'h'
    ? <div style={{ height: 1, background: T.border, ...style }} />
    : <div style={{ width: 1, background: T.border, alignSelf: 'stretch', ...style }} />;

const Pill = ({ children, color = T.accent, bg = T.accentDim, border = T.accentBorder }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 10, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase',
    padding: '4px 11px', borderRadius: 5,
    color, background: bg, border: `1px solid ${border}`,
  }}>{children}</span>
);

const LiveDot = ({ color = T.accent, size = 7 }) => (
  <span style={{
    display: 'inline-block', width: size, height: size,
    borderRadius: '50%', background: color, flexShrink: 0,
    animation: 'pulseGlow 1.6s ease-in-out infinite',
  }} />
);

const SectionLabel = ({ children }) => (
  <p style={{
    margin: '0 0 14px', fontSize: 11, fontWeight: 800,
    letterSpacing: '0.2em', textTransform: 'uppercase', color: T.muted,
  }}>{children}</p>
);

const StatRow = ({ label, value, accent = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: '0.06em' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 800, color: accent ? T.accent : T.white, letterSpacing: '0.04em' }}>{value}</span>
  </div>
);

const ProgressBar = ({ value = 65 }) => (
  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
    <div style={{
      height: '100%', width: `${value}%`, borderRadius: 2,
      background: `linear-gradient(90deg, ${T.accent}, rgba(0,229,160,0.5))`,
    }} />
  </div>
);

/* ─────────────────────────────────────────────────────────
   MODULE: STATUS TIMELINE
───────────────────────────────────────────────────────── */
const STEPS = ['Submitted', 'Verified', 'Escalated', 'Resolved'];
const getStatusIdx = (s) => ({ open: 1, verified: 2, escalated: 3, resolved: 4 }[s] || 1);

const StatusTimeline = ({ status }) => {
  const idx = getStatusIdx(status);
  return (
    <div style={{ display: 'flex', gap: 6, width: '100%' }}>
      {STEPS.map((step, i) => {
        const done = i < idx;
        const current = i === idx - 1;
        return (
          <div key={step} style={{ flex: 1 }}>
            <div style={{
              height: 3, borderRadius: 2, marginBottom: 6,
              background: done ? T.accent : 'rgba(255,255,255,0.07)',
              boxShadow: current ? `0 0 8px ${T.accent}` : 'none',
              opacity: done ? 1 : 0.4,
            }} />
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: current ? T.accent : 'rgba(255,255,255,0.85)',
            }}>{step}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MODULE: VOTE BAR
───────────────────────────────────────────────────────── */
const VoteBar = ({ issue, user, location, onUpvote, onDislike, onVerify }) => {
  const isMod = user && (user.role === 'moderator' || user.role === 'authority');
  const dist = location?.lat && issue.location?.coordinates
    ? getDistance(location.lat, location.lng, issue.location.coordinates[1], issue.location.coordinates[0])
    : null;
  const isNear = dist !== null && dist <= 1000;

  const btnBase = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8, border: 'none',
    fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
    textTransform: 'uppercase', cursor: 'pointer',
    transition: 'all 0.18s', fontFamily: 'inherit',
  };

  if (isMod) {
    return (
      <div style={{
        display: 'flex', gap: 10, padding: '8px 14px',
        background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
        borderRadius: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <ThumbsUp size={13} color={T.muted} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>{issue.upvoteCount || 0}</span>
        </div>
        <Divider axis="v" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <ThumbsDown size={13} color={T.danger} style={{ opacity: 0.5 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>{issue.dislikeCount || 0}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={onUpvote}
        style={{
          ...btnBase,
          background: issue.hasUpvoted ? T.accent : 'rgba(255,255,255,0.05)',
          color: issue.hasUpvoted ? '#000' : T.muted,
          border: issue.hasUpvoted ? 'none' : `1px solid ${T.border}`,
        }}
      >
        <ThumbsUp size={13} /> {issue.upvoteCount || 0}
      </button>

      <button
        onClick={onDislike}
        style={{
          ...btnBase,
          background: issue.hasDisliked ? T.danger : 'rgba(255,255,255,0.05)',
          color: issue.hasDisliked ? '#fff' : T.muted,
          border: issue.hasDisliked ? 'none' : `1px solid ${T.border}`,
        }}
        title="20 dislikes from local users will delete this report"
      >
        <ThumbsDown size={13} /> {issue.dislikeCount || 0}
      </button>

      {!isNear && dist !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: '0.08em' }}>
          <MapPin size={13} color={T.accent} />
          {(dist / 1000).toFixed(1)} km away
        </div>
      )}

      {isNear && (
        <button
          onClick={onVerify}
          style={{
            ...btnBase,
            background: issue.userVerification === 'verify' ? T.accentDim : 'rgba(255,255,255,0.05)',
            color: T.accent,
            border: `1px solid ${T.accentBorder}`,
          }}
        >
          <ShieldCheck size={13} /> Approve ({issue.verificationCount || 0})
        </button>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MODULE: MOD CONTROLS
───────────────────────────────────────────────────────── */
const ModControls = ({ issue, onModerate }) => (
  <div style={{ display: 'flex', gap: 8, paddingLeft: 12, borderLeft: `1px solid ${T.border}` }}>
    <button
      onClick={() => onModerate(issue._id, 'flag')}
      style={{
        padding: '7px 14px', borderRadius: 8,
        background: T.dangerDim, border: `1px solid rgba(255,68,102,0.3)`,
        color: T.danger, fontSize: 10, fontWeight: 800,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.18s',
      }}
    >
      Reject
    </button>
    <button
      onClick={() => onModerate(issue._id, 'approve')}
      style={{
        padding: '7px 14px', borderRadius: 8,
        background: T.accent, border: 'none',
        color: '#000', fontSize: 10, fontWeight: 800,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.18s',
        boxShadow: `0 0 16px rgba(0,229,160,0.2)`,
      }}
    >
      Approve
    </button>
  </div>
);

/* ─────────────────────────────────────────────────────────
   MODULE: MEDIA BLOCK
───────────────────────────────────────────────────────── */
const MediaBlock = ({ issue }) => {
  if (!issue.beforeImage && !issue.video) return null;

  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden', marginBottom: 16,
      border: `1px solid ${T.border}`, position: 'relative',
      height: 220, background: '#000',
    }}>
      {issue.video ? (
        <video
          src={issue.video}
          controls
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <img
          src={issue.beforeImage}
          alt={issue.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
        <Pill color={T.accent}>{issue.video ? <><Play size={8} /> Video</> : issue.category?.toUpperCase()}</Pill>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MODULE: ISSUE CARD
───────────────────────────────────────────────────────── */
const IssueCard = ({ issue, user, location, onUpvote, onDislike, onVerify, onModerate }) => {
  const [hovered, setHovered] = useState(false);
  const isMod = user && (user.role === 'moderator' || user.role === 'authority');
  const canMod = isMod && (issue.status === 'open' || issue.status === 'escalated');

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? T.cardHover : T.card,
        border: `1px solid ${hovered ? T.borderMid : T.border}`,
        borderRadius: 14, overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-1px)' : 'none',
        marginBottom: 16
      }}
    >
      <div style={{ padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={issue.author?.avatar || `https://i.pravatar.cc/150?u=${issue.author?._id || 'anon'}`}
            alt="avatar"
            style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', border: `1px solid ${T.border}` }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '0.02em', textShadow: '0 0 10px rgba(0,229,160,0.2)' }}>
              {issue.author?.name || 'Anonymous'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <Clock size={11} /> {fmt(issue.createdAt)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
          <MapPin size={14} color={T.accent} />
          {issue.wardName || issue.address || 'Unknown'}
        </div>
      </div>

      <Divider />

      <div style={{ padding: '20px 24px' }}>
        <h3 style={{
          margin: '0 0 10px', fontSize: 18, fontWeight: 800,
          letterSpacing: '-0.02em', color: T.white, lineHeight: 1.2,
        }}>
          {issue.title}
        </h3>
        <p style={{ margin: '0 0 18px', fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, fontWeight: 400 }}>
          {issue.description}
        </p>

        <MediaBlock issue={issue} />
        <StatusTimeline status={issue.status} />
      </div>

      <Divider />

      <div style={{
        padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <VoteBar
            issue={issue} user={user} location={location}
            onUpvote={() => onUpvote(issue._id)}
            onDislike={() => onDislike(issue._id)}
            onVerify={() => onVerify(issue._id)}
          />
          {canMod && <ModControls issue={issue} onModerate={onModerate} />}
        </div>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4, display: 'flex' }}
        >
          <Share2 size={16} />
        </button>
      </div>
    </article>
  );
};

/* ─────────────────────────────────────────────────────────
   MODULE: COMPOSE BOX
───────────────────────────────────────────────────────── */
const ComposeBox = ({ onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      cursor: 'pointer', transition: 'all 0.18s',
      marginBottom: 20
    }}
  >
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: T.accentDim, border: `1px solid ${T.accentBorder}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <AlertCircle size={20} color={T.accent} />
    </div>
    <span style={{ flex: 1, fontSize: 14, color: T.muted, fontWeight: 500, letterSpacing: '0.02em' }}>
      Report an environmental issue in your area…
    </span>
    <div style={{ display: 'flex', gap: 16 }}>
      {[Camera, Video, MapPin].map((Icon, i) => (
        <Icon key={i} size={20} color={T.muted} />
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   MODULE: ISSUE BREAKDOWN PANEL
───────────────────────────────────────────────────────── */
const UI_CONFIG = {
  garbage: { label: 'Waste & Garbage', color: '#f5a623' },
  waterlogging: { label: 'Waterlogging', color: '#4facfe' },
  deforestation: { label: 'Deforestation', color: '#10b981' },
  air_pollution: { label: 'Air Pollution', color: '#ff4d6d' },
  noise_pollution: { label: 'Noise Pollution', color: '#a78bfa' },
  sewage: { label: 'Sewage Issues', color: '#8b5e3c' },
  road_damage: { label: 'Road Damage', color: '#64748b' },
  illegal_dumping: { label: 'Illegal Dumping', color: '#ef4444' },
  water_scarcity: { label: 'Water Scarcity', color: '#0ea5e9' },
  other: { label: 'Other Reports', color: '#94a3b8' },
};

const IssueBreakdown = ({ issues }) => {
  const total = issues.length || 1;

  // Aggregate counts from real data
  const counts = issues.reduce((acc, iss) => {
    const cat = (iss.category || 'other').toLowerCase();
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // Convert to sorted display items
  const displayItems = Object.keys(UI_CONFIG).map(key => ({
    ...UI_CONFIG[key],
    count: counts[key] || 0,
    percent: ((counts[key] || 0) / total) * 100
  })).sort((a, b) => b.count - a.count);

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: '24px 28px',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      <div>
        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Issue Breakdown</h4>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Live situational awareness</p>
      </div>

      <Divider style={{ margin: '4px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {displayItems.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>

            <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.max(item.percent, item.count > 0 ? 5 : 0)}%`,
                background: item.color,
                borderRadius: 2,
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>

            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', width: 24, textAlign: 'right' }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MODULE: MAP PANEL
───────────────────────────────────────────────────────── */
const MapPanel = ({ issues, location }) => {
  const center = location?.lat
    ? { lat: location.lat, lng: location.lng }
    : { lat: issues[0]?.location?.coordinates[1] || 0, lng: issues[0]?.location?.coordinates[0] || 0 };
  const criticals = issues.filter(i => i.urgencyLevel === 'critical').length;

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Radio size={15} color={T.accent} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted }}>
            Live Map
          </span>
        </div>
        <LiveDot size={8} />
      </div>

      <div style={{ height: 240, position: 'relative' }}>
        <LeafletMap center={center} issues={issues} />
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { dot: T.danger, label: `${criticals} Critical Alerts` },
          { dot: T.accent, label: `${issues.length} Pending Actions` },
        ].map(({ dot, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: '0.04em' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MODULE: LEADERBOARD PANEL
───────────────────────────────────────────────────────── */
const LEADERS = [
  { rank: '01', name: 'ECO_WATCHER_ALPHA', pts: '4.8K', active: true },
  { rank: '02', name: 'GREEN_SENTINEL_7', pts: '3.2K', active: false },
  { rank: '03', name: 'WARD84_REPORTER', pts: '2.1K', active: false },
];

const LeaderboardPanel = () => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 14, padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: 20,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Zap size={16} color={T.accent} />
      <SectionLabel>Global Leaders</SectionLabel>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {LEADERS.map((l, i) => (
        <div key={l.rank}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              fontSize: 18, fontWeight: 900, letterSpacing: '-0.05em',
              color: i === 0 ? T.accent : T.muted, lineHeight: 1, width: 28,
            }}>{l.rank}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? T.white : T.mutedMid, letterSpacing: '0.02em' }}>
                {l.name}
              </div>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginTop: 2 }}>{l.pts} impact pts</div>
            </div>
            {l.active && <LiveDot size={7} />}
          </div>
          {i < LEADERS.length - 1 && <Divider style={{ marginTop: 16 }} />}
        </div>
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   MODULE: FEED HEADER
───────────────────────────────────────────────────────── */
const FeedHeader = ({ count, sector, onClear }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 18,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.white, letterSpacing: '-0.02em' }}>
          Community Feed
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: T.muted, fontWeight: 500 }}>
          {count} active issue{count !== 1 ? 's' : ''} {sector ? `near selected location` : 'in your area'}
        </p>
      </div>
      {sector && (
        <button
          onClick={onClear}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 6,
            background: T.accentDim, border: `1px solid ${T.accentBorder}`,
            color: T.accent, fontSize: 9, fontWeight: 800,
            textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Location Filter <X size={10} />
        </button>
      )}
    </div>
    <button style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 18px', borderRadius: 10,
      background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
      color: T.muted, fontSize: 12, fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      cursor: 'pointer', fontFamily: 'inherit',
    }}>
      <Filter size={14} /> Filter
    </button>
  </div>
);

/* ─────────────────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────────────────── */
const Feed = () => {
  const [issues, setIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [wards, setWards] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [awardedPoints, setAwardedPoints] = useState(null);
  const [awardAction, setAwardAction] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { location } = useLocation();
  const user = getUserFromToken();
  const isRegularUser = !user || user.role === 'user';

  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const wardParam = searchParams.get('ward');
  const idParam = searchParams.get('id');

  useEffect(() => {
    fetch("/data/wards.geojson")
      .then(r => r.json())
      .then(d => setWards(d));
  }, []);

  const fetchIssues = async () => {
    try {
      setLoadingIssues(true);
      const res = await api.get('/issues');
      if (res.data.success) setIssues(res.data.issues);
    } catch (err) {
      console.error('Failed to fetch issues', err);
    } finally {
      setLoadingIssues(false);
    }
  };

  useEffect(() => { fetchIssues(); }, []);

  // Compute displayed issues with sector filtering
  const displayIssues = useMemo(() => {
    let filtered = issues;

    // Filter by ID (Highest priority)
    if (idParam) {
      return issues.filter(iss => iss._id === idParam);
    }

    // Filter by Ward Name
    if (wardParam) {
      filtered = filtered.filter(iss => iss.wardName === wardParam);
    }

    // Filter by Proximity
    if (latParam && lngParam) {
      const targetLat = parseFloat(latParam);
      const targetLng = parseFloat(lngParam);
      filtered = filtered.filter(iss => {
        if (!iss.location?.coordinates) return false;
        const [lng, lat] = iss.location.coordinates;
        const d = getDistance(targetLat, targetLng, lat, lng);
        return d <= 3500; 
      });
    }

    return filtered;
  }, [issues, latParam, lngParam, wardParam, idParam]);

  const handleUpvote = async (id) => { try { await api.post(`/issues/${id}/upvote`); fetchIssues(); } catch (e) { console.error(e); } };
  const handleDislike = async (id) => {
    try {
      const res = await api.post(`/issues/${id}/dislike`, { lat: location?.lat, lng: location?.lng });
      if (res.data.deleted) alert('Issue deleted due to high community dislikes.');
      fetchIssues();
    } catch (e) { alert(e.response?.data?.message || 'Dislike failed'); }
  };
  const handleVerify = async (id) => {
    if (!location?.lat) { alert('Location required to verify.'); return; }
    try {
      const res = await api.post(`/issues/${id}/verify`, { type: 'verify', lat: location.lat, lng: location.lng });
      toast.success('Community verification successful!');
      if (res.data.pointsGained > 0) {
        setAwardedPoints(res.data.pointsGained);
        setAwardAction('verify');
      }
      fetchIssues();
    }
    catch (e) { toast.error(e.response?.data?.message || 'Verification failed'); }
  };
  const handleModerate = async (id, action) => {
    if (action === 'approve' && location?.lat) {
      const iss = issues.find(i => i._id === id);
      if (iss) {
        const d = getDistance(location.lat, location.lng, iss.location.coordinates[1], iss.location.coordinates[0]);
        if (d > 10000) { alert(`Must be within 10km to approve. You are ${(d / 1000).toFixed(1)}km away.`); return; }
      }
    }
    try {
      await api.put(`/issues/${id}/moderate`, { action, lat: location?.lat, lng: location?.lng });
      toast.success(`Issue ${action === 'approve' ? 'Approved' : 'Flagged'} successfully`);
      fetchIssues();
    }
    catch (e) { toast.error(e.response?.data?.message || 'Moderate failed'); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, color: T.white,
      fontFamily: '"DM Mono", "Fira Code", "Courier New", monospace',
    }}>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 currentColor; }
          50% { opacity: 0.6; box-shadow: 0 0 0 3px transparent; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        
        @media (max-width: 1200px) {
          .feed-grid { grid-template-columns: 1fr 300px !important; }
          .left-sidebar { display: none !important; }
        }
        @media (max-width: 900px) {
          .feed-grid { grid-template-columns: 1fr !important; }
          .right-sidebar { display: none !important; }
        }
      `}</style>

      <div
        className="feed-grid"
        style={{
          maxWidth: 1360, margin: '0 auto', padding: '24px 20px',
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 0.8fr) 2fr minmax(300px, 1fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >

        <div className="left-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>
          <IssueBreakdown issues={issues} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isRegularUser && <ComposeBox onClick={() => setIsModalOpen(true)} />}

          <CreateIssueModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              fetchIssues();
              toast.success("Report transmitted to sector command.");
            }}
          />

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

          <FeedHeader
            count={displayIssues.length}
            sector={latParam || lngParam || wardParam || idParam}
            onClear={() => setSearchParams({})}
          />

            {loadingIssues ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: T.muted }}>
                <Activity size={24} color={T.accent} className="animate-pulse" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.1em' }}>SYNCHRONIZING_FEED...</p>
              </div>
            ) : displayIssues.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              background: T.card, borderRadius: 14, border: `1px solid ${T.border}`,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: T.accentDim, border: `1px solid ${T.accentBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Wifi size={20} color={T.accent} />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: T.muted, fontWeight: 500 }}>
                {wardParam ? `No active reports in ${wardParam}.` : (latParam ? `No active reports within 3.5km of this location.` : 'No issues reported yet.')}
              </p>
            </div>
          ) : (
            displayIssues.map(issue => (
              <IssueCard
                key={issue._id}
                issue={issue}
                user={user}
                location={location}
                onUpvote={handleUpvote}
                onDislike={handleDislike}
                onVerify={handleVerify}
                onModerate={handleModerate}
              />
            ))
          )}
        </div>

        <div className="right-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>
          <MapPanel issues={issues} location={location} />
          <LeaderboardPanel />
        </div>
      </div>
    </div>
  );
};

export default Feed;
