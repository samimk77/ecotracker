import React from 'react';

const ProfileStats = ({ stats }) => {
  const statItems = [
    { label: 'Issues Reported', value: stats?.issuesRaised || 0, color: 'var(--pd-accent)' },
    { label: 'Resolved', value: stats?.issuesResolved || 0, color: '#22c55e' },
    { label: 'Verifications', value: stats?.issuesVerified || 0, color: '#3b82f6' },
    { label: 'Impact Points', value: stats?.impactScore || 0, color: '#f97316' },
  ];

  return (
    <div className="pd-stats pd-fade-up" style={{ animationDelay: '0.2s' }}>
      {statItems.map((stat, i) => (
        <div key={i} className="pd-stat-card">
          <div className="pd-stat-val" style={{ color: stat.color }}>{stat.value}</div>
          <div className="pd-stat-lbl">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats;
