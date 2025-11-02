'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SkeletonPostCard } from '@/components/SkeletonLoader';

interface ForumPost {
  _id?: string;
  id?: string;
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
  const PostCard = memo(({ post, index, onDelete }: { post: ForumPost; index: number; onDelete: () => void }) => {
    const router = useRouter();
    const isAuthor = session?.user?.id === post.authorId._id;

    const handleDelete = async () => {
      if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
      }

      try {
        const postId = post._id || post.id;
        if (!postId) {
          alert('Error: Post ID not found');
          return;
        }
        const response = await fetch(`/api/forum/${postId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Refresh posts list
          onDelete();
        } else {
          const data = await response.json();
          alert(data.error || 'Failed to delete post');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('An error occurred while deleting the post');
      }
    };

    const postId = post._id || post.id;
    if (!postId) {
      console.error('Post missing ID:', post);
      return null;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
        className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700"
      >
        <Link 
          href={`/forum/${postId}`}
          prefetch={true}
          className="block cursor-pointer"
          onMouseEnter={() => {
            import('@/lib/routePrefetch').then(({ prefetchRoute }) => {
              prefetchRoute(`/forum/${postId}`);
            });
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-plant-green-800 dark:text-plant-green-200 mb-2 hover:text-plant-green-600 dark:hover:text-plant-green-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                {post.content}
              </p>
            </div>
            <div className="flex items-start space-x-2 ml-4 shrink-0">
              <span className="px-3 py-1 bg-plant-green-100 dark:bg-plant-green-900 text-plant-green-700 dark:text-plant-green-300 rounded-full text-xs font-semibold">
                {post.category}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 flex-wrap gap-2">
            <span>
              By{' '}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/profile/${post.authorId._id}`);
                }}
                className="font-semibold text-plant-green-600 dark:text-plant-green-400 hover:text-plant-green-700 dark:hover:text-plant-green-300 cursor-pointer underline-offset-2 hover:underline bg-transparent border-none p-0"
              >
                {post.authorId.username}
              </button>
              {' • '}
              {new Date(post.timestamp).toLocaleDateString()}
            </span>
            <span>
              {post.replies?.length || 0} replies
            </span>
          </div>
        </Link>
        {isAuthor && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
              title="Delete post"
            >
              🗑️ Delete Post
            </button>
          </div>
        )}
      </motion.div>
    );
  });

  PostCard.displayName = 'PostCard';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-plant-green-800 dark:text-plant-green-200 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-plant-green-600 to-emerald-500">
                Community Forum 💬
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Join discussions, share tips, and connect with fellow plant lovers
              </p>
            </div>
            {session && (
              <Link
                href="/forum/new"
                prefetch={true}
                className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-plant-green-600 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold transform hover:scale-105"
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  📂 Category
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-plant-green-500 focus:border-plant-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  🔍 Search
                </label>
                <input
                  type="text"
                  placeholder="Search posts..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-plant-green-500 focus:border-plant-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </motion.div>

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
            {posts.map((post, index) => {
              const baseKey = post._id ?? post.id ?? post.title ?? 'post';
              const uniqueKey = `${baseKey}-${index}`;
              return <PostCard key={uniqueKey} post={post} index={index} onDelete={fetchPosts} />;
            })}
          </div>
        )}
        </motion.div>
      </div>
    </div>
  );
}

