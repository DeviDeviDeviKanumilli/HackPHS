'use client';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { SkeletonTradeCard } from '@/components/SkeletonLoader';

// Dynamically import map wrapper to avoid SSR issues and double initialization
const MapView = dynamic(() => import('@/components/MapViewWrapper'), {
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
      const queryLower = searchQuery.toLowerCase();
      result = result.filter(
        (trade) =>
          trade.offeredItem?.toLowerCase().includes(queryLower) ||
          trade.requestedItem?.toLowerCase().includes(queryLower) ||
          trade.ownerId?.username?.toLowerCase().includes(queryLower)
      );
    }

    // Filter by my trades
    if (showMyTrades && session?.user?.id) {
      result = result.filter((trade) => trade.ownerId?._id === session.user.id);
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
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-plant-green-800 dark:text-plant-green-200 mb-2 group-hover:text-plant-green-600 dark:group-hover:text-plant-green-400 transition-colors">
            🌱 {trade.offeredItem}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            Looking for: <span className="font-semibold text-blue-600 dark:text-blue-400">🔍 {trade.requestedItem}</span>
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3 flex-wrap gap-2">
            <Link
              href={`/profile/${trade.ownerId._id}`}
              className="font-semibold text-plant-green-600 dark:text-plant-green-400 hover:text-plant-green-700 dark:hover:text-plant-green-300 transition-colors"
            >
              👤 {trade.ownerId.username}
            </Link>
            <span className="flex items-center gap-1">📍 {trade.locationZip}</span>
            {trade.distance !== undefined && (
              <span className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                📏 {trade.distance.toFixed(1)} mi
              </span>
            )}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              🕒 {new Date(trade.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <span className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-700 dark:text-green-300 rounded-xl text-xs font-semibold shadow-sm">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-plant-green-800 dark:text-plant-green-200 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-plant-green-600 to-emerald-500">
                Plant Trades 🌿
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {filteredTrades.length} {filteredTrades.length === 1 ? 'trade' : 'trades'} available
              </p>
            </div>
            {session && (
              <Link
                href="/trades/new"
                className="px-6 py-3 bg-gradient-to-r from-plant-green-600 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold transform hover:scale-105"
              >
                + Create Trade
              </Link>
            )}
          </div>

          {/* Filters and Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700"
          >
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                🔍 Search
              </label>
              <input
                type="text"
                placeholder="Search plants or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-plant-green-500 focus:border-plant-green-500 dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            {/* Zip Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                📍 Zip Code
              </label>
              <input
                type="text"
                placeholder="12345"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-plant-green-500 focus:border-plant-green-500 dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                📏 Radius
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-plant-green-500 focus:border-plant-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
              >
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
                <option value="75">75 miles</option>
                <option value="100">100 miles</option>
                <option value="150">150 miles</option>
                <option value="200">200 miles</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                🔄 Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-plant-green-500 focus:border-plant-green-500 dark:bg-gray-700 dark:text-white transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="distance">Closest First</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
            <motion.button
              onClick={handleLocationRequest}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-sm"
            >
              📍 Use My Location
            </motion.button>
            {session && (
              <motion.button
                onClick={() => setShowMyTrades(!showMyTrades)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-xl transition-all font-semibold text-sm ${
                  showMyTrades
                    ? 'bg-gradient-to-r from-plant-green-600 to-emerald-500 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {showMyTrades ? '✓ My Trades Only' : 'Show My Trades'}
              </motion.button>
            )}
            <motion.button
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold text-sm"
            >
              {viewMode === 'list' ? '🗺️ Map View' : '📋 List View'}
            </motion.button>
          </div>
          </motion.div>
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
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <span className="text-7xl mb-4 block">🌱</span>
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
        <div className="h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
          <MapView trades={filteredTrades} userLocation={userLocation} />
        </div>
      )}
      </div>
    </div>
  );
}
