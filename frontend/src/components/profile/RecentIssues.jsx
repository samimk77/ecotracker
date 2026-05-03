import React from 'react';
import { ArrowRight, Clock, Trash2 } from 'lucide-react';

const RecentIssues = ({ issues, onViewAll, onDelete }) => {
  return (
    <div className="pd-card pd-fade-up" style={{ animationDelay: '0.3s' }}>
      <div className="pd-card-header">
        <div className="pd-card-title">📋 My Recent Activity</div>
        <button className="pd-btn pd-btn-sm" onClick={onViewAll} style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--pd-muted)' }}>
          View All <ArrowRight size={12} style={{ marginLeft: 4 }} />
        </button>
      </div>

      <div className="pd-issues-list">
        {issues && issues.length > 0 ? (
          issues.map((issue) => (
            <div key={issue._id} className="pd-issue-row">
              <span className="pd-issue-id">#{issue._id.slice(-4).toUpperCase()}</span>
              <div 
                className="pd-issue-status-dot" 
                style={{ background: issue.status === 'resolved' ? '#22c55e' : issue.status === 'escalated' ? 'var(--pd-red)' : 'var(--pd-accent)' }}
              ></div>
              <div className="pd-issue-main">
                <div className="pd-issue-title">{issue.title}</div>
                <div className="pd-issue-meta">{issue.wardName || 'Global'} · {issue.category || 'Uncategorized'}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className={`pd-pill pd-pill-${issue.status}`}>
                  {issue.status?.toUpperCase()}
                </span>
                <div className="pd-issue-age" style={{ fontSize: '0.7rem', color: 'var(--pd-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} /> {new Date(issue.createdAt).toLocaleDateString()}
                </div>
                {onDelete && (
                  <button 
                    onClick={() => onDelete(issue._id)}
                    style={{ 
                      background: 'none', border: 'none', color: 'var(--pd-red)', 
                      cursor: 'pointer', padding: '4px', borderRadius: '4px',
                      opacity: 0.5, transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--pd-muted)', fontSize: '0.8rem' }}>
            No recent activity recorded in this sector.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentIssues;
