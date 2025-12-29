import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import MainNav from './components/MainNav';
import Landing from './components/Landing';
import SafeRoutesApp from './components/SafeRoutesApp';
import './App.css';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect HTML pages to backend
    const htmlPages: { [key: string]: string } = {
      '/sos': '/sos-center',
      '/sos-deactivate': '/sos-deactivate',
      '/emergency-contacts': '/emergency-contacts',
      '/report': '/report',
      '/my-reports': '/my-reports',
      '/community': '/community-support',
      '/fake-call': '/fake-call-ai',
      '/login': '/login',
      '/signup': '/signup',
      '/settings': '/settings',
    };

    if (htmlPages[location.pathname]) {
      // Redirect to backend HTML page
      window.location.href = htmlPages[location.pathname];
    }
  }, [location.pathname, navigate]);

  return (
    <div className="App">
      <MainNav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/safe-routes" element={<SafeRoutesApp />} />
      </Routes>
    </div>
  );
}

export default App;
