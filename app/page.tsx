'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function Home() {
  // Aggressively prefetch main routes on homepage
  useEffect(() => {
    // Prefetch critical routes immediately
    const prefetchRoutes = async () => {
      const { prefetchCriticalRoutes, prefetchCriticalAPIs } = await import('@/lib/routePrefetch');
      prefetchCriticalRoutes();
      prefetchCriticalAPIs();
    };
    
    // Start prefetching after a short delay to not block initial render
    const timeoutId = setTimeout(prefetchRoutes, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-bold text-plant-green-800 dark:text-plant-green-200 mb-4">
          Welcome to SproutShare 🌱
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Connect with local plant lovers to trade plants, share care tips, and grow community connections.
        </p>
        <div className="flex justify-center flex-wrap gap-4">
          <Link
            href="/register"
            prefetch={true}
            className="px-6 py-3 bg-gradient-plant text-white rounded-xl hover:shadow-lg transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-plant-green-500 focus:ring-offset-2"
            aria-label="Get started with SproutShare"
            onMouseEnter={() => {
              import('@/lib/routePrefetch').then(({ prefetchRoute }) => {
                prefetchRoute('/register');
                prefetchRoute('/login');
              });
            }}
          >
            Get Started
          </Link>
          <Link
            href="/trades"
            prefetch={true}
            className="px-6 py-3 bg-white dark:bg-gray-800 text-plant-green-600 dark:text-plant-green-400 border-2 border-plant-green-600 dark:border-plant-green-400 rounded-xl hover:bg-plant-green-50 dark:hover:bg-plant-green-900 transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-plant-green-500 focus:ring-offset-2"
            aria-label="Browse plant trades"
            onMouseEnter={() => {
              import('@/lib/routePrefetch').then(({ prefetchRoute }) => {
                prefetchRoute('/trades');
                prefetchRoute('/library');
                prefetchRoute('/forum');
              });
            }}
          >
            Browse Trades
          </Link>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="text-4xl mb-4">🌿</div>
          <h2 className="text-xl font-semibold text-plant-green-700 dark:text-plant-green-400 mb-2">
            Plant Library
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Explore our comprehensive library of plants with care tips, maintenance levels, and more.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="text-4xl mb-4">🔄</div>
          <h2 className="text-xl font-semibold text-plant-green-700 dark:text-plant-green-400 mb-2">
            Trade Plants
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Find nearby plant enthusiasts and trade your plants using our location-based matching system.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="text-4xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-plant-green-700 dark:text-plant-green-400 mb-2">
            Community Forum
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Join discussions, share tips, and connect with fellow plant lovers in our community forums.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

