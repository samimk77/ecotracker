import React, { useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const SettingsSection = ({ user }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(user?.avatar || null);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      if (avatar) data.append('avatar', avatar);

      const res = await api.put('/auth/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('System records synchronized. Profile updated.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Synchronization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pd-settings-grid pd-fade-up" style={{ animationDelay: '0.4s', gridTemplateColumns: '1fr' }}>
      <div className="pd-card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div className="pd-card-header">
          <div className="pd-card-title">👤 Identity & Biometrics</div>
        </div>
        
        <form onSubmit={handleUpdate}>
          {/* Avatar Edit */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{ position: 'relative' }}>
              <div className="pd-avatar" style={{ width: 120, height: 120 }}>
                {preview ? <img src={preview} alt="Profile" /> : user?.name?.[0].toUpperCase()}
              </div>
              <label 
                htmlFor="avatar-upload" 
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--pd-accent)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', border: '3px solid var(--pd-surface)',
                  color: '#000', fontSize: '1rem'
                }}
              >
                📷
                <input 
                  id="avatar-upload" 
                  type="file" 
                  hidden 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                />
              </label>
            </div>
          </div>

          <div className="pd-form-group">
            <label className="pd-label">DISPLAY NAME</label>
            <input 
              type="text" 
              className="pd-input" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="System identity" 
            />
          </div>
          <div className="pd-form-group">
            <label className="pd-label">EMAIL ENDPOINT</label>
            <input 
              type="email" 
              className="pd-input" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="secure@endpoint.com" 
            />
          </div>
          <button type="submit" className="pd-btn pd-btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'SYNCHRONIZING...' : 'UPDATE ARCHIVE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsSection;
