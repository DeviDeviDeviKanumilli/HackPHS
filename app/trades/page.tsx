'use client';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
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
  id: string;
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
  canRequest?: boolean;
  userRequestStatus?: string | null;
  userRequestId?: string | null;
}

export default function TradesPage() {
  const { data: session } = useSession();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState(50);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'newest' | 'oldest'>('newest');
  const [showMyTrades, setShowMyTrades] = useState(false);

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

  // Filter and sort trades
  useEffect(() => {
    let result = [...trades];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (trade) =>
          trade.offeredItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trade.requestedItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trade.ownerId.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by my trades
    if (showMyTrades && session?.user?.id) {
      result = result.filter((trade) => trade.ownerId._id === session.user.id);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || Infinity) - (b.distance || Infinity);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredTrades(result);
  }, [trades, searchQuery, sortBy, showMyTrades, session]);

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
          setZipCode(''); // Clear zip code when using geolocation
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter a zip code instead.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSendTradeRequest = async (tradeId: string) => {
    if (!session?.user?.id) {
      alert('Please log in to send trade requests');
      return;
    }

    try {
      const response = await fetch(`/api/trades/${tradeId}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: '' }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Trade request sent successfully!');
        // Refresh trades
        fetchTrades();
      } else {
        alert(data.error || 'Failed to send trade request');
      }
    } catch (error) {
      console.error('Error sending trade request:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Memoized Trade Card Component
  const TradeCard = memo(({ trade, index }: { trade: Trade; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-plant-green-800 dark:text-plant-green-200 mb-2">
            🌱 {trade.offeredItem}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Looking for: <span className="font-semibold text-blue-600 dark:text-blue-400">🔍 {trade.requestedItem}</span>
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3 flex-wrap gap-2">
            <Link
              href={`/profile/${trade.ownerId._id}`}
              className="font-semibold text-plant-green-600 dark:text-plant-green-400 hover:underline"
            >
              👤 {trade.ownerId.username}
            </Link>
            <span>📍 {trade.locationZip}</span>
            {trade.distance !== undefined && (
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                📏 {trade.distance.toFixed(1)} mi
              </span>
            )}
            <span className="text-xs text-gray-400">
              🕒 {new Date(trade.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
          {trade.status}
        </span>
      </div>
      <div className="flex items-center space-x-3 flex-wrap gap-2">
        <Link
          href={`/profile/${trade.ownerId._id}`}
          prefetch={true}
          className="px-4 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold text-sm"
          aria-label={`View ${trade.ownerId.username}'s profile`}
          onMouseEnter={() => {
            if (trade.ownerId?._id) {
              import('@/lib/routePrefetch').then(({ prefetchRoute }) => {
                prefetchRoute(`/profile/${trade.ownerId._id}`);
              });
            }
          }}
        >
          View Profile
        </Link>
        {session?.user?.id && trade.ownerId._id !== session.user.id && (
          <>
            {trade.canRequest && trade.status === 'active' && (
              <button
                onClick={() => handleSendTradeRequest(trade._id || trade.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
              >
                📩 Send Trade Request
              </button>
            )}
            {trade.userRequestStatus === 'pending' && (
              <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-semibold text-sm">
                ⏳ Request Pending
              </span>
            )}
            {trade.status === 'pending' && trade.counterpartyId && (
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                ✅ Trade Accepted
              </span>
            )}
            <Link
              href={`/messages/${trade.ownerId._id}`}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
            >
              💬 Message
            </Link>
          </>
        )}
      </div>
    </motion.div>
  ));

  TradeCard.displayName = 'TradeCard';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-plant-green-800 dark:text-plant-green-200 mb-2">
              Plant Trades 🌿
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {filteredTrades.length} {filteredTrades.length === 1 ? 'trade' : 'trades'} available
            </p>
          </div>
          {session && (
            <Link
              href="/trades/new"
              className="px-6 py-3 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold shadow-md hover:shadow-lg"
            >
              + Create Trade
            </Link>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔍 Search
              </label>
              <input
                type="text"
                placeholder="Search plants or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Zip Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📍 Zip Code
              </label>
              <input
                type="text"
                placeholder="12345"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📏 Radius: {radius} miles
              </label>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔄 Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="distance">Closest First</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            <button
              onClick={handleLocationRequest}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
            >
              📍 Use My Location
            </button>
            {session && (
              <button
                onClick={() => setShowMyTrades(!showMyTrades)}
                className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
                  showMyTrades
                    ? 'bg-plant-green-600 text-white hover:bg-plant-green-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {showMyTrades ? '✓ My Trades Only' : 'Show My Trades'}
              </button>
            )}
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold text-sm"
            >
              {viewMode === 'list' ? '🗺️ Map View' : '📋 List View'}
            </button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonTradeCard key={i} />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        filteredTrades.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md"
          >
            <span className="text-6xl mb-4 block">🌱</span>
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-2">
              {searchQuery || showMyTrades ? 'No matching trades found' : 'No trades available'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {session ? 'Try adjusting your filters or create a new trade!' : 'Sign in to create trades'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredTrades.map((trade, index) => (
                <TradeCard key={trade._id} trade={trade} index={index} />
              ))}
            </div>
          </AnimatePresence>
        )
      ) : (
        <div className="h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <MapView trades={filteredTrades} userLocation={userLocation} />
        </div>
      )}
    </div>
  );
}
