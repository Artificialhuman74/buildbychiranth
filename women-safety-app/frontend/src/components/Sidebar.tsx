import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { searchPlace, reverseGeocode, optimizeRoute } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';

interface SidebarProps {
  onSetLocationMode: (mode: 'start' | 'end' | null) => void;
  settingLocation: 'start' | 'end' | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onSetLocationMode, settingLocation }) => {
  const {
    startLocation,
    setStartLocation,
    endLocation,
    setEndLocation,
    preferences,
    setPreferences,
    setRoutes,
    showHeatmap,
    setShowHeatmap
  } = useAppContext();

  const [startSearch, setStartSearch] = useState('');
  const [endSearch, setEndSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<'start' | 'end' | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const { position } = useGeolocation(false);

  // Debounce search
  React.useEffect(() => {
    if (!startSearch && !endSearch) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      if (isSearching === 'start' && startSearch.length >= 3) {
        performSearch(startSearch, 'start');
      } else if (isSearching === 'end' && endSearch.length >= 3) {
        performSearch(endSearch, 'end');
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [startSearch, endSearch, isSearching]);

  const performSearch = async (query: string, type: 'start' | 'end') => {
    console.log('🔍 Performing search for:', query, 'type:', type);
    setSearchLoading(true);
    try {
      const results = await searchPlace(query);
      console.log('✅ Search results:', results);
      console.log('Results structure:', JSON.stringify(results, null, 2));
      
      // Handle different response formats
      let places = [];
      if (Array.isArray(results)) {
        // Direct array response
        places = results;
      } else if (results.places && Array.isArray(results.places)) {
        // Nested in places property
        places = results.places;
      } else if (results.results && Array.isArray(results.results)) {
        // Nested in results property
        places = results.results;
      }
      
      console.log('Extracted places:', places, 'Count:', places.length);
      
      if (places.length > 0) {
        setSearchResults(places);
        console.log('📍 Set search results:', places.length, 'places');
      } else {
        setSearchResults([]);
        console.log('❌ No places found in results');
      }
    } catch (error: any) {
      console.error('❌ Search error:', error);
      console.error('Error details:', error.message, error.response);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (value: string, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartSearch(value);
      if (!isSearching || isSearching !== 'start') {
        setIsSearching('start');
      }
    } else {
      setEndSearch(value);
      if (!isSearching || isSearching !== 'end') {
        setIsSearching('end');
      }
    }
  };

  const selectLocation = (place: any, type: 'start' | 'end') => {
    const location = {
      lat: place.lat,
      lon: place.lon,
      name: place.display_name
    };

    if (type === 'start') {
      setStartLocation(location);
      setStartSearch(place.display_name);
    } else {
      setEndLocation(location);
      setEndSearch(place.display_name);
    }
    
    setSearchResults([]);
    setIsSearching(null);
  };

  const clearSearchResults = () => {
    setTimeout(() => {
      setSearchResults([]);
      setIsSearching(null);
    }, 200);
  };

  const useCurrentLocation = async () => {
    if (!position) {
      setStatus('Getting your location...');
      return;
    }

    try {
      const result = await reverseGeocode(position.coords.latitude, position.coords.longitude);
      if (result.success) {
        setStartLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          name: result.display_name || 'Current Location'
        });
        setStartSearch(result.display_name || 'Current Location');
        setStatus('✅ Using current location');
      }
    } catch (error) {
      setStatus('❌ Could not get address');
    }
  };

  const swapLocations = () => {
    if (startLocation && endLocation) {
      const temp = startLocation;
      setStartLocation(endLocation);
      setEndLocation(temp);
      
      const tempSearch = startSearch;
      setStartSearch(endSearch);
      setEndSearch(tempSearch);
      
      setStatus('🔄 Locations swapped');
    }
  };

  const clearLocations = () => {
    setStartLocation(null);
    setEndLocation(null);
    setStartSearch('');
    setEndSearch('');
    setRoutes([]);
    setStatus('🗑️ Locations cleared');
  };

  const findRoutes = async () => {
    if (!startLocation || !endLocation) {
      setStatus('Please select both start and end locations');
      return;
    }

    setLoading(true);
    setStatus('Finding safe routes...');

    try {
      const result = await optimizeRoute({
        start_lat: startLocation.lat,
        start_lon: startLocation.lon,
        end_lat: endLocation.lat,
        end_lon: endLocation.lon,
        ...preferences
      });

      if (result.success && result.routes) {
        setRoutes(result.routes);
        setStatus(`✅ Found ${result.routes.length} routes!`);
      } else {
        setStatus('❌ No routes found');
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>🛡️ Safe Route Planner</h1>
        <p>Find the safest routes in Bangalore</p>
      </div>

      <div className="how-to-use">
        <h3>How to use:</h3>
        <ol>
          <li>Search for locations or use the map to set points</li>
          <li>Set your route preferences and safety priorities</li>
          <li>Click "Find Safe Routes" to get optimized paths</li>
        </ol>
      </div>

      <button className="btn btn-primary" onClick={useCurrentLocation}>
        📍 Use My Current Location
      </button>

      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={swapLocations}
          disabled={!startLocation || !endLocation}
          style={{ flex: 1 }}
        >
          🔄 Swap
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={clearLocations}
          disabled={!startLocation && !endLocation}
          style={{ flex: 1 }}
        >
          🗑️ Clear
        </button>
      </div>

      <div className="location-input">
        <label>🔵 Start Location</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search location in Bangalore..."
              value={startSearch}
              onChange={(e) => handleSearchInputChange(e.target.value, 'start')}
              onFocus={() => {
                console.log('🎯 Start input focused');
                setIsSearching('start');
                if (startSearch.length >= 3 && searchResults.length > 0) {
                  console.log('Showing existing results');
                }
              }}
              onBlur={(e) => {
                // Don't clear if clicking on a result
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (!relatedTarget || !relatedTarget.classList.contains('search-result-item')) {
                  setTimeout(() => {
                    console.log('Clearing search results on blur');
                    clearSearchResults();
                  }, 200);
                }
              }}
              style={{ width: '100%' }}
            />
            {isSearching === 'start' && searchResults.length > 0 && (
              <div className="search-results">
                {searchLoading && (
                  <div className="search-loading">
                    <span className="spinner"></span>
                    Searching...
                  </div>
                )}
                {!searchLoading && searchResults.map((place, idx) => (
                  <div
                    key={idx}
                    className="search-result-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      console.log('Selected place:', place);
                      selectLocation(place, 'start');
                    }}
                  >
                    <div className="search-result-icon">📍</div>
                    <div className="search-result-text">
                      <div className="search-result-name">
                        {place.display_name.split(',')[0]}
                      </div>
                      <div className="search-result-address">
                        {place.display_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isSearching === 'start' && startSearch.length > 0 && startSearch.length < 3 && (
              <div className="search-hint">Type at least 3 characters to search...</div>
            )}
            {isSearching === 'start' && startSearch.length >= 3 && searchResults.length === 0 && !searchLoading && (
              <div className="search-hint">No results found. Try a different search.</div>
            )}
          </div>
          <button 
            className="btn btn-secondary"
            onClick={() => onSetLocationMode(settingLocation === 'start' ? null : 'start')}
            style={{ 
              padding: '12px', 
              minWidth: '100px',
              background: settingLocation === 'start' ? '#10b981' : '#6b7280'
            }}
          >
            {settingLocation === 'start' ? '📍 Click Map' : '🗺️ Set on Map'}
          </button>
        </div>
      </div>

      <div className="location-input">
        <label>🔴 End Location</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search destination in Bangalore..."
              value={endSearch}
              onChange={(e) => handleSearchInputChange(e.target.value, 'end')}
              onFocus={() => {
                console.log('🎯 End input focused');
                setIsSearching('end');
              }}
              onBlur={(e) => {
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (!relatedTarget || !relatedTarget.classList.contains('search-result-item')) {
                  setTimeout(() => clearSearchResults(), 200);
                }
              }}
              style={{ width: '100%' }}
            />
            {isSearching === 'end' && searchResults.length > 0 && (
              <div className="search-results">
                {searchLoading && (
                  <div className="search-loading">
                    <span className="spinner"></span>
                    Searching...
                  </div>
                )}
                {!searchLoading && searchResults.map((place, idx) => (
                  <div
                    key={idx}
                    className="search-result-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      console.log('Selected place:', place);
                      selectLocation(place, 'end');
                    }}
                  >
                    <div className="search-result-icon">📍</div>
                    <div className="search-result-text">
                      <div className="search-result-name">
                        {place.display_name.split(',')[0]}
                      </div>
                      <div className="search-result-address">
                        {place.display_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isSearching === 'end' && endSearch.length > 0 && endSearch.length < 3 && (
              <div className="search-hint">Type at least 3 characters to search...</div>
            )}
            {isSearching === 'end' && endSearch.length >= 3 && searchResults.length === 0 && !searchLoading && (
              <div className="search-hint">No results found. Try a different search.</div>
            )}
          </div>
          <button 
            className="btn btn-secondary"
            onClick={() => onSetLocationMode(settingLocation === 'end' ? null : 'end')}
            style={{ 
              padding: '12px', 
              minWidth: '100px',
              background: settingLocation === 'end' ? '#10b981' : '#6b7280'
            }}
          >
            {settingLocation === 'end' ? '📍 Click Map' : '🗺️ Set on Map'}
          </button>
        </div>
      </div>

      <div className="preferences-section">
        <h3>Route Preferences</h3>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={preferences.prefer_main_roads}
            onChange={(e) => setPreferences({ ...preferences, prefer_main_roads: e.target.checked })}
          />
          Prefer Main Roads
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={preferences.prefer_well_lit}
            onChange={(e) => setPreferences({ ...preferences, prefer_well_lit: e.target.checked })}
          />
          Prefer Well-Lit Areas
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={preferences.prefer_populated}
            onChange={(e) => setPreferences({ ...preferences, prefer_populated: e.target.checked })}
          />
          Prefer Populated Areas
        </label>

        <div className="slider-group">
          <label>Safety Priority: {Math.round(preferences.safety_weight * 100)}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={preferences.safety_weight * 100}
            onChange={(e) => {
              const safety = parseInt(e.target.value) / 100;
              setPreferences({
                ...preferences,
                safety_weight: safety,
                distance_weight: 1 - safety
              });
            }}
          />
        </div>

        <div className="slider-group">
          <label>Distance Priority: {Math.round(preferences.distance_weight * 100)}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={preferences.distance_weight * 100}
            onChange={(e) => {
              const distance = parseInt(e.target.value) / 100;
              setPreferences({
                ...preferences,
                distance_weight: distance,
                safety_weight: 1 - distance
              });
            }}
          />
        </div>
      </div>

      <button
        className="btn btn-success btn-large"
        onClick={findRoutes}
        disabled={loading || !startLocation || !endLocation}
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Finding Routes...
          </>
        ) : (
          '🔍 Find Safe Routes'
        )}
      </button>

      {status && <div className="status-message">{status}</div>}

      <div className="heatmap-section">
        <h3>Heatmap Overlays</h3>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showHeatmap.crime}
            onChange={(e) => setShowHeatmap({ ...showHeatmap, crime: e.target.checked })}
          />
          🚨 Crime Data
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showHeatmap.lighting}
            onChange={(e) => setShowHeatmap({ ...showHeatmap, lighting: e.target.checked })}
          />
          💡 Street Lighting
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showHeatmap.population}
            onChange={(e) => setShowHeatmap({ ...showHeatmap, population: e.target.checked })}
          />
          👥 Population Density
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showHeatmap.userFeedback}
            onChange={(e) => setShowHeatmap({ ...showHeatmap, userFeedback: e.target.checked })}
          />
          📍 User Reports (Unsafe Areas)
        </label>
      </div>
    </div>
  );
};

export default Sidebar;
