'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import map component to avoid SSR issues
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center">Loading map...</div>,
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
  status: string;
  createdAt: string;
  ownerId: {
    username: string;
    _id: string;
  };
  distance?: number;
}

export default function TradesPage() {
  const { data: session } = useSession();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState(50);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchTrades();
  }, [zipCode, radius]);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      let url = '/api/trades';
      const params = new URLSearchParams();
      
      if (zipCode) {
        params.append('zip', zipCode);
      }
      
      if (userLocation) {
        params.append('lat', userLocation.lat.toString());
        params.append('lng', userLocation.lng.toString());
      }
      
      params.append('radius', radius.toString());
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter a zip code.');
        }
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-4xl font-bold text-plant-green-800 mb-4 md:mb-0">
            Plant Trades 🔄
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-plant-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                viewMode === 'map'
                  ? 'bg-plant-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Map View
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip Code
              </label>
              <input
                type="text"
                placeholder="Enter zip code"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Radius (miles)
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
              >
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
                <option value="100">100 miles</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleLocationRequest}
                className="w-full px-4 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold"
              >
                Use My Location
              </button>
            </div>
          </div>
        </div>

        {session && (
          <Link
            href="/trades/new"
            className="inline-block px-6 py-3 bg-gradient-plant text-white rounded-lg hover:shadow-lg transition-all font-semibold mb-6"
          >
            Create New Trade Offer
          </Link>
        )}
      </motion.div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-plant-green-600">Loading trades...</div>
        </div>
      ) : viewMode === 'list' ? (
        trades.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <span className="text-6xl mb-4 block">🌱</span>
            <p className="text-gray-600">No trades found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {trades.map((trade) => (
              <motion.div
                key={trade._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-plant-green-800 mb-2">
                      Offering: {trade.offeredItem}
                    </h3>
                    <p className="text-gray-600">
                      Looking for: <span className="font-semibold">{trade.requestedItem}</span>
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {trade.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>By: {trade.ownerId?.username}</span>
                  <span>📍 {trade.locationZip}</span>
                  {trade.distance !== undefined && (
                    <span>📍 {trade.distance.toFixed(1)} miles away</span>
                  )}
                </div>
                <Link
                  href={`/profile/${trade.ownerId?._id}`}
                  className="text-plant-green-600 hover:text-plant-green-700 font-semibold text-sm"
                >
                  View Profile →
                </Link>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="h-[600px] bg-white rounded-xl shadow-md overflow-hidden">
          <MapView trades={trades} />
        </div>
      )}
    </div>
  );
}

