import React, { useState } from 'react';
import { Gift, Coffee, Music, Film, ShoppingBag, CheckCircle, ChevronRight, Coins } from 'lucide-react';
import '../../pages/PersonalDashboard.css';
import { useLanguage } from '../../context/LanguageContext';

const VOUCHERS = [
  {
    id: 'amz_100',
    title: 'Amazon Gift Card (₹100)',
    brand: 'Amazon',
    cost: 500,
    icon: ShoppingBag,
    color: '#ff9900',
    bg: 'rgba(255, 153, 0, 0.1)',
  },
  {
    id: 'spot_1mo',
    title: 'Spotify Premium (1 Month)',
    brand: 'Spotify',
    cost: 1200,
    icon: Music,
    color: '#1db954',
    bg: 'rgba(29, 185, 84, 0.1)',
  },
  {
    id: 'yt_1mo',
    title: 'YouTube Premium (1 Month)',
    brand: 'YouTube',
    cost: 1500,
    icon: PlayIcon, // Custom or Video icon
    color: '#ff0000',
    bg: 'rgba(255, 0, 0, 0.1)',
  },
  {
    id: 'movie_ticket',
    title: 'BookMyShow Voucher (₹250)',
    brand: 'BookMyShow',
    cost: 1000,
    icon: Film,
    color: '#f84464',
    bg: 'rgba(248, 68, 100, 0.1)',
  },
  {
    id: 'coffee_free',
    title: 'Starbucks Free Coffee',
    brand: 'Starbucks',
    cost: 800,
    icon: Coffee,
    color: '#00704a',
    bg: 'rgba(0, 112, 74, 0.1)',
  }
];

function PlayIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
    </svg>
  );
}

const RewardsSection = ({ user }) => {
  const { t } = useLanguage();
  const [redeeming, setRedeeming] = useState(null);
  const [success, setSuccess] = useState(null);

  const userPoints = user?.stats?.impactScore || 0;

  const handleRedeem = (voucher) => {
    if (userPoints < voucher.cost) return;
    setRedeeming(voucher.id);
    
    // Simulate API call
    setTimeout(() => {
      setRedeeming(null);
      setSuccess(voucher.id);
      
      // Auto-hide success message
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="pd-fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: '#f0f4ff' }}>{t('rewards.title')}</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{t('rewards.subtitle')}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 229, 160, 0.1)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(0, 229, 160, 0.2)' }}>
          <Coins size={20} color="#00e5a0" />
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('rewards.balance')}</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#00e5a0', lineHeight: 1 }}>{userPoints} XP</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {VOUCHERS.map(v => {
          const Icon = v.icon;
          const canAfford = userPoints >= v.cost;
          const isRedeeming = redeeming === v.id;
          const isSuccess = success === v.id;

          return (
            <div key={v.id} style={{ 
              background: 'var(--pd-card)', border: '1px solid var(--pd-border)', 
              borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '12px', 
                  background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={24} color={v.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f0f4ff', margin: '0 0 4px', lineHeight: 1.3 }}>{v.title}</h3>
                  <span style={{ fontSize: '12px', color: v.color, fontWeight: 700 }}>{v.brand}</span>
                </div>
              </div>

              {/* Action Area */}
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: canAfford ? '#00e5a0' : 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '15px' }}>
                  <Coins size={16} /> {v.cost} XP
                </div>
                
                {isSuccess ? (
                  <button style={{ 
                    padding: '8px 16px', background: 'rgba(0, 229, 160, 0.15)', color: '#00e5a0', 
                    border: '1px solid rgba(0, 229, 160, 0.3)', borderRadius: '8px', 
                    fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' 
                  }}>
                    <CheckCircle size={14} /> {t('rewards.redeemed')}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleRedeem(v)}
                    disabled={!canAfford || isRedeeming}
                    style={{ 
                      padding: '8px 16px', 
                      background: canAfford ? 'var(--pd-accent)' : 'rgba(255,255,255,0.05)', 
                      color: canAfford ? '#000' : 'rgba(255,255,255,0.3)', 
                      border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 800, 
                      cursor: canAfford && !isRedeeming ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      opacity: isRedeeming ? 0.7 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {isRedeeming ? t('rewards.btn_processing') : (canAfford ? t('rewards.btn_redeem') : t('rewards.btn_not_enough'))}
                  </button>
                )}
              </div>
              
              {/* Progress bar if cannot afford */}
              {!canAfford && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ height: '100%', background: 'rgba(255,255,255,0.2)', width: `${Math.min(100, (userPoints / v.cost) * 100)}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RewardsSection;
