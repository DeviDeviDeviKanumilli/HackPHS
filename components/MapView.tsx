'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue with Leaflet in Next.js
const defaultIcon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Custom icon for user location
const userIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Set default icon for all markers
L.Marker.prototype.options.icon = defaultIcon;

interface Trade {
  _id: string;
  offeredItem: string;
  requestedItem: string;
  locationZip: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  ownerId: {
    username: string;
    _id: string;
  };
  distance?: number;
}

interface MapViewProps {
  trades: Trade[];
  userLocation?: { lat: number; lng: number } | null;
}

// Component to handle map updates
function MapUpdater({ trades, userLocation }: MapViewProps) {
  const map = useMap();

  useEffect(() => {
    if (trades.length > 0 || userLocation) {
      const bounds = L.latLngBounds([]);
      
      // Add trade locations to bounds
      trades.forEach(trade => {
        bounds.extend([trade.coordinates.lat, trade.coordinates.lng]);
      });
      
      // Add user location to bounds
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      
      // Fit map to bounds with padding
      if (bounds.isValid()) {
        map.fitBounds(bounds, { 
          padding: [20, 20],
          maxZoom: 15 
        });
      }
    }
  }, [map, trades, userLocation]);

  return null;
}

export default function MapView({ trades, userLocation }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const mapRef = useRef<L.Map | null>(null);

  // Default center (US center)
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  
  // Calculate center based on trades or user location
  const center: [number, number] = useCallback(() => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    if (trades.length > 0) {
      return [trades[0].coordinates.lat, trades[0].coordinates.lng];
    }
    return defaultCenter;
  }, [trades, userLocation])();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Force re-render when critical props change to prevent initialization errors
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapKey(prev => prev + 1);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [trades.length, userLocation?.lat, userLocation?.lng]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
      <MapContainer
        key={mapKey}
        center={center}
        zoom={userLocation ? 12 : 5}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg z-0"
        scrollWheelZoom={true}
        zoomControl={true}
        ref={(mapInstance) => {
          if (mapInstance) {
            mapRef.current = mapInstance;
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />
        
        <MapUpdater trades={trades} userLocation={userLocation} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup>
              <div className="p-2 text-center">
                <div className="font-semibold text-blue-600 mb-1">📍 Your Location</div>
                <div className="text-xs text-gray-500">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Trade markers */}
        {trades.map((trade) => (
          <Marker
            key={trade._id}
            position={[trade.coordinates.lat, trade.coordinates.lng]}
            icon={defaultIcon}
          >
            <Popup maxWidth={250}>
              <div className="p-3">
                <h3 className="font-semibold text-plant-green-800 mb-2 text-sm">
                  🌱 {trade.offeredItem}
                </h3>
                <div className="space-y-1 text-xs">
                  <p className="text-gray-600">
                    <span className="font-medium">Looking for:</span> {trade.requestedItem}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Trader:</span> {trade.ownerId?.username}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Location:</span> {trade.locationZip}
                  </p>
                  {trade.distance !== undefined && (
                    <p className="text-plant-green-600 font-semibold mt-2">
                      📏 {trade.distance.toFixed(1)} miles away
                    </p>
                  )}
                </div>
                <button className="mt-2 w-full bg-plant-green-600 text-white text-xs py-1 px-2 rounded hover:bg-plant-green-700 transition-colors">
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map controls overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 text-xs">
        <div className="text-gray-700 font-medium">
          {trades.length} trade{trades.length !== 1 ? 's' : ''} shown
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3">
        <div className="text-sm font-medium text-gray-800 mb-2">Legend</div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-plant-green-500 rounded-full border border-white shadow-sm"></div>
            <span className="text-xs text-gray-700">Available Trades</span>
          </div>
          {userLocation && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full border border-white shadow-sm"></div>
              <span className="text-xs text-gray-700">Your Location</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Map instructions for mobile */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 sm:hidden">
        <div className="text-xs text-gray-600">
          📱 Pinch to zoom, drag to pan
        </div>
      </div>
    </div>
  );
}