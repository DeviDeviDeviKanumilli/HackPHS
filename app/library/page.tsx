'use client';

import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import LoadingSpinner from '@/components/LoadingSpinner';
import ResponsiveContainer, { ResponsiveGrid, ResponsiveCard, ResponsiveInput } from '@/components/ResponsiveContainer';
import OptimizedImage from '@/components/OptimizedImage';
import { SkeletonGrid, SkeletonCard } from '@/components/SkeletonLoader';

interface Plant {
  _id: string;
  name: string;
  scientificName?: string;
  description: string;
  imageURL: string;
  type: string;
  maintenanceLevel: string;
  nativeRegion?: string;
  careTips?: string;
  likedBy: string[];
  ownerId: {
    username: string;
    _id: string;
  };
}

export default function LibraryPage() {
  const { data: session } = useSession();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  // Memoize handleLike to prevent unnecessary re-renders
  const handleLike = useCallback(async (plantId: string) => {
    if (!session) {
      alert('Please log in to like plants');
      return;
    }

    try {
      const response = await fetch(`/api/plants/${plantId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        // Optimistically update the UI
        setPlants(prevPlants =>
          prevPlants.map(plant =>
            plant._id === plantId
              ? { ...plant, liked: !plant.liked }
              : plant
          )
        );
      }
    } catch (error) {
      console.error('Error liking plant:', error);
    }
  }, [session]);

  // Removed duplicate - using memoized version above

  const isLiked = (plant: Plant) => {
    if (!session) return false;
    return plant.likedBy?.includes(session.user?.id as string);
  };

  // Memoized Plant Card Component to prevent unnecessary re-renders
  const PlantCard = memo(({ plant }: { plant: Plant }) => {
    const liked = isLiked(plant);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
      >
        <div className="h-64 bg-gradient-plant flex items-center justify-center relative">
          {plant.imageURL && plant.imageURL !== '/placeholder-plant.jpg' ? (
            <OptimizedImage
              src={plant.imageURL}
              alt={plant.name}
              fill
              className="object-cover"
              priority={false}
            />
          ) : (
            <span className="text-8xl">🌱</span>
          )}
          <button
            onClick={() => handleLike(plant._id)}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors z-10"
            title={liked ? 'Unlike' : 'Like'}
            aria-label={liked ? 'Unlike plant' : 'Like plant'}
          >
            {liked ? (
              <FaHeart className="text-red-500" />
            ) : (
              <FaRegHeart className="text-gray-400" />
            )}
          </button>
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 px-3 py-1 rounded-lg backdrop-blur-sm">
            <span className="text-sm font-semibold text-plant-green-700 dark:text-plant-green-400">
              {plant.likedBy?.length || 0} likes
            </span>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-plant-green-800 dark:text-plant-green-200 mb-1">
            {plant.name}
          </h3>
          {plant.scientificName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">
              {plant.scientificName}
            </p>
          )}
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {plant.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {plant.type && (
              <span className="px-2 py-1 bg-plant-green-100 dark:bg-plant-green-900 text-plant-green-700 dark:text-plant-green-300 rounded text-xs font-semibold">
                {plant.type}
              </span>
            )}
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                plant.maintenanceLevel === 'low'
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : plant.maintenanceLevel === 'medium'
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
              }`}
            >
              {plant.maintenanceLevel} maintenance
            </span>
          </div>
          {plant.nativeRegion && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Native to: {plant.nativeRegion}
            </p>
          )}
          {plant.careTips && (
            <details className="mt-2">
              <summary className="text-sm text-plant-green-600 dark:text-plant-green-400 cursor-pointer hover:text-plant-green-700 dark:hover:text-plant-green-300">
                Care Tips
              </summary>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 pl-4 border-l-2 border-plant-green-200 dark:border-plant-green-700">
                {plant.careTips}
              </p>
            </details>
          )}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Owner: <span className="font-semibold">{plant.ownerId?.username}</span>
            </p>
          </div>
        </div>
      </motion.div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function to prevent re-renders
    return (
      prevProps.plant._id === nextProps.plant._id &&
      prevProps.plant.likedBy?.length === nextProps.plant.likedBy?.length
    );
  });

  PlantCard.displayName = 'PlantCard';

  return (
    <ResponsiveContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-plant-green-800 mb-3 sm:mb-4">
          Plant Library 🌿
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Explore our collection of plants and discover care tips from the community
        </p>
        <div className="max-w-md">
          <ResponsiveInput
            type="text"
            placeholder="Search plants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : plants.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <span className="text-6xl mb-4 block">🌱</span>
          <p className="text-gray-600 dark:text-gray-300">No plants found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <PlantCard key={plant._id} plant={plant} />
          ))}
        </div>
      )}
    </ResponsiveContainer>
  );
}

