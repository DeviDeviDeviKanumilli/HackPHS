'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function NewPlantPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    genus: '',
    species: '',
    description: '',
    imageURL: '',
    cycle: '',
    wateringFrequency: '',
    tradeStatus: 'available',
    nativeRegion: '',
    careTips: '',
    idealTemp: '',
    sunlight: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/plants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create plant');
        return;
      }

      router.push('/library');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-8"
      >
        <h1 className="text-3xl font-bold text-plant-green-800 mb-6">
          Add a New Plant
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plant Name *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genus
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                placeholder="e.g., Monstera"
                value={formData.genus}
                onChange={(e) =>
                  setFormData({ ...formData, genus: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Species
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                placeholder="e.g., deliciosa"
                value={formData.species}
                onChange={(e) =>
                  setFormData({ ...formData, species: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cycle
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                placeholder="e.g., Perennial, Annual"
                value={formData.cycle}
                onChange={(e) =>
                  setFormData({ ...formData, cycle: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Watering Frequency
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                placeholder="e.g., Weekly, Bi-weekly"
                value={formData.wateringFrequency}
                onChange={(e) =>
                  setFormData({ ...formData, wateringFrequency: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ideal Temperature
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                placeholder="e.g., 65-75°F"
                value={formData.idealTemp}
                onChange={(e) =>
                  setFormData({ ...formData, idealTemp: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sunlight Requirements
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                placeholder="e.g., Full sun, Partial shade"
                value={formData.sunlight}
                onChange={(e) =>
                  setFormData({ ...formData, sunlight: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
              placeholder="https://example.com/image.jpg"
              value={formData.imageURL}
              onChange={(e) =>
                setFormData({ ...formData, imageURL: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trade Status
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
              value={formData.tradeStatus}
              onChange={(e) =>
                setFormData({ ...formData, tradeStatus: e.target.value })
              }
            >
              <option value="available">Available</option>
              <option value="pending">Pending</option>
              <option value="traded">Traded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Native Region
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
              value={formData.nativeRegion}
              onChange={(e) =>
                setFormData({ ...formData, nativeRegion: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Care Tips
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
              value={formData.careTips}
              onChange={(e) =>
                setFormData({ ...formData, careTips: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                  placeholder="Enter a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-plant-green-100 text-plant-green-700"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-plant-green-600 hover:text-plant-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Add tags to help others find this plant (e.g., "indoor", "low-maintenance", "pet-friendly")
              </p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Adding Plant...' : 'Add Plant'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

