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
      const response = await fetch('/api/trades');
      const data = await response.json();
      if (response.ok) {
        // Filter to only show current user's trades
        const myTrades = data.trades.filter(
          (trade: Trade) => trade.ownerId._id === session?.user?.id
        );
        setTrades(myTrades);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
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

  const handleAcceptRequest = async (tradeId: string, requestId: string) => {
    try {
      const response = await fetch(`/api/trades/${tradeId}/request/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Trade request accepted!');
        fetchMyTrades(); // Refresh trades
      } else {
        alert(data.error || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('An error occurred');
    }
  };

  const handleDeclineRequest = async (tradeId: string, requestId: string) => {
    try {
      const response = await fetch(`/api/trades/${tradeId}/request/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'decline' }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Trade request declined');
        fetchMyTrades(); // Refresh trades
      } else {
        alert(data.error || 'Failed to decline request');
      }
    } catch (error) {
      console.error('Error declining request:', error);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-plant-green-800 dark:text-plant-green-200 mb-2">
              My Trades 🌿
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your {trades.length} trade{trades.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/trades/new"
            className="px-6 py-3 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold shadow-md hover:shadow-lg"
          >
            + Create New Trade
          </Link>
        </div>

        {/* Status Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            {(['all', 'active', 'pending', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === status
                    ? 'bg-plant-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Trades List */}
        {filteredTrades.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md"
          >
            <span className="text-6xl mb-4 block">🌱</span>
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-2">
              {filter === 'all' ? 'No trades yet' : `No ${filter} trades`}
            </p>
            <Link
              href="/trades/new"
              className="inline-block mt-4 px-6 py-3 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold"
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
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700"
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

                  {/* Trade Requests Section */}
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
                              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex-1">
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
                              <div className="flex space-x-2 ml-4">
                                <button
                                  onClick={() => handleAcceptRequest(trade.id || trade._id, request.id)}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                                >
                                  ✅ Accept
                                </button>
                                <button
                                  onClick={() => handleDeclineRequest(trade.id || trade._id, request.id)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
                                >
                                  ❌ Decline
                                </button>
                              </div>
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
                          Mark as Pending
                        </button>
                        <button
                          onClick={() => updateTradeStatus(trade.id || trade._id, 'completed')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                          disabled={!trade.counterpartyId}
                        >
                          ✓ Mark as Completed
                        </button>
                      </>
                    )}
                    {trade.status === 'pending' && (
                      <>
                        {trade.counterpartyId && (
                          <span className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-lg font-semibold text-sm">
                            ✅ Trade Request Accepted
                          </span>
                        )}
                        <button
                          onClick={() => updateTradeStatus(trade.id || trade._id, 'active')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                        >
                          Reactivate
                        </button>
                        {trade.counterpartyId && (
                          <button
                            onClick={() => updateTradeStatus(trade.id || trade._id, 'completed')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                          >
                            ✓ Mark as Completed
                          </button>
                        )}
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
  );
}

