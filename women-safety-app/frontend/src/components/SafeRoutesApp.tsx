import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from '../context/AppContext';
import { useGeolocation } from '../hooks/useGeolocation';
import MapView from './MapView';
import Sidebar from './Sidebar';
import RouteList from './RouteList';
import NavigationView from './NavigationView';
import '../styles/SafeRoutes.css';

const AppContent: React.FC = () => {
  const { routes, isNavigating, setStartLocation, setEndLocation, selectedRoute } = useAppContext();
  const { position } = useGeolocation(false);
  const [settingLocation, setSettingLocation] = useState<'start' | 'end' | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if user is near the starting point when navigation starts
  useEffect(() => {
    if (isNavigating && selectedRoute && position) {
      const startPoint = selectedRoute.route[0];
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;

      // Calculate distance from user to start point
      const distance = calculateDistance(userLat, userLon, startPoint[0], startPoint[1]);

      // If user is more than 200m away from start, show warning
      if (distance > 200) {
        setShowLocationWarning(true);
      }
    } else {
      setShowLocationWarning(false);
    }
  }, [isNavigating, selectedRoute, position]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleMapClick = async (lat: number, lon: number) => {
    if (settingLocation) {
      const location = { lat, lon, name: `${lat.toFixed(4)}, ${lon.toFixed(4)}` };
      if (settingLocation === 'start') {
        setStartLocation(location);
      } else {
        setEndLocation(location);
      }
      setSettingLocation(null);
    }
  };

  if (isNavigating) {
    return (
      <>
        {showLocationWarning && (
          <div className="location-warning-banner">
            <div className="warning-content">
              <span className="warning-icon">⚠️</span>
              <div className="warning-text">
                <strong>You're not at the starting point!</strong>
                <p>Please navigate to the route start location first.</p>
              </div>
              <button 
                className="warning-close"
                onClick={() => setShowLocationWarning(false)}
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <NavigationView />
      </>
    );
  }

  return (
    <div className="app-container">
      {settingLocation && (
        <div className="setting-location-indicator">
          📍 Click on map to set {settingLocation === 'start' ? 'START' : 'END'} location
        </div>
      )}
      
      {/* Sidebar toggle button - always visible when sidebar is hidden */}
      {!showSidebar && (
        <button 
          className="sidebar-toggle-btn"
          onClick={() => setShowSidebar(true)}
          title="Show sidebar"
        >
          ☰ Show Panel
        </button>
      )}

      <div className={`sidebar ${!showSidebar ? 'sidebar-hidden' : ''}`}>
        {/* Minimize button at top of sidebar */}
        <button 
          className="sidebar-minimize-btn"
          onClick={() => setShowSidebar(false)}
          title="Hide sidebar"
        >
          ← Minimize
        </button>
        
        <Sidebar onSetLocationMode={(mode) => setSettingLocation(mode)} settingLocation={settingLocation} />
      </div>
      
      <div className="map-container">
        <MapView onMapClick={handleMapClick} />
        {routes.length > 0 && <RouteList />}
      </div>
    </div>
  );
};

const SafeRoutesApp: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default SafeRoutesApp;
