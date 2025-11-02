'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Leaf, ArrowRight } from 'lucide-react';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Aggressively prefetch main routes on homepage
  useEffect(() => {
    const prefetchRoutes = async () => {
      const { prefetchCriticalRoutes, prefetchCriticalAPIs } = await import('@/lib/routePrefetch');
      prefetchCriticalRoutes();
      prefetchCriticalAPIs();
    };
    
    const timeoutId = setTimeout(prefetchRoutes, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  const categories = [
    { id: 'all', label: 'All Features', icon: '🌿' },
    { id: 'library', label: 'Plant Library', icon: '📚' },
    { id: 'trading', label: 'Trading', icon: '🔄' },
    { id: 'community', label: 'Community', icon: '💬' },
  ];

  const features = [
    {
      id: '1',
      name: 'Plant Library',
      description: 'Explore comprehensive plant database with care tips and detailed information',
      icon: '🌿',
      category: 'library',
      rating: 4.9,
      href: '/library',
      gradient: 'from-green-400 to-emerald-500',
    },
    {
      id: '2',
      name: 'Trade Plants',
      description: 'Find nearby plant enthusiasts and trade using location-based matching',
      icon: '🔄',
      category: 'trading',
      rating: 4.8,
      href: '/trades',
      gradient: 'from-purple-400 to-pink-500',
    },
    {
      id: '3',
      name: 'Community Forum',
      description: 'Join discussions, share tips, and connect with fellow plant lovers',
      icon: '💬',
      category: 'community',
      rating: 4.9,
      href: '/forum',
      gradient: 'from-blue-400 to-cyan-500',
    },
    {
      id: '4',
      name: 'Plant Care Tips',
      description: 'Learn from experts and share your own plant care knowledge',
      icon: '💚',
      category: 'community',
      rating: 4.7,
      href: '/forum',
      gradient: 'from-amber-400 to-orange-500',
    },
    {
      id: '5',
      name: 'My Trades',
      description: 'Manage your active trades and track your trading history',
      icon: '📋',
      category: 'trading',
      rating: 4.8,
      href: '/my-trades',
      gradient: 'from-teal-400 to-cyan-500',
    },
    {
      id: '6',
      name: 'Messages',
      description: 'Chat with other traders and coordinate plant exchanges',
      icon: '💌',
      category: 'community',
      rating: 4.9,
      href: '/messages',
      gradient: 'from-rose-400 to-pink-500',
    },
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-plant-green-600 to-teal-600 text-white py-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-6xl opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            >
              🌿
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center gap-2 mb-6"
            >
              <Leaf className="w-10 h-10" />
              <span className="text-3xl font-bold">SproutShare</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Bring Nature Home
            </h1>
            <p className="text-xl md:text-2xl text-emerald-50 mb-10 max-w-3xl mx-auto">
              Connect with local plant lovers to trade plants, share care tips, and grow community connections
            </p>
            
            <div className="flex justify-center flex-wrap gap-4">
              <Link
                href="/register"
                prefetch={true}
                className="group relative px-8 py-4 bg-white text-emerald-600 rounded-full font-bold text-lg shadow-2xl hover:shadow-white/50 transition-all transform hover:scale-105 overflow-hidden"
                onMouseEnter={() => {
                  import('@/lib/routePrefetch').then(({ prefetchRoute }) => {
                    prefetchRoute('/register');
                    prefetchRoute('/login');
                  });
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={false}
                />
              </Link>
              <Link
                href="/trades"
                prefetch={true}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all transform hover:scale-105"
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

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center items-center gap-8 md:gap-12 mt-16 flex-wrap"
            >
              {[
                { number: 'Hundreds of', label: 'Plants' },
                { number: 'Passionate', label: 'Traders' },
                { number: '24/7', label: 'Support' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-xl md:text-2xl font-semibold mb-1 text-white">{stat.number}</div>
                  <div className="text-sm md:text-base text-emerald-100/80 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full whitespace-nowrap font-medium transition-all transform hover:scale-105 ${
                selectedCategory === category.id
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-xl">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredFeatures.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={feature.href} prefetch={true}>
                <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 h-full flex flex-col">
                  {/* Header with gradient */}
                  <div className={`relative bg-gradient-to-br ${feature.gradient} h-48 flex items-center justify-center`}>
                    <span className="text-7xl">{feature.icon}</span>

                    {/* Category badge */}
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {categories.find(c => c.id === feature.category)?.label || 'Feature'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200 mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {feature.name}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 mb-4 flex-1">
                      {feature.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Explore →
                      </span>
                      <motion.div
                        className="text-emerald-600 dark:text-emerald-400"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="w-6 h-6 text-emerald-400" />
                <span className="text-xl font-bold">SproutShare</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your trusted platform for plant trading and community connections.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Explore</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <Link href="/library" className="hover:text-white transition-colors">
                    Plant Library
                  </Link>
                </li>
                <li>
                  <Link href="/trades" className="hover:text-white transition-colors">
                    Browse Trades
                  </Link>
                </li>
                <li>
                  <Link href="/forum" className="hover:text-white transition-colors">
                    Community Forum
                  </Link>
                </li>
                <li>
                  <Link href="/plants/new" className="hover:text-white transition-colors">
                    Add Plant
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="hover:text-white cursor-pointer transition-colors">Plant Care Guide</li>
                <li className="hover:text-white cursor-pointer transition-colors">Trading Tips</li>
                <li className="hover:text-white cursor-pointer transition-colors">Safety Guidelines</li>
                <li className="hover:text-white cursor-pointer transition-colors">Contact Us</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Newsletter</h4>
              <p className="text-gray-400 text-sm mb-3">Get plant care tips and trading updates</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 bg-gray-800 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1"
                />
                <button className="bg-emerald-600 px-4 py-2 rounded-r-lg hover:bg-emerald-700 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 SproutShare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
