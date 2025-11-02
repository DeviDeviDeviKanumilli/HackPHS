'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Plant {
  _id: string;
  name: string;
  scientificName?: string;
  description: string;
  imageURL: string;
  type: string;
  maintenanceLevel: string;
  tradeStatus: string;
}

interface User {
  _id: string;
  username: string;
  joinDate: string;
  bio?: string;
  followers: any[];
  following: any[];
  tradesCompleted: number;
  plants: Plant[];
}

export default function ProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  const userId = params.id as string;
  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setIsFollowing(
          data.user.followers?.some(
            (follower: any) => follower._id === session?.user?.id
          ) || false
        );
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!session) return;
    setFollowingLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setIsFollowing(data.following);
        fetchUser(); // Refresh user data
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="text-plant-green-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="text-red-600">User not found</div>
      </div>
    );
  }

  const joinDate = new Date(user.joinDate).toLocaleDateString();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-plant-green-800 mb-2">
              {user.username}
            </h1>
            <p className="text-gray-600 mb-4">
              Joined {joinDate} • {user.tradesCompleted} trades completed
            </p>
            {user.bio && (
              <p className="text-gray-700 mb-4">{user.bio}</p>
            )}
            <div className="flex space-x-6 text-gray-600">
              <div>
                <span className="font-semibold">{user.followerCount ?? (user.followers?.length || 0)}</span>{' '}
                Followers
              </div>
              <div>
                <span className="font-semibold">{user.followingCount ?? (user.following?.length || 0)}</span>{' '}
                Following
              </div>
              <div>
                <span className="font-semibold">{user.plants?.length || 0}</span> Plants
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
            {!isOwnProfile && session && (
              <>
                <button
                  onClick={handleFollow}
                  disabled={followingLoading}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-plant-green-600 text-white hover:bg-plant-green-700'
                  }`}
                >
                  {followingLoading
                    ? 'Loading...'
                    : isFollowing
                    ? 'Following'
                    : 'Follow'}
                </button>
                <Link
                  href={`/messages/${userId}`}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center"
                >
                  💬 Message
                </Link>
              </>
            )}
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="px-6 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold text-center"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-plant-green-800">
            Plant Collection
          </h2>
          {isOwnProfile && (
            <Link
              href="/plants/new"
              className="px-4 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold"
            >
              + Add Plant
            </Link>
          )}
        </div>
        {user.plants && user.plants.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {user.plants.map((plant) => (
              <motion.div
                key={plant._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="h-48 bg-gradient-plant flex items-center justify-center">
                  {plant.imageURL && plant.imageURL !== '/placeholder-plant.jpg' ? (
                    <img
                      src={plant.imageURL}
                      alt={plant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">🌱</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-plant-green-800 mb-1">
                    {plant.name}
                  </h3>
                  {plant.scientificName && (
                    <p className="text-sm text-gray-500 italic mb-2">
                      {plant.scientificName}
                    </p>
                  )}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {plant.description}
                  </p>
                  <div className="flex items-center justify-between">
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
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        plant.tradeStatus === 'available'
                          ? 'bg-blue-100 text-blue-700'
                          : plant.tradeStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {plant.tradeStatus}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <span className="text-6xl mb-4 block">🌿</span>
            <p className="text-gray-600">No plants in collection yet</p>
            {isOwnProfile && (
              <Link
                href="/plants/new"
                className="mt-4 inline-block px-6 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors"
              >
                Add Your First Plant
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

