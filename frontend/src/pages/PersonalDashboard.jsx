import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './PersonalDashboard.css';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, X } from 'lucide-react';

// Modular Components
import ProfileHero from '../components/profile/ProfileHero';
import ProfileStats from '../components/profile/ProfileStats';
import RecentIssues from '../components/profile/RecentIssues';
import SettingsSection from '../components/profile/SettingsSection';
import RewardsSection from '../components/profile/RewardsSection';

const PersonalDashboard = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const meRes = await api.get('/auth/me');
      if (meRes.data.success) {
        const userId = meRes.data.user._id;
        const profileRes = await api.get(`/profile/${userId}`);
        if (profileRes.data.success) {
          setProfileData(profileRes.data);
        }
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleDeleteIssue = async () => {
    const issueId = deleteConfirm.id;
    if (!issueId) return;

    try {
      await api.delete(`/issues/${issueId}`);
      setProfileData(prev => ({
        ...prev,
        history: {
          ...prev.history,
          issues: prev.history.issues.filter(i => i._id !== issueId)
        }
      }));
      setDeleteConfirm({ show: false, id: null });
    } catch (err) {
      alert(err.response?.data?.message || 'De-authentication failed');
    }
  };

  if (loading) {
    return (
      <div className="pd-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ fontFamily: 'Space Mono', color: 'var(--pd-accent)', letterSpacing: '0.2em' }}>
          INITIALIZING MISSION CONTROL...
        </div>
      </div>
    );
  }

  const { user, history } = profileData || {};

  return (
    <div className="pd-container">
      {/* ─── TOPBAR ─── */}
      <div className="pd-topbar">
        <div className="pd-page-title">{t('dashboard.title')}</div>
        <div className="pd-tabs">
          {['overview', 'issues', 'rewards', 'settings'].map((tab) => (
            <div 
              key={tab} 
              className={`pd-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {t(`dashboard.tab_${tab}`)}
            </div>
          ))}
        </div>
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div className="pd-content">
        {activeTab === 'overview' && (
          <>
            <ProfileHero user={user} />
            <ProfileStats stats={user?.stats} />
            <RecentIssues 
              issues={history?.issues} 
              onViewAll={() => setActiveTab('issues')} 
              onDelete={(id) => setDeleteConfirm({ show: true, id })} 
            />
          </>
        )}

        {activeTab === 'issues' && (
          <div className="pd-fade-up">
            <RecentIssues 
              issues={history?.issues} 
              onDelete={(id) => setDeleteConfirm({ show: true, id })} 
            />
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button className="pd-btn pd-btn-primary" onClick={() => navigate('/feed')}>
                EXPLORE GLOBAL FEED
              </button>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <RewardsSection user={user} />
        )}

        {activeTab === 'settings' && (
          <SettingsSection user={user} />
        )}
      </div>

      {/* ─── CUSTOM DELETE MODAL ─── */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)'
        }}>
          <div className="pd-card pd-fade-up" style={{ 
            maxWidth: '400px', width: '90%', padding: '2rem',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            background: 'var(--pd-surface)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pd-red)' }}>
                <AlertTriangle size={20} />
              </div>
              <button 
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                style={{ background: 'none', border: 'none', color: 'var(--pd-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--pd-text)', marginBottom: '0.5rem' }}>Are you sure?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--pd-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>
              Deleting this report is permanent and will remove it from the community feed. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--pd-border)',
                  background: 'transparent', color: 'var(--pd-text)', fontSize: '0.8rem', fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
              <button 
                onClick={handleDeleteIssue}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                  background: 'var(--pd-red)', color: '#fff', fontSize: '0.8rem', fontWeight: 800,
                  cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                }}
              >
                YES, DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalDashboard;
