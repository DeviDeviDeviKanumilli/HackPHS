'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface TradeRequest {
  id: string;
  requesterId: string;
  status: string;
  message?: string;
  createdAt: string;
  requester: {
    _id: string;
    username: string;
  };
}

interface Trade {
  id: string;
  _id: string;
  offeredItem: string;
  requestedItem: string;
  locationZip: string;
  status: string;
  createdAt: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  ownerId: {
    _id: string;
    username: string;
  };
  requests?: TradeRequest[];
  counterpartyId?: string | null;
  counterparty?: {
    _id: string;
    username: string;
  } | null;
}

export default function MyTradesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session) {
      fetchMyTrades();
    }
  }, [session, status, router]);

  const fetchMyTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trades/my');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch trades' }));
        console.error('Error fetching trades:', errorData);
        setTrades([]);
        return;
      }

      const data = await response.json();
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const updateTradeStatus = async (tradeId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setTrades(
          trades.map((trade) =>
            trade.id === tradeId || trade._id === tradeId
              ? { ...trade, status: newStatus }
              : trade
          )
        );
      } else {
        alert('Failed to update trade status');
      }
    } catch (error) {
      console.error('Error updating trade:', error);
      alert('An error occurred');
    }
  };


  const deleteTrade = async (tradeId: string) => {
    if (!confirm('Are you sure you want to delete this trade?')) {
      return;
    }

    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTrades(trades.filter((trade) => trade.id !== tradeId && trade._id !== tradeId));
      } else {
        alert('Failed to delete trade');
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('An error occurred');
    }
  };

  const filteredTrades = trades.filter((trade) => {
    if (filter === 'all') return true;
    if (filter === 'pending') {
      // Show trades with pending requests
      return trade.status === 'active' && trade.requests && trade.requests.some(r => r.status === 'pending');
    }
    return trade.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'available':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="text-plant-green-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-plant-green-800 dark:text-plant-green-200 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-plant-green-600 to-emerald-500">
                My Trades 🌿
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Manage your {trades.length} trade{trades.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              href="/trades/new"
              className="px-6 py-3 bg-gradient-to-r from-plant-green-600 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold transform hover:scale-105"
            >
              + Create New Trade
            </Link>
          </div>

          {/* Status Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter:</span>
              {(['all', 'active', 'pending', 'completed'] as const).map((status) => (
                <motion.button
                  key={status}
                  onClick={() => setFilter(status)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filter === status
                      ? 'bg-gradient-to-r from-plant-green-600 to-emerald-500 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Trades List */}
          {filteredTrades.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
            >
              <span className="text-7xl mb-4 block">🌱</span>
              <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-2">
                {filter === 'all' ? 'No trades yet' : `No ${filter} trades`}
              </p>
              <Link
                href="/trades/new"
                className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-plant-green-600 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold transform hover:scale-105"
              >
                Create Your First Trade
              </Link>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {filteredTrades.map((trade, index) => (
                  <motion.div
                    key={trade.id || trade._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-plant-green-800 dark:text-plant-green-200">
                            🌱 {trade.offeredItem}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              trade.status
                            )}`}
                          >
                            {trade.status}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          Looking for: <span className="font-semibold">🔍 {trade.requestedItem}</span>
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>📍 {trade.locationZip}</span>
                          <span>🕒 {new Date(trade.createdAt).toLocaleDateString()}</span>
                          {trade.counterparty && (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              👤 Trading with: {trade.counterparty.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Trade Requests Section - Display Only */}
                    {trade.status === 'active' && trade.requests && trade.requests.length > 0 && (
                      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          📩 Trade Requests ({trade.requests.filter(r => r.status === 'pending').length} pending)
                        </h4>
                        <div className="space-y-2">
                          {trade.requests
                            .filter((req) => req.status === 'pending')
                            .map((request) => (
                              <div
                                key={request.id}
                                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                              >
                                <Link
                                  href={`/profile/${request.requester._id}`}
                                  className="font-semibold text-plant-green-600 dark:text-plant-green-400 hover:underline"
                                >
                                  {request.requester.username}
                                </Link>
                                {request.message && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {request.message}
                                  </p>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 flex-wrap gap-2">
                      {trade.status === 'active' && (
                        <>
                          <button
                            onClick={() => updateTradeStatus(trade.id || trade._id, 'pending')}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold text-sm"
                          >
                            ⏳ Mark as Pending
                          </button>
                          <button
                            onClick={() => updateTradeStatus(trade.id || trade._id, 'completed')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                            disabled={!trade.counterpartyId}
                            title={!trade.counterpartyId ? 'A trade request must be accepted first' : ''}
                          >
                            ✓ Mark as Completed
                          </button>
                        </>
                      )}
                      {trade.status === 'pending' && (
                        <>
                          {trade.counterpartyId && (
                            <span className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-lg font-semibold text-sm">
                              👤 Trading with: {trade.counterparty?.username || 'Unknown'}
                            </span>
                          )}
                          <button
                            onClick={() => updateTradeStatus(trade.id || trade._id, 'completed')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                            disabled={!trade.counterpartyId}
                            title={!trade.counterpartyId ? 'No active trade partner' : ''}
                          >
                            ✓ Mark as Completed
                          </button>
                          <button
                            onClick={() => updateTradeStatus(trade.id || trade._id, 'active')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                          >
                            🔄 Reactivate
                          </button>
                        </>
                      )}
                      {trade.status === 'completed' && (
                        <Link
                          href={`/trades/${trade.id || trade._id}/review`}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
                        >
                          ⭐ Leave Review
                        </Link>
                      )}
                      <button
                        onClick={() => deleteTrade(trade.id || trade._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}

