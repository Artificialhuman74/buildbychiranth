import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GradualBlur from './GradualBlur';
import FloatingDecorations from './FloatingDecorations';
import '../styles/Landing.css';

// Gradual blur fix - blur stays visible to reveal content on scroll

const Landing: React.FC = () => {
  const [sosPressed, setSosPressed] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  let sosTimer: NodeJS.Timeout;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const videos = [
    { id: 1, title: "Safety Tips for Night Travel", url: "/videos/video1.mp4", color: "#e8d4d4" },
    { id: 2, title: "How to Use SOS Features", url: "/videos/video2.mp4", color: "#dcc4c4" },
    { id: 3, title: "Community Support Guide", url: null, color: "#d4b8d4" } // Placeholder
  ];

  const supportItems = [
    { to: '/safety-tips', icon: '✦', title: 'Safety Tips', desc: 'Quick guidance to stay safer on the go.' },
    { to: '/emergency-contacts', icon: '☎', title: 'Emergency Contacts', desc: 'Reach help fast with curated contacts.' },
    { to: '/safe-routes', icon: '⌖', title: 'Safe Maps', desc: 'Navigate using safer, well-lit paths.' },
    { to: '/fake-call-ai', icon: '◉', title: 'Fake Call', desc: 'Trigger a believable call for cover.' },
    { to: '/sos-tips', icon: '⚡', title: 'SOS Tips', desc: 'Know what to do when seconds matter.' },
    { to: '/community-support', icon: '∞', title: 'Community Support', desc: 'Share and learn with the community.' }
  ];

  const handleSosPress = () => {
    setSosPressed(true);
    sosTimer = setTimeout(() => {
      window.location.href = '/sos-center';
    }, 1500);
  };

  const handleSosRelease = () => {
    setSosPressed(false);
    clearTimeout(sosTimer);
  };

  const nextVideo = () => {
    setCurrentVideo((prev) => (prev + 1) % videos.length);
  };

  const prevVideo = () => {
    setCurrentVideo((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const goToVideo = (index: number) => {
    setCurrentVideo(index);
  };

  // Auto-rotate videos every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % videos.length);
    }, 8000); // 8 seconds

    return () => clearInterval(interval);
  }, [videos.length]);

  const maxTilt = 19; // Increased by 30% for more prominent movement
  const handleCardMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height; // 0 to 1
    const rotateY = (x - 0.5) * maxTilt;
    const rotateX = (0.5 - y) * maxTilt;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  };

  const handleCardLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)';
  };

  const handleCardEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    card.style.transition = 'transform 0.18s ease';
  };

  return (
    <div className="sylvie-landing">
      <FloatingDecorations />
      <GradualBlur position="bottom" height="11.475rem" strength={2.5} divCount={6} curve="ease-out" target="page" animated="scroll" />

      {/* Profile Button - Top Right */}
      <button
        className={`profile-button-fixed ${user ? 'profile-avatar' : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {user ? (
          <span>{(user.name || user.username || 'U').charAt(0).toUpperCase()}</span>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <div className={`profile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/profile" className="sidebar-item" onClick={() => setSidebarOpen(false)}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
            <span>Profile</span>
          </Link>
          <Link to="/settings" className="sidebar-item" onClick={() => setSidebarOpen(false)}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
            <span>Settings</span>
          </Link>
          <Link to="/my-reports" className="sidebar-item" onClick={() => setSidebarOpen(false)}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
            <span>My Reports</span>
          </Link>
        </nav>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Logo Section */}
      <div className="sylvie-logo-section">
        <img
          src="/sylvie-logo.png"
          alt="Sylvie"
          className="sylvie-logo-image"
          onError={(e) => {
            // Fallback to text if image doesn't load
            e.currentTarget.style.display = 'none';
            const fallback = document.createElement('h1');
            fallback.className = 'sylvie-title';
            fallback.textContent = 'Sylvie';
            e.currentTarget.parentElement?.appendChild(fallback);
          }}
        />
      </div>

      {/* Videos Section */}
      <div className="videos-section">
        <div className="section-header section-header-center">
          <h2>Our vision of women empowerment</h2>
          <div className="nav-arrows">
            <span onClick={prevVideo}>‹</span>
            <span onClick={nextVideo}>›</span>
          </div>
        </div>
        <div className="videos-carousel-container">
          <div
            className="videos-carousel"
            style={{ transform: `translateX(calc(-${currentVideo} * calc(100% + 24px)))` }}
          >
            {videos.map((video, index) => (
              <div
                key={video.id}
                className="video-card"
              >
                {video.url ? (
                  <video
                    className="video-player"
                    src={video.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '16px',
                      display: 'block',
                      opacity: 1,
                      zIndex: 2,
                    }}
                  />
                ) : (
                  <div className="video-placeholder">
                    <div className="play-icon">
                      <svg viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="video-title">{video.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="carousel-dots">
          {videos.map((_, index) => (
            <span
              key={index}
              className={`dot ${currentVideo === index ? 'active' : ''}`}
              onClick={() => goToVideo(index)}
            ></span>
          ))}
        </div>
      </div>

      {/* How We Support You Section */}
      <div className="support-section">
        <div className="section-header">
          <h2 className="section-title-center">How we support you</h2>
        </div>
        <div className="support-grid">
          {supportItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="support-card"
              style={{ textDecoration: 'none' }}
              onMouseMove={handleCardMove}
              onMouseLeave={handleCardLeave}
              onMouseEnter={handleCardEnter}
            >
              <div className="support-icon" aria-hidden="true">{item.icon}</div>
              <h3>{item.title}</h3>
              <p className="support-desc">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Landing;
