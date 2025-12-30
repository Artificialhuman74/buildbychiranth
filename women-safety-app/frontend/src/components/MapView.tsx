import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { useAppContext } from '../context/AppContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { getCrimeHeatmap, getLightingHeatmap, getPopulationHeatmap, getUserFeedbackHeatmap } from '../services/api';
import { Route } from '../types';
import '../styles/SafeRoutes.css';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapController: React.FC = () => {
  const map = useMap();
  const { startLocation, endLocation, selectedRoute } = useAppContext();

  useEffect(() => {
    if (selectedRoute && selectedRoute.route.length > 0) {
      const bounds = L.latLngBounds(selectedRoute.route.map(p => [p[0], p[1]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (startLocation && endLocation) {
      const bounds = L.latLngBounds([
        [startLocation.lat, startLocation.lon],
        [endLocation.lat, endLocation.lon]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (startLocation && !endLocation) {
      map.setView([startLocation.lat, startLocation.lon], 15, { animate: true });
    } else if (endLocation && !startLocation) {
      map.setView([endLocation.lat, endLocation.lon], 15, { animate: true });
    }
  }, [map, startLocation, endLocation, selectedRoute]);

  return null;
};

const MapClickHandler: React.FC<{ onMapClick: (lat: number, lon: number) => void }> = ({ onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return null;
};

const HeatmapLayer: React.FC = () => {
  const map = useMap();
  const { showHeatmap } = useAppContext();
  const heatLayersRef = useRef<{ [key: string]: any }>({});
  const loadingRef = useRef<{ [key: string]: boolean }>({});

  // Crime heatmap effect
  useEffect(() => {
    const loadCrimeHeatmap = async () => {
      if (showHeatmap.crime && !heatLayersRef.current.crime && !loadingRef.current.crime) {
        loadingRef.current.crime = true;
        try {
          const data = await getCrimeHeatmap();
          if (data.success && data.data.length > 0) {
            const heatData = data.data.map((p: any) => [p[0], p[1], p[2] || 1]);
            heatLayersRef.current.crime = (L as any).heatLayer(heatData, {
              radius: 25,
              blur: 35,
              maxZoom: 17,
              max: 1.0,
              gradient: { 0.0: 'yellow', 0.5: 'orange', 1.0: 'red' }
            }).addTo(map);
          }
        } catch (error) {
          console.error('Error loading crime heatmap:', error);
        } finally {
          loadingRef.current.crime = false;
        }
      } else if (!showHeatmap.crime && heatLayersRef.current.crime) {
        map.removeLayer(heatLayersRef.current.crime);
        heatLayersRef.current.crime = null;
      }
    };

    loadCrimeHeatmap();
  }, [showHeatmap.crime, map]);

  // Lighting heatmap effect
  useEffect(() => {
    const loadLightingHeatmap = async () => {
      if (showHeatmap.lighting && !heatLayersRef.current.lighting && !loadingRef.current.lighting) {
        loadingRef.current.lighting = true;
        try {
          const data = await getLightingHeatmap();
          if (data.success && data.data.length > 0) {
            const heatData = data.data.map((p: any) => [p[0], p[1], p[2] || 1]);
            heatLayersRef.current.lighting = (L as any).heatLayer(heatData, {
              radius: 20,
              blur: 30,
              maxZoom: 17,
              max: 1.0,
              gradient: { 0.0: 'blue', 0.5: 'cyan', 1.0: 'white' }
            }).addTo(map);
          }
        } catch (error) {
          console.error('Error loading lighting heatmap:', error);
        } finally {
          loadingRef.current.lighting = false;
        }
      } else if (!showHeatmap.lighting && heatLayersRef.current.lighting) {
        map.removeLayer(heatLayersRef.current.lighting);
        heatLayersRef.current.lighting = null;
      }
    };

    loadLightingHeatmap();
  }, [showHeatmap.lighting, map]);

  // Population heatmap effect
  useEffect(() => {
    const loadPopulationHeatmap = async () => {
      if (showHeatmap.population && !heatLayersRef.current.population && !loadingRef.current.population) {
        loadingRef.current.population = true;
        try {
          const data = await getPopulationHeatmap();
          if (data.success && data.data.length > 0) {
            const heatData = data.data.map((p: any) => [p[0], p[1], p[2] || 1]);
            heatLayersRef.current.population = (L as any).heatLayer(heatData, {
              radius: 30,
              blur: 40,
              maxZoom: 17,
              max: 1.0,
              gradient: { 0.0: 'green', 0.5: 'lime', 1.0: 'yellow' }
            }).addTo(map);
          }
        } catch (error) {
          console.error('Error loading population heatmap:', error);
        } finally {
          loadingRef.current.population = false;
        }
      } else if (!showHeatmap.population && heatLayersRef.current.population) {
        map.removeLayer(heatLayersRef.current.population);
        heatLayersRef.current.population = null;
      }
    };

    loadPopulationHeatmap();
  }, [showHeatmap.population, map]);

  // User feedback heatmap effect
  useEffect(() => {
    const loadUserFeedbackHeatmap = async () => {
      if (showHeatmap.userFeedback && !heatLayersRef.current.userFeedback && !loadingRef.current.userFeedback) {
        loadingRef.current.userFeedback = true;
        try {
          const data = await getUserFeedbackHeatmap();
          if (data.success && data.data.length > 0) {
            const heatData = data.data.map((p: any) => [p[0], p[1], p[2] || 1]);
            heatLayersRef.current.userFeedback = (L as any).heatLayer(heatData, {
              radius: 25,
              blur: 35,
              maxZoom: 17,
              max: 1.0,
              gradient: { 0.0: 'yellow', 0.5: 'orange', 1.0: 'red' }
            }).addTo(map);
          }
        } catch (error) {
          console.error('Error loading user feedback heatmap:', error);
        } finally {
          loadingRef.current.userFeedback = false;
        }
      } else if (!showHeatmap.userFeedback && heatLayersRef.current.userFeedback) {
        map.removeLayer(heatLayersRef.current.userFeedback);
        heatLayersRef.current.userFeedback = null;
      }
    };

    loadUserFeedbackHeatmap();
  }, [showHeatmap.userFeedback, map]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(heatLayersRef.current).forEach(layer => {
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      heatLayersRef.current = {};
    };
  }, [map]);

  return null;
};

const MapView: React.FC<{ onMapClick: (lat: number, lon: number) => void }> = ({ onMapClick }) => {
  const { startLocation, endLocation, routes, selectedRoute } = useAppContext();
  const { position, error, refresh } = useGeolocation(false);
  const mapRef = useRef<L.Map | null>(null);

  // Center map on user location when found initially
  useEffect(() => {
    if (position && mapRef.current) {
      mapRef.current.setView([position.coords.latitude, position.coords.longitude], 15, { animate: true });
    }
  }, [position]);

  const handleLocateMe = () => {
    refresh();
    if (position && mapRef.current) {
      mapRef.current.setView([position.coords.latitude, position.coords.longitude], 15, { animate: true });
    }
  };

  const getRouteColor = (route: Route) => {
    if (route.safety_score >= 90) return '#059669'; // dark green
    if (route.safety_score >= 75) return '#1e40af'; // dark blue
    if (route.safety_score >= 60) return '#d97706'; // dark orange
    return '#b91c1c'; // dark red
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {error && (
        <div className="location-error-banner" style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#fee2e2',
          color: '#991b1b',
          padding: '8px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px'
        }}>
          <span>⚠️ {error}</span>
        </div>
      )}

      <button
        onClick={handleLocateMe}
        className="locate-me-btn"
        style={{
          position: 'absolute',
          bottom: '100px', // Above the dock
          right: '20px',
          zIndex: 1000,
          background: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#3b82f6'
        }}
        title="Locate Me"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
        </svg>
      </button>

      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // We'll rely on pinch/scroll or add custom control if needed
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController />
        <MapClickHandler onMapClick={onMapClick} />
        <HeatmapLayer />

        {startLocation && (
          <Marker position={[startLocation.lat, startLocation.lon]} icon={startIcon}>
            <Popup>
              <strong>🔵 Start Location</strong><br />
              {startLocation.name || 'Selected Start Point'}
            </Popup>
          </Marker>
        )}

        {endLocation && (
          <Marker position={[endLocation.lat, endLocation.lon]} icon={endIcon}>
            <Popup>
              <strong>🔴 End Location</strong><br />
              {endLocation.name || 'Selected Destination'}
            </Popup>
          </Marker>
        )}

        {position && (
          <>
            <Marker position={[position.coords.latitude, position.coords.longitude]} icon={currentLocationIcon}>
              <Popup>
                <strong>📍 Your Current Location</strong>
              </Popup>
            </Marker>
            <Circle
              center={[position.coords.latitude, position.coords.longitude]}
              radius={position.coords.accuracy || 50}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.3 }}
            />
          </>
        )}

        {selectedRoute ? (
          <Polyline
            positions={selectedRoute.route.map(p => [p[0], p[1]])}
            color={getRouteColor(selectedRoute)}
            weight={8}
            opacity={1.0}
          />
        ) : (
          routes.map((route, idx) => (
            <Polyline
              key={idx}
              positions={route.route.map(p => [p[0], p[1]])}
              color={getRouteColor(route)}
              weight={5}
              opacity={1.0}
            />
          ))
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
