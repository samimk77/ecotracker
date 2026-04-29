import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './PersonalDashboard.css';
import { useLanguage } from '../context/LanguageContext';

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
  const navigate = useNavigate();

  useEffect(() => {
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
    fetchData();
  }, [navigate]);

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
            <RecentIssues issues={history?.issues} onViewAll={() => setActiveTab('issues')} />
          </>
        )}

        {activeTab === 'issues' && (
          <div className="pd-fade-up">
            <RecentIssues issues={history?.issues} />
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
    </div>
  );
};

export default PersonalDashboard;
