"""
Enhanced Safe Routes Algorithm
Integrates crime-aware routing with comprehensive safety scoring
"""

import hashlib
import requests
import pandas as pd
import numpy as np
from math import radians, cos, sin, asin, sqrt

def calculate_route_hash(route):
    """Create hash for route deduplication"""
    if not route or len(route) < 2:
        return None
    sample_indices = [0, len(route)//4, len(route)//2, 3*len(route)//4, len(route)-1]
    sample_points = [route[i] for i in sample_indices if i < len(route)]
    hash_string = ''.join([f"{lat:.4f},{lon:.4f}" for lat, lon in sample_points])
    return hashlib.md5(hash_string.encode()).hexdigest()

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km"""
    try:
        lat1, lon1, lat2, lon2 = map(radians, [float(lat1), float(lon1), float(lat2), float(lon2)])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        return c * 6371
    except:
        return 0

def calculate_crime_exposure(lat, lon, crime_data, radius=0.003):
    """Calculate crime exposure at a location"""
    try:
        if crime_data.empty:
            return 0
        nearby_crimes = crime_data[
            (abs(crime_data['Latitude'] - lat) < radius) &
            (abs(crime_data['Longitude'] - lon) < radius)
        ]
        return len(nearby_crimes)
    except:
        return 0

def calculate_lighting_score(lat, lon, lighting_data, radius=0.005):
    """Calculate lighting score at a location"""
    try:
        if lighting_data.empty:
            return 5.0
        nearby_lighting = lighting_data[
            (abs(lighting_data['Latitude'] - lat) < radius) &
            (abs(lighting_data['Longitude'] - lon) < radius)
        ]
        return nearby_lighting['lighting_score'].mean() if len(nearby_lighting) > 0 else 5.0
    except:
        return 5.0

def calculate_population_score(lat, lon, population_data, radius=0.005):
    """Calculate population/traffic score at a location"""
    try:
        if population_data.empty:
            return 5.0, 5.0, False
        nearby_pop = population_data[
            (abs(population_data['Latitude'] - lat) < radius) &
            (abs(population_data['Longitude'] - lon) < radius)
        ]
        if len(nearby_pop) > 0:
            return (
                nearby_pop['population_density'].mean() / 1000,
                nearby_pop['traffic_level'].mean() / 10,
                nearby_pop['is_main_road'].mean() > 0.5
            )
        return 5.0, 5.0, False
    except:
        return 5.0, 5.0, False

def calculate_route_safety_comprehensive(route, crime_data, lighting_data, population_data, preferences=None):
    """Enhanced safety calculation with crime hotspot detection and preference multipliers"""
    if not route or len(route) < 2:
        return None
    
    if preferences is None:
        preferences = {}
    
    try:
        sample_rate = max(1, len(route) // 50)
        sampled_route = route[::sample_rate]
        
        total_crime = 0
        max_crime_at_point = 0
        crime_hotspot_count = 0
        total_lighting = 0
        total_population = 0
        total_traffic = 0
        main_road_count = 0
        
        for lat, lon in sampled_route:
            crime_count = calculate_crime_exposure(lat, lon, crime_data, radius=0.003)
            total_crime += crime_count
            max_crime_at_point = max(max_crime_at_point, crime_count)
            if crime_count > 3:
                crime_hotspot_count += 1
            
            light_score = calculate_lighting_score(lat, lon, lighting_data, radius=0.005)
            total_lighting += light_score
            
            pop_score, traffic_score, is_main_road = calculate_population_score(lat, lon, population_data, radius=0.005)
            total_population += pop_score
            total_traffic += traffic_score
            if is_main_road:
                main_road_count += 1
        
        n_points = len(sampled_route)
        
        avg_crime = total_crime / n_points
        avg_lighting = total_lighting / n_points
        avg_population = total_population / n_points
        avg_traffic = total_traffic / n_points
        main_road_pct = (main_road_count / n_points) * 100
        crime_hotspot_pct = (crime_hotspot_count / n_points) * 100
        
        # Enhanced crime penalty calculation with exponential scaling
        base_crime_penalty = min(40, avg_crime ** 1.2 * 5)
        max_crime_penalty = min(40, max_crime_at_point ** 1.4 * 7)
        hotspot_penalty = min(30, crime_hotspot_pct * 0.5)
        
        total_crime_penalty = base_crime_penalty + max_crime_penalty + hotspot_penalty
        
        base_safety_score = max(0, 100 - total_crime_penalty)
        
        # Preference-based multipliers
        lighting_multiplier = 1.0 + (avg_lighting / 10) * (2.5 if preferences.get('prefer_well_lit') else 0.8)
        population_multiplier = 1.0 + (avg_population / 10) * (2.0 if preferences.get('prefer_populated') else 0.6)
        traffic_multiplier = 1.0 + (avg_traffic / 10) * (1.5 if preferences.get('prefer_populated') else 0.4)
        main_road_multiplier = 1.0 + (main_road_pct / 100) * (2.5 if preferences.get('prefer_main_roads') else 0.7)
        
        total_multiplier = (lighting_multiplier + population_multiplier + traffic_multiplier + main_road_multiplier) / 4
        
        final_safety_score = min(100, base_safety_score * total_multiplier)
        
        crime_density_score = 100 - min(100, avg_crime * 10)
        
        return {
            'safety_score': round(final_safety_score, 2),
            'crime_density': round(avg_crime, 2),
            'max_crime_exposure': round(max_crime_at_point, 2),
            'crime_hotspot_percentage': round(crime_hotspot_pct, 2),
            'lighting_score': round(avg_lighting, 2),
            'population_score': round(avg_population, 2),
            'traffic_score': round(avg_traffic, 2),
            'main_road_percentage': round(main_road_pct, 2),
            'crime_density_score': round(crime_density_score, 2)
        }
        
    except Exception as e:
        print(f"Error calculating safety: {e}")
        return None

def get_route_from_osrm(start_lat, start_lon, end_lat, end_lon, waypoint=None):
    """Get route from OSRM with optional waypoint, includes turn-by-turn steps"""
    try:
        if waypoint:
            url = f"http://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{waypoint['lon']},{waypoint['lat']};{end_lon},{end_lat}"
        else:
            url = f"http://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}"
        
        params = {
            'overview': 'full',
            'geometries': 'geojson',
            'alternatives': 'true',
            'steps': 'true'
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data['code'] != 'Ok':
            return None
        
        routes = []
        for route_data in data.get('routes', []):
            if 'geometry' not in route_data:
                continue
            
            coordinates = route_data['geometry']['coordinates']
            if not coordinates or len(coordinates) < 2:
                continue
            
            route = [[coord[1], coord[0]] for coord in coordinates]
            
            # Verify route endpoints
            start_dist = haversine_distance(start_lat, start_lon, route[0][0], route[0][1])
            end_dist = haversine_distance(end_lat, end_lon, route[-1][0], route[-1][1])
            
            if start_dist > 0.2 or end_dist > 0.2:
                continue
            
            # Extract turn-by-turn instructions from OSRM
            steps = []
            if 'legs' in route_data:
                step_number = 1
                for leg in route_data['legs']:
                    if 'steps' in leg:
                        for step in leg['steps']:
                            if 'maneuver' in step:
                                instruction = step['maneuver'].get('instruction', step.get('name', 'Continue'))
                                distance = step.get('distance', 0)
                                steps.append({
                                    'number': step_number,
                                    'instruction': instruction,
                                    'distance': round(distance, 1),
                                    'distance_text': f"{distance:.0f}m" if distance < 1000 else f"{distance/1000:.1f}km"
                                })
                                step_number += 1
            
            routes.append({
                'route': route,
                'distance_km': route_data['distance'] / 1000,
                'duration_min': route_data['duration'] / 60,
                'waypoint': waypoint,
                'steps': steps
            })
        
        return routes
        
    except Exception as e:
        print(f"OSRM error: {e}")
        return None

def calculate_composite_score(route, preferences):
    """Calculate composite score with preference-based weighting"""
    safety_weight = preferences.get('safety_weight', 0.7)
    distance_weight = preferences.get('distance_weight', 0.3)
    
    safety_score = route.get('safety_score', 50)
    distance_km = route.get('distance_km', 10)
    crime_density = route.get('crime_density', 5)
    max_crime = route.get('max_crime_exposure', 5)
    
    normalized_safety = safety_score / 100
    normalized_distance = max(0, 1 - (distance_km / 30))
    
    crime_penalty = (crime_density * 0.3 + max_crime * 0.7) / 20
    crime_penalty = min(1, crime_penalty)
    
    safety_component = normalized_safety * (1 - crime_penalty * 0.5)
    
    preference_bonus = 0
    if preferences.get('prefer_main_roads'):
        main_road_pct = route.get('main_road_percentage', 0)
        preference_bonus += (main_road_pct / 100) * 0.15
    
    if preferences.get('prefer_well_lit'):
        lighting_score = route.get('lighting_score', 5)
        preference_bonus += (lighting_score / 10) * 0.15
    
    if preferences.get('prefer_populated'):
        population_score = route.get('population_score', 5)
        preference_bonus += (population_score / 10) * 0.15
    
    composite_score = (safety_component * safety_weight + 
                      normalized_distance * distance_weight + 
                      preference_bonus)
    
    return composite_score
