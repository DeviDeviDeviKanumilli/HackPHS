'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue with Leaflet in Next.js
const icon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

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
}

export default function MapView({ trades }: MapViewProps) {
  // Default to US center if no trades
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const center: [number, number] =
    trades.length > 0
      ? [trades[0].coordinates.lat, trades[0].coordinates.lng]
      : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {trades.map((trade) => (
          <Marker
          key={trade._id}
          position={[trade.coordinates.lat, trade.coordinates.lng]}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-plant-green-800 mb-2">
                {trade.offeredItem}
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                Looking for: <span className="font-semibold">{trade.requestedItem}</span>
              </p>
              <p className="text-xs text-gray-500">
                By: {trade.ownerId?.username}
              </p>
              <p className="text-xs text-gray-500">
                Location: {trade.locationZip}
              </p>
              {trade.distance !== undefined && (
                <p className="text-xs text-plant-green-600 font-semibold mt-1">
                  {trade.distance.toFixed(1)} miles away
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

