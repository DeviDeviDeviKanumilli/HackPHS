'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonGrid } from '@/components/SkeletonLoader';
import { X, Droplet, Sun, Thermometer, MapPin, BookOpen } from 'lucide-react';

interface Plant {
  _id: string;
  id: string;
  name: string;
  genus?: string;
  species?: string;
  description: string;
  cycle?: string;
  wateringFrequency?: string;
  nativeRegion?: string;
  careTips?: string;
  tradeStatus: string;
  idealTemp?: string;
  sunlight?: string;
  tags?: string[];
  likes?: number;
}

// Memoized PlantCard component for better performance
const PlantCard = memo(({ plant, onClick }: { plant: Plant; onClick: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer"
    >
      <div className="p-6">
        <h3 className="text-xl font-bold text-plant-green-800 dark:text-plant-green-200 mb-1 line-clamp-1 group-hover:text-plant-green-600 dark:group-hover:text-plant-green-400 transition-colors">
          {plant.name}
        </h3>
        {(plant.genus || plant.species) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3 line-clamp-1">
            {plant.genus} {plant.species}
          </p>
        )}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
          {plant.description}
        </p>
        <div className="flex items-center justify-start mb-4 flex-wrap gap-2">
          {plant.sunlight && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 shadow-sm">
              ☀️ {plant.sunlight}
            </span>
          )}
          {plant.cycle && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm">
              🔄 {plant.cycle}
            </span>
          )}
          {plant.wateringFrequency && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 shadow-sm">
              💧 {plant.wateringFrequency}
            </span>
          )}
        </div>
        {plant.nativeRegion && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
            <span>🌍</span> {plant.nativeRegion}
          </p>
        )}
        {plant.tags && plant.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {plant.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-plant-green-100 dark:bg-plant-green-900/50 text-plant-green-700 dark:text-plant-green-300 shadow-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
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
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  
  // Filter states
  const [cycleFilter, setCycleFilter] = useState<string>('all');
  const [sunlightFilter, setSunlightFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Memoize fetchPlants to prevent unnecessary re-renders
  const fetchPlants = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/plants?search=${encodeURIComponent(search)}&limit=100`
        : '/api/plants?limit=100';
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

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPlant) {
        setSelectedPlant(null);
      }
    };

    if (selectedPlant) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPlant]);

  // Apply filters
  useEffect(() => {
    let result = [...plants];

    if (cycleFilter !== 'all') {
      result = result.filter((plant) => plant.cycle === cycleFilter);
    }

    if (sunlightFilter !== 'all') {
      result = result.filter((plant) => plant.sunlight === sunlightFilter);
    }

    // Filter by tags - plant must have ALL selected tags
    if (selectedTags.length > 0) {
      result = result.filter((plant) => {
        if (!plant.tags || plant.tags.length === 0) return false;
        return selectedTags.every((tag) => plant.tags?.includes(tag));
      });
    }

    setFilteredPlants(result);
  }, [plants, cycleFilter, sunlightFilter, selectedTags]);

  // Get unique values for filters
  const plantCycles = Array.from(new Set(plants.map((p) => p.cycle).filter(Boolean))).sort();
  const plantSunlights = Array.from(new Set(plants.map((p) => p.sunlight).filter(Boolean))).sort();
  
  // Get all unique tags from all plants
  const allTags = Array.from(
    new Set(plants.flatMap((p) => p.tags || []).filter(Boolean))
  ).sort();

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

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

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🏷️ Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-plant-green-600 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    #{tag}
                    {selectedTags.includes(tag) && ' ✓'}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  >
                    Clear Tags
                  </button>
                )}
              </div>
            </div>
          )}

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
            {search || cycleFilter !== 'all' || sunlightFilter !== 'all' || selectedTags.length > 0
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
              <PlantCard 
                key={plant._id} 
                plant={plant} 
                onClick={() => setSelectedPlant(plant)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Plant Detail Modal */}
      <AnimatePresence>
        {selectedPlant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlant(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="relative p-6 md:p-8 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedPlant(null)}
                  className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-lg"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
                <div className="pr-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-plant-green-600 to-emerald-500">
                    {selectedPlant.name}
                  </h2>
                  {(selectedPlant.genus || selectedPlant.species) && (
                    <p className="text-lg text-gray-500 dark:text-gray-400 italic">
                      {selectedPlant.genus} {selectedPlant.species}
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-plant-green-800 dark:text-plant-green-200 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Description
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedPlant.description}
                  </p>
                </div>

                {/* Care Tips */}
                {selectedPlant.careTips && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-plant-green-800 dark:text-plant-green-200 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Care Tips
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedPlant.careTips}
                    </p>
                  </div>
                )}

                {/* Plant Details Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {selectedPlant.cycle && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🔄</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Life Cycle</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 capitalize">{selectedPlant.cycle}</p>
                    </div>
                  )}
                  
                  {selectedPlant.wateringFrequency && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplet className="w-5 h-5 text-blue-500" />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Watering</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Frequency: {selectedPlant.wateringFrequency}/5</p>
                    </div>
                  )}
                  
                  {selectedPlant.sunlight && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sun className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Sunlight</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Level: {selectedPlant.sunlight}/5</p>
                    </div>
                  )}
                  
                  {selectedPlant.idealTemp && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Thermometer className="w-5 h-5 text-red-500" />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Temperature</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">{selectedPlant.idealTemp}</p>
                    </div>
                  )}
                  
                  {selectedPlant.nativeRegion && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-green-500" />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Native Region</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">{selectedPlant.nativeRegion}</p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {selectedPlant.tags && selectedPlant.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlant.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-plant-green-100 dark:bg-plant-green-900/50 text-plant-green-700 dark:text-plant-green-300 shadow-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
