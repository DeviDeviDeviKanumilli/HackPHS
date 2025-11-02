'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';
import { SkeletonGrid } from '@/components/SkeletonLoader';

interface Plant {
  _id: string;
  id: string;
  name: string;
  genus?: string;
  species?: string;
  description: string;
  imageURL: string;
  cycle?: string;
  wateringFrequency?: string;
  nativeRegion?: string;
  careTips?: string;
  tradeStatus: string;
  idealTemp?: string;
  sunlight?: string;
  likes?: number;
}

// Memoized PlantCard component for better performance
const PlantCard = memo(({ plant }: { plant: Plant }) => {
  const { data: session } = useSession();
  const [likes, setLikes] = useState(plant.likes || 0);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = async () => {
    if (!session) {
      alert('Please sign in to like plants');
      return;
    }

    try {
      const response = await fetch(`/api/plants/${plant._id}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        setIsLiked(!isLiked);
        setLikes(isLiked ? likes - 1 : likes + 1);
      }
    } catch (error) {
      console.error('Error liking plant:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100 dark:border-gray-700"
    >
      <div className="h-52 bg-gradient-plant flex items-center justify-center relative overflow-hidden">
        {plant.imageURL && plant.imageURL !== '/placeholder-plant.jpg' ? (
          <OptimizedImage
            src={plant.imageURL}
            alt={plant.name}
            width={400}
            height={300}
            className="w-full h-full object-cover"
            priority={false}
          />
        ) : (
          <span className="text-6xl">🌱</span>
        )}
        <span
          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-md ${
            plant.tradeStatus === 'available'
              ? 'bg-green-500 text-white'
              : plant.tradeStatus === 'pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-500 text-white'
          }`}
        >
          {plant.tradeStatus}
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-semibold text-plant-green-800 dark:text-plant-green-200 mb-1 line-clamp-1">
          {plant.name}
        </h3>
        {(plant.genus || plant.species) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2 line-clamp-1">
            {plant.genus} {plant.species}
          </p>
        )}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {plant.description}
        </p>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          {plant.sunlight && (
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
              ☀️ {plant.sunlight}
            </span>
          )}
          {plant.cycle && (
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              🔄 {plant.cycle}
            </span>
          )}
          {plant.wateringFrequency && (
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
              💧 {plant.wateringFrequency}
            </span>
          )}
        </div>
        {plant.nativeRegion && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            🌍 {plant.nativeRegion}
          </p>
        )}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLike}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
              isLiked
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            ❤️ {likes > 0 && likes}
          </button>
          <Link
            href={`/plants/${plant._id}`}
            className="flex-1 text-center px-4 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold"
          >
            View
          </Link>
        </div>
      </div>
    </motion.div>
  );
});

PlantCard.displayName = 'PlantCard';

export default function LibraryPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filter states
  const [cycleFilter, setCycleFilter] = useState<string>('all');
  const [sunlightFilter, setSunlightFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Memoize fetchPlants to prevent unnecessary re-renders
  const fetchPlants = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/plants?search=${encodeURIComponent(search)}`
        : '/api/plants';
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setPlants(data.plants || []);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    // Debounce search to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchPlants();
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [fetchPlants]);

  // Apply filters
  useEffect(() => {
    let result = [...plants];

    if (cycleFilter !== 'all') {
      result = result.filter((plant) => plant.cycle === cycleFilter);
    }

    if (sunlightFilter !== 'all') {
      result = result.filter((plant) => plant.sunlight === sunlightFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((plant) => plant.tradeStatus === statusFilter);
    }

    setFilteredPlants(result);
  }, [plants, cycleFilter, sunlightFilter, statusFilter]);

  // Get unique values for filters
  const plantCycles = Array.from(new Set(plants.map((p) => p.cycle).filter(Boolean))).sort();
  const plantSunlights = Array.from(new Set(plants.map((p) => p.sunlight).filter(Boolean))).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-plant-green-800 dark:text-plant-green-200 mb-3 sm:mb-4">
          Plant Library 🌿
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
          Explore our collection of plants and discover care tips from the community
          {search && (
            <span className="ml-2 text-xs bg-plant-green-100 dark:bg-plant-green-900 text-plant-green-700 dark:text-plant-green-300 px-2 py-1 rounded">
              🔍 Advanced Search Active
            </span>
          )}
        </p>
        
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 mb-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔍 Search Plants
              </label>
              <input
                type="text"
                placeholder="Search plants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Cycle Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔄 Cycle
              </label>
              <select
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Cycles</option>
                {plantCycles.map((cycle) => (
                  <option key={cycle} value={cycle}>
                    {cycle}
                  </option>
                ))}
              </select>
            </div>

            {/* Sunlight Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ☀️ Sunlight
              </label>
              <select
                value={sunlightFilter}
                onChange={(e) => setSunlightFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Sunlight</option>
                {plantSunlights.map((sunlight) => (
                  <option key={sunlight} value={sunlight}>
                    {sunlight}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filter Row */}
          <div className="mt-4 flex items-center space-x-4 flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-plant-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                statusFilter === 'available'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Pending
            </button>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredPlants.length} of {plants.length} plants
          </div>
        </div>
      </motion.div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : filteredPlants.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md"
        >
          <span className="text-6xl mb-4 block">🌱</span>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-2">
            {search || cycleFilter !== 'all' || sunlightFilter !== 'all' || statusFilter !== 'all'
              ? 'No plants match your filters'
              : 'No plants found'}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Try adjusting your filters or search terms
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlants.map((plant) => (
              <PlantCard key={plant._id} plant={plant} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
