'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface User {
  _id: string;
  username: string;
  joinDate: string;
  bio?: string;
  profilePicture?: string;
  plantImages?: string[];
  followers: any[];
  following: any[];
  tradesCompleted: number;
  plants: any[]; // Empty array now - plants are not owned by users
  averageRating?: number;
  reviewCount?: number;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    id: string;
    username: string;
  };
}

export default function ProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviews, setShowReviews] = useState(false);

  const userId = params.id as string;
  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      const [userResponse, reviewsResponse] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/reviews?userId=${userId}&limit=5`),
      ]);
      
      const userData = await userResponse.json();
      if (userResponse.ok) {
        setUser(userData.user);
        setIsFollowing(
          userData.user.followers?.some(
            (follower: any) => (follower._id || follower.id) === session?.user?.id
          ) || false
        );
      } else {
        // Handle error response
        console.error('User not found:', userData.error);
        setLoading(false);
        return;
      }

      const reviewsData = await reviewsResponse.json();
      if (reviewsResponse.ok && reviewsData.reviews) {
        setReviews(reviewsData.reviews);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 dark:border-gray-700"
        >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-start space-x-4">
            {user.profilePicture ? (
              <motion.img
                src={user.profilePicture}
                alt={user.username}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 rounded-full object-cover border-4 border-plant-green-500 dark:border-emerald-500 flex-shrink-0 shadow-lg"
              />
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-plant-green-100 to-emerald-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center border-4 border-plant-green-500 dark:border-emerald-500 flex-shrink-0 shadow-lg"
              >
                <span className="text-4xl">👤</span>
              </motion.div>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-plant-green-600 to-emerald-500 mb-2">
                {user.username}
              </h1>
            <p className="text-gray-600 mb-4">
              Joined {joinDate} • {user.tradesCompleted} trades completed
            </p>
            {user.bio && (
              <p className="text-gray-700 mb-4">{user.bio}</p>
            )}
            <div className="flex space-x-6 text-gray-600 flex-wrap gap-4">
              <div>
                <span className="font-semibold">{user.followerCount ?? (user.followers?.length || 0)}</span>{' '}
                Followers
              </div>
              <div>
                <span className="font-semibold">{user.followingCount ?? (user.following?.length || 0)}</span>{' '}
                Following
              </div>
              {user.averageRating !== undefined && user.averageRating > 0 && (
                <div>
                  <span className="font-semibold">⭐ {user.averageRating.toFixed(1)}</span>{' '}
                  ({user.reviewCount || 0} reviews)
                </div>
              )}
            </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
            {!isOwnProfile && session && (
              <>
                <motion.button
                  onClick={handleFollow}
                  disabled={followingLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    isFollowing
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      : 'bg-gradient-to-r from-plant-green-600 to-emerald-500 text-white hover:shadow-lg'
                  }`}
                >
                  {followingLoading
                    ? 'Loading...'
                    : isFollowing
                    ? 'Following'
                    : 'Follow'}
                </motion.button>
                <Link
                  href={`/messages/${userId}`}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-center transform hover:scale-105"
                >
                  💬 Message
                </Link>
              </>
            )}
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="px-6 py-3 bg-gradient-to-r from-plant-green-600 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-center transform hover:scale-105"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Plant Images Section */}
      {user.plantImages && user.plantImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-plant-green-800 dark:text-plant-green-200 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-plant-green-600 to-emerald-500">
              🌿 Plant Gallery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {user.plantImages.map((imageUrl, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative group aspect-square rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                >
                  <img
                    src={imageUrl}
                    alt={`Plant ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Reviews Section - Made More Prominent */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-plant-green-800 dark:text-plant-green-200">
                ⭐ Reviews & Ratings
              </h2>
              {(user.reviewCount || 0) > 0 && (
                <div className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/30 px-4 py-2 rounded-lg">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={i < Math.round(user.averageRating || 0) ? 'text-yellow-400 text-xl' : 'text-gray-300 text-xl'}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {(user.averageRating || 0).toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({user.reviewCount || 0} {(user.reviewCount || 0) === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>
            {(user.reviewCount || 0) > 0 && (
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="px-4 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold text-sm"
              >
                {showReviews ? 'Hide Reviews' : 'Show All Reviews'}
              </button>
            )}
          </div>

          {(user.reviewCount || 0) === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <span className="text-4xl block mb-2">⭐</span>
              <p className="font-medium">No reviews yet</p>
              <p className="text-sm">Complete trades to receive reviews!</p>
            </div>
          ) : !showReviews ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/profile/${review.reviewer.id}`}
                      className="font-semibold text-plant-green-600 dark:text-plant-green-400 hover:underline"
                    >
                      {review.reviewer.username}
                    </Link>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < review.rating ? 'text-yellow-400 text-sm' : 'text-gray-300 text-sm'}>
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">{review.comment}</p>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/profile/${review.reviewer.id}`}
                        className="font-semibold text-plant-green-600 dark:text-plant-green-400 hover:underline"
                      >
                        {review.reviewer.username}
                      </Link>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                  )}
                </div>
              ))}
              {reviews.length < (user.reviewCount || 0) && (
                <Link
                  href={`/profile/${userId}/reviews`}
                  className="block text-center px-6 py-3 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold mt-4"
                >
                  View All {user.reviewCount} Reviews →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

