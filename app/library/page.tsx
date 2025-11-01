'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

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

  useEffect(() => {
    fetchPlants();
  }, [search]);

  const fetchPlants = async () => {
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
  };

  const handleLike = async (plantId: string) => {
    if (!session) {
      alert('Please log in to like plants');
      return;
    }

    try {
      const response = await fetch(`/api/plants/${plantId}/like`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        // Update the plant in the list
        setPlants(
          plants.map((plant) =>
            plant._id === plantId
              ? {
                  ...plant,
                  likedBy: data.liked
                    ? [...plant.likedBy, session.user?.id]
                    : plant.likedBy.filter((id) => id !== session.user?.id),
                }
              : plant
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const isLiked = (plant: Plant) => {
    if (!session) return false;
    return plant.likedBy?.includes(session.user?.id as string);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-plant-green-800 mb-4">
          Plant Library 🌿
        </h1>
        <p className="text-gray-600 mb-6">
          Explore our collection of plants and discover care tips from the community
        </p>
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search plants..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-plant-green-600">Loading plants...</div>
        </div>
      ) : plants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <span className="text-6xl mb-4 block">🌱</span>
          <p className="text-gray-600">No plants found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <motion.div
              key={plant._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="h-64 bg-gradient-plant flex items-center justify-center relative">
                {plant.imageURL && plant.imageURL !== '/placeholder-plant.jpg' ? (
                  <img
                    src={plant.imageURL}
                    alt={plant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-8xl">🌱</span>
                )}
                <button
                  onClick={() => handleLike(plant._id)}
                  className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors"
                  title={isLiked(plant) ? 'Unlike' : 'Like'}
                >
                  {isLiked(plant) ? (
                    <FaHeart className="text-red-500" />
                  ) : (
                    <FaRegHeart className="text-gray-400" />
                  )}
                </button>
                <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-lg">
                  <span className="text-sm font-semibold text-plant-green-700">
                    {plant.likedBy?.length || 0} likes
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-plant-green-800 mb-1">
                  {plant.name}
                </h3>
                {plant.scientificName && (
                  <p className="text-sm text-gray-500 italic mb-2">
                    {plant.scientificName}
                  </p>
                )}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {plant.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {plant.type && (
                    <span className="px-2 py-1 bg-plant-green-100 text-plant-green-700 rounded text-xs font-semibold">
                      {plant.type}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      plant.maintenanceLevel === 'low'
                        ? 'bg-green-100 text-green-700'
                        : plant.maintenanceLevel === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {plant.maintenanceLevel} maintenance
                  </span>
                </div>
                {plant.nativeRegion && (
                  <p className="text-xs text-gray-500 mb-2">
                    Native to: {plant.nativeRegion}
                  </p>
                )}
                {plant.careTips && (
                  <details className="mt-2">
                    <summary className="text-sm text-plant-green-600 cursor-pointer hover:text-plant-green-700">
                      Care Tips
                    </summary>
                    <p className="text-sm text-gray-600 mt-2 pl-4 border-l-2 border-plant-green-200">
                      {plant.careTips}
                    </p>
                  </details>
                )}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Owner: <span className="font-semibold">{plant.ownerId?.username}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

