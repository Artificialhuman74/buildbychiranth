import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Route } from '../types';
import { rateRoute, submitUnsafeSegments } from '../services/api';

interface Props {
  route: Route;
  onClose: () => void;
}

const MapClickHandler: React.FC<{ 
  onMapClick: (lat: number, lon: number) => void;
  isSelecting: boolean;
}> = ({ onMapClick, isSelecting }) => {
  useMapEvents({
    click: (e) => {
      if (isSelecting) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const FeedbackModal: React.FC<Props> = ({ route, onClose }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showMapSelection, setShowMapSelection] = useState(false);
  const [unsafeAreas, setUnsafeAreas] = useState<Array<{lat: number, lon: number}>>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleRatingClick = (value: number) => {
    setRating(value);
    if (value < 3) {
      setShowMapSelection(true);
    } else {
      setShowMapSelection(false);
      setUnsafeAreas([]);
    }
  };

  const handleMapClick = (lat: number, lon: number) => {
    setUnsafeAreas([...unsafeAreas, { lat, lon }]);
  };

  const clearLastArea = () => {
    setUnsafeAreas(unsafeAreas.slice(0, -1));
  };

  const clearAllAreas = () => {
    setUnsafeAreas([]);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      if (showMapSelection && unsafeAreas.length > 0) {
        await submitUnsafeSegments({
          route_id: `route_${route.rank}`,
          rating,
          unsafe_segments: unsafeAreas,
          route_data: route
        });
      } else {
        await rateRoute({
          route_id: `route_${route.rank}`,
          rating,
          feedback
        });
      }

      alert('Thank you for your feedback!');
      onClose();
    } catch (error) {
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const routeCenter: [number, number] = route.route.length > 0 
    ? [route.route[Math.floor(route.route.length / 2)][0], route.route[Math.floor(route.route.length / 2)][1]]
    : [12.9716, 77.5946];

  const routeColor = route.safety_score >= 90 ? '#059669' : 
                     route.safety_score >= 75 ? '#1e40af' : 
                     route.safety_score >= 60 ? '#d97706' : '#b91c1c';

  // Create markers for unsafe areas
  const unsafeIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="white" stroke-width="3"/>
        <text x="16" y="21" text-anchor="middle" fill="white" font-size="18" font-weight="bold">!</text>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⭐ Rate This Route</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="route-summary">
            <p><strong>{route.description}</strong></p>
            <p>{route.distance_display} • {route.duration_display}</p>
          </div>

          <div className="rating-section">
            <label>How was your experience?</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${rating >= star ? 'filled' : ''}`}
                  onClick={() => handleRatingClick(star)}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>

          {showMapSelection && (
            <div className="map-selection-section">
              <div className="alert alert-warning">
                <strong>⚠️ Mark Unsafe Areas</strong>
                <p>Click on the map to mark locations where you felt unsafe.</p>
                <p><strong>💡 Tip:</strong> Click multiple times to mark different unsafe spots!</p>
              </div>

              <div className="map-controls">
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={clearLastArea}
                  disabled={unsafeAreas.length === 0}
                >
                  ↶ Undo Last
                </button>
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={clearAllAreas}
                  disabled={unsafeAreas.length === 0}
                >
                  ✕ Clear All ({unsafeAreas.length})
                </button>
              </div>

              <div className="feedback-map-container">
                <MapContainer
                  center={routeCenter}
                  zoom={14}
                  style={{ height: '400px', width: '100%', borderRadius: '8px' }}
                  zoomControl={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <MapClickHandler onMapClick={handleMapClick} isSelecting={showMapSelection} />
                  
                  {/* Route line */}
                  <Polyline
                    positions={route.route.map(p => [p[0], p[1]])}
                    color={routeColor}
                    weight={5}
                    opacity={0.7}
                  />

                  {/* Unsafe area markers */}
                  {unsafeAreas.map((area, idx) => (
                    <Marker 
                      key={idx}
                      position={[area.lat, area.lon]}
                      icon={unsafeIcon}
                    />
                  ))}
                </MapContainer>
              </div>
            </div>
          )}

          <div className="feedback-section">
            <label>Additional feedback (optional):</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={4}
            />
          </div>

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
            >
              {submitting ? '⏳ Submitting...' : '✅ Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;


