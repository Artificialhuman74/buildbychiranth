import React, { useState } from 'react';
import '../styles/Settings.css';

const Settings: React.FC = () => {
  const [profile, setProfile] = useState({
    username: 'User',
    email: 'user@example.com',
    phone: '',
    notifications: true,
    locationSharing: true,
    anonymousMode: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
      });
      alert('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      alert('Failed to change password');
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <p>Manage your account and privacy preferences</p>
      </div>

      <div className="settings-content">
        {/* Profile Section */}
        <div className="settings-card">
          <h3>👤 Profile Information</h3>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={profile.username}
                onChange={handleProfileChange}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
              />
            </div>

            <div className="form-group">
              <label>Phone Number (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                placeholder="+1234567890"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Save Profile
            </button>
          </form>
        </div>

        {/* Privacy Settings */}
        <div className="settings-card">
          <h3>🔒 Privacy & Safety</h3>
          <div className="settings-toggles">
            <div className="toggle-item">
              <div>
                <strong>Enable Notifications</strong>
                <p>Receive alerts for emergency updates</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={profile.notifications}
                  onChange={handleProfileChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-item">
              <div>
                <strong>Location Sharing</strong>
                <p>Allow sharing location during SOS</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="locationSharing"
                  checked={profile.locationSharing}
                  onChange={handleProfileChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-item">
              <div>
                <strong>Anonymous Mode</strong>
                <p>Post anonymously by default</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="anonymousMode"
                  checked={profile.anonymousMode}
                  onChange={handleProfileChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="settings-card">
          <h3>🔑 Change Password</h3>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-warning">
              Update Password
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="settings-card danger-zone">
          <h3>⚠️ Danger Zone</h3>
          <p>These actions cannot be undone</p>
          <div className="danger-actions">
            <button className="btn btn-outline-danger">
              Delete All Reports
            </button>
            <button className="btn btn-danger">Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
