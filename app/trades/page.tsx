'use client';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { SkeletonTradeCard } from '@/components/SkeletonLoader';

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

  // Memoize fetchTrades to prevent unnecessary re-renders
  const fetchTrades = useCallback(async () => {
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
  }, [zipCode, userLocation, radius]);

  // Optimized: Single effect with proper dependencies
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]); // Only re-fetch when fetchTrades changes

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          // Clear zip code when using location
          setZipCode('');
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter a zip code.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please enter a zip code.');
    }
  };

  // Memoized Trade Card Component
  const TradeCard = memo(({ trade, index }: { trade: Trade; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-plant-green-800 dark:text-plant-green-200 mb-2">
            Offering: {trade.offeredItem}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Looking for: <span className="font-semibold">{trade.requestedItem}</span>
          </p>
        </div>
        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
          {trade.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4 flex-wrap gap-2">
        <span>By: {trade.ownerId?.username}</span>
        <span>📍 {trade.locationZip}</span>
        {trade.distance !== undefined && (
          <span className="font-semibold text-plant-green-600 dark:text-plant-green-400">
            {trade.distance.toFixed(1)} miles away
          </span>
        )}
      </div>
      <Link
        href={`/profile/${trade.ownerId?._id}`}
        prefetch={true}
        className="text-plant-green-600 dark:text-plant-green-400 hover:text-plant-green-700 dark:hover:text-plant-green-300 font-semibold text-sm inline-flex items-center gap-1"
        aria-label={`View ${trade.ownerId?.username}'s profile`}
        onMouseEnter={() => {
          if (trade.ownerId?._id) {
            import('@/lib/routePrefetch').then(({ prefetchRoute }) => {
              prefetchRoute(`/profile/${trade.ownerId._id}`);
            });
          }
        }}
      >
        View Profile →
      </Link>
    </motion.div>
  ));

  TradeCard.displayName = 'TradeCard';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
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
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip Code
              </label>
              <input
                type="text"
                placeholder="Enter zip code (e.g. 90210)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && zipCode.trim()) {
                    fetchTrades();
                  }
                }}
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
                onClick={fetchTrades}
                disabled={!zipCode.trim() && !userLocation}
                className="w-full px-4 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Search Trades
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleLocationRequest}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Use My Location
              </button>
            </div>
          </div>
          {(!zipCode && !userLocation) && (
            <p className="text-sm text-gray-500 mt-4">
              💡 Enter a zip code or use your location to filter trades by distance
            </p>
          )}
        </div>

        {session && (
          <Link
            href="/trades/new"
            prefetch={true}
            className="inline-block px-6 py-3 bg-gradient-plant text-white rounded-lg hover:shadow-lg transition-all font-semibold mb-6"
            onMouseEnter={() => {
              import('@/lib/routePrefetch').then(({ prefetchRoute }) => {
                prefetchRoute('/trades/new');
              });
            }}
          >
            Create New Trade Offer
          </Link>
        )}
      </motion.div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonTradeCard key={i} />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        trades.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <span className="text-6xl mb-4 block">🌱</span>
            <p className="text-gray-600 dark:text-gray-300">No trades found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {trades.map((trade, index) => (
              <TradeCard key={trade._id} trade={trade} index={index} />
            ))}
          </div>
        )
      ) : (
        <div className="h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <MapView trades={trades} userLocation={userLocation} />
        </div>
      )}
    </div>
  );
}

