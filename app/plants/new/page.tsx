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
    scientificName: '',
    description: '',
    imageURL: '',
    type: '',
    maintenanceLevel: 'medium',
    tradeStatus: 'available',
    nativeRegion: '',
    careTips: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!session) {
    router.push('/login');
    return null;
  }

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

      router.push(`/profile/${session.user?.id}`);
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scientific Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
              value={formData.scientificName}
              onChange={(e) =>
                setFormData({ ...formData, scientificName: e.target.value })
              }
            />
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
                Type
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                placeholder="e.g., Succulent, Houseplant"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maintenance Level
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                value={formData.maintenanceLevel}
                onChange={(e) =>
                  setFormData({ ...formData, maintenanceLevel: e.target.value })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
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

