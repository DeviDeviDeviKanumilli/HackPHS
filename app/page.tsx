'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-bold text-plant-green-800 mb-4">
          Welcome to SproutShare 🌱
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect with local plant lovers to trade plants, share care tips, and grow community connections.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/register"
            className="px-6 py-3 bg-gradient-plant text-white rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            Get Started
          </Link>
          <Link
            href="/trades"
            className="px-6 py-3 bg-white text-plant-green-600 border-2 border-plant-green-600 rounded-xl hover:bg-plant-green-50 transition-all font-semibold"
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
          className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="text-4xl mb-4">🌿</div>
          <h2 className="text-xl font-semibold text-plant-green-700 mb-2">
            Plant Library
          </h2>
          <p className="text-gray-600">
            Explore our comprehensive library of plants with care tips, maintenance levels, and more.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="text-4xl mb-4">🔄</div>
          <h2 className="text-xl font-semibold text-plant-green-700 mb-2">
            Trade Plants
          </h2>
          <p className="text-gray-600">
            Find nearby plant enthusiasts and trade your plants using our location-based matching system.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="text-4xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-plant-green-700 mb-2">
            Community Forum
          </h2>
          <p className="text-gray-600">
            Join discussions, share tips, and connect with fellow plant lovers in our community forums.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

