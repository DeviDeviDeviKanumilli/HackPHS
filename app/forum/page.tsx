'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SkeletonPostCard } from '@/components/SkeletonLoader';

interface ForumPost {
  _id: string;
  title: string;
  content: string;
  category: string;
  timestamp: string;
  authorId: {
    username: string;
    _id: string;
  };
  replies: Array<{
    userId: {
      username: string;
      _id: string;
    };
    content: string;
    timestamp: string;
  }>;
}

export default function ForumPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  // Memoize fetchPosts to prevent unnecessary re-renders
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/forum';
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchPosts();
    // Poll for updates every 30 seconds (reduced frequency)
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const categories = [
    { value: '', label: 'All Topics' },
    { value: 'general', label: 'General' },
    { value: 'trading-tips', label: 'Trading Tips' },
    { value: 'care-advice', label: 'Care Advice' },
    { value: 'community', label: 'Community' },
  ];

  // Memoized Post Card Component
  const PostCard = memo(({ post, index }: { post: ForumPost; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link 
            href={`/forum/${post._id}`}
            prefetch={true}
            onMouseEnter={() => {
              import('@/lib/routePrefetch').then(({ prefetchRoute }) => {
                prefetchRoute(`/forum/${post._id}`);
              });
            }}
          >
            <h3 className="text-xl font-semibold text-plant-green-800 dark:text-plant-green-200 mb-2 hover:text-plant-green-600 dark:hover:text-plant-green-400 transition-colors">
              {post.title}
            </h3>
          </Link>
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {post.content}
          </p>
        </div>
        <span className="px-3 py-1 bg-plant-green-100 dark:bg-plant-green-900 text-plant-green-700 dark:text-plant-green-300 rounded-full text-xs font-semibold ml-4 shrink-0">
          {post.category}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 flex-wrap gap-2">
        <span>
          By{' '}
          <Link
            href={`/profile/${post.authorId._id}`}
            prefetch={true}
            className="font-semibold text-plant-green-600 dark:text-plant-green-400 hover:text-plant-green-700 dark:hover:text-plant-green-300"
            onMouseEnter={() => {
              import('@/lib/routePrefetch').then(({ prefetchRoute }) => {
                prefetchRoute(`/profile/${post.authorId._id}`);
              });
            }}
          >
            {post.authorId.username}
          </Link>
          {' • '}
          {new Date(post.timestamp).toLocaleDateString()}
        </span>
        <span>
          {post.replies?.length || 0} replies
        </span>
      </div>
    </motion.div>
  ));

  PostCard.displayName = 'PostCard';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-4xl font-bold text-plant-green-800 mb-4 md:mb-0">
            Community Forum 💬
          </h1>
          {session && (
            <Link
              href="/forum/new"
              prefetch={true}
              className="px-6 py-3 bg-gradient-plant text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              onMouseEnter={() => {
                import('@/lib/routePrefetch').then(({ prefetchRoute }) => {
                  prefetchRoute('/forum/new');
                });
              }}
            >
              New Post
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search posts..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonPostCard key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <span className="text-6xl mb-4 block">💬</span>
            <p className="text-gray-600 dark:text-gray-300">No posts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <PostCard key={post._id} post={post} index={index} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

