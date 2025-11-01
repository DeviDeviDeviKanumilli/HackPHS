'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    bio: '',
    locationZip: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const fetchUserData = async () => {
    if (!session?.user?.id) {
      setFetching(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${session.user.id}`);
      const data = await response.json();

      if (response.ok && data.user) {
        setFormData({
          bio: data.user.bio || '',
          locationZip: data.user.locationZip || '',
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    // Fetch current user data
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (!session) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/users/${session.user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update profile');
        return;
      }

      // Redirect to profile page on success
      router.push(`/profile/${session.user?.id}`);
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="text-plant-green-600">Loading profile data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-8"
      >
        <h1 className="text-3xl font-bold text-plant-green-800 mb-6">
          Edit Profile
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (Zip Code)
            </label>
            <input
              type="text"
              pattern="[0-9]{5}"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
              placeholder="12345"
              value={formData.locationZip}
              onChange={(e) =>
                setFormData({ ...formData, locationZip: e.target.value })
              }
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
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

