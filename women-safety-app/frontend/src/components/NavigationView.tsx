import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppContext } from '../context/AppContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useVoiceGuidance } from '../hooks/useVoiceGuidance';
import FeedbackModal from './FeedbackModal';

const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const NavigationView: React.FC = () => {
  const { selectedRoute, setIsNavigating, setSelectedRoute } = useAppContext();
  const { position, accuracy } = useGeolocation(true);
  const { speak } = useVoiceGuidance();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceToNext, setDistanceToNext] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [heading, setHeading] = useState(0);
  const [currentDirection, setCurrentDirection] = useState('⬆️');
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [isMinimized, setIsMinimized] = useState(false);

  const userIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="10" fill="#3b82f6" stroke="white" stroke-width="3"/>
        <circle cx="16" cy="16" r="4" fill="white"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  useEffect(() => {
    if ('ondeviceorientation' in window) {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        if (event.alpha !== null) {
          setHeading(event.alpha);
        }
      };
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, []);

  const getDirectionIcon = useCallback((bearing: number) => {
    if (bearing >= 337.5 || bearing < 22.5) return '⬆️';
    if (bearing >= 22.5 && bearing < 67.5) return '↗️';
    if (bearing >= 67.5 && bearing < 112.5) return '➡️';
    if (bearing >= 112.5 && bearing < 157.5) return '↘️';
    if (bearing >= 157.5 && bearing < 202.5) return '⬇️';
    if (bearing >= 202.5 && bearing < 247.5) return '↙️';
    if (bearing >= 247.5 && bearing < 292.5) return '⬅️';
    return '↖️';
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    const bearing = ((θ * 180) / Math.PI + 360) % 360;

    return bearing;
  };

  useEffect(() => {
    if (!position || !selectedRoute) return;

    const currentLat = position.coords.latitude;
    const currentLon = position.coords.longitude;
    setMapCenter([currentLat, currentLon]);

    const lastPoint = selectedRoute.route[selectedRoute.route.length - 1];
    const distToEnd = calculateDistance(currentLat, currentLon, lastPoint[0], lastPoint[1]);
    
    if (distToEnd < 50 && !hasArrived) {
      setHasArrived(true);
      speak('You have arrived at your destination!', 'high');
      setTimeout(() => setShowFeedback(true), 1000);
      return;
    }

    let minDist = Infinity;
    let closestIdx = currentStepIndex;

    for (let i = currentStepIndex; i < selectedRoute.route.length; i++) {
      const [lat, lon] = selectedRoute.route[i];
      const dist = calculateDistance(currentLat, currentLon, lat, lon);
      
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }

    if (closestIdx !== currentStepIndex && closestIdx > currentStepIndex) {
      setCurrentStepIndex(closestIdx);
      if (closestIdx < selectedRoute.route.length - 1) {
        const nextPoint = selectedRoute.route[closestIdx + 1];
        const bearing = calculateBearing(currentLat, currentLon, nextPoint[0], nextPoint[1]);
        setCurrentDirection(getDirectionIcon(bearing));
      }
    }

    if (closestIdx < selectedRoute.route.length - 1) {
      const nextPoint = selectedRoute.route[closestIdx + 1];
      const dist = calculateDistance(currentLat, currentLon, nextPoint[0], nextPoint[1]);
      setDistanceToNext(dist);
    }
  }, [position, selectedRoute, currentStepIndex, hasArrived, speak, getDirectionIcon]);

  const handleExit = () => {
    setIsNavigating(false);
    setSelectedRoute(null);
  };

  if (!selectedRoute) return null;

  const progress = (currentStepIndex / selectedRoute.route.length) * 100;
  const routeColor = selectedRoute.safety_score >= 90 ? '#059669' : 
                     selectedRoute.safety_score >= 75 ? '#1e40af' : 
                     selectedRoute.safety_score >= 60 ? '#d97706' : '#b91c1c';

  return (
    <div className="navigation-container">
      <div className="nav-top-bar">
        <button className="btn-nav-exit" onClick={handleExit}>
          ← Exit
        </button>
        <div className="nav-eta">
          <div className="eta-time">{selectedRoute.duration_display}</div>
          <div className="eta-distance">{selectedRoute.distance_display}</div>
        </div>
        <div className="gps-indicator">
          {accuracy === 'high' ? '🟢' : accuracy === 'medium' ? '🟡' : '🔴'}
        </div>
      </div>

      <div className="nav-map-container" style={{ height: isMinimized ? '40%' : '60%' }}>
        <MapContainer
          center={mapCenter}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <MapUpdater center={mapCenter} zoom={17} />
          
          <Polyline
            positions={selectedRoute.route.map(p => [p[0], p[1]])}
            color={routeColor}
            weight={6}
            opacity={0.8}
          />
          
          {position && (
            <Marker
              position={[position.coords.latitude, position.coords.longitude]}
              icon={userIcon}
            />
          )}
        </MapContainer>

        <button 
          className="btn-map-toggle"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? '▲ Expand Map' : '▼ Minimize Map'}
        </button>
      </div>

      <div className="nav-instructions-panel" style={{ height: isMinimized ? '60%' : '40%' }}>
        <div className="nav-direction-card">
          <div className="direction-icon-large">{currentDirection}</div>
          <div className="direction-details">
            <div className="direction-primary">Continue Straight</div>
            <div className="direction-distance">
              {distanceToNext < 1000
                ? `${Math.round(distanceToNext)} m`
                : `${(distanceToNext / 1000).toFixed(1)} km`}
            </div>
          </div>
          {currentStepIndex < selectedRoute.route.length - 2 && (
            <div className="direction-next">
              <small>Then {getDirectionIcon(0)}</small>
            </div>
          )}
        </div>

        <div className="nav-progress-section">
          <div className="progress-bar-nav">
            <div className="progress-fill-nav" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-info">
            <span>{Math.round(progress)}% Complete</span>
            <span>Safety: {selectedRoute.safety_display}</span>
          </div>
        </div>

        <div className="nav-actions">
          <button className="btn btn-secondary" onClick={() => setShowFeedback(true)}>
            ⭐ Rate Route
          </button>
        </div>
      </div>

      {showFeedback && (
        <FeedbackModal
          route={selectedRoute}
          onClose={() => {
            setShowFeedback(false);
            if (hasArrived) handleExit();
          }}
        />
      )}
    </div>
  );
};

export default NavigationView;
