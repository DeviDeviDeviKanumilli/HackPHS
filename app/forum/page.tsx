'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    fetchPosts();
  }, [category, search]);

  const fetchPosts = async () => {
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
  };

  const categories = [
    { value: '', label: 'All Topics' },
    { value: 'general', label: 'General' },
    { value: 'trading-tips', label: 'Trading Tips' },
    { value: 'care-advice', label: 'Care Advice' },
    { value: 'community', label: 'Community' },
  ];

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
              className="px-6 py-3 bg-gradient-plant text-white rounded-lg hover:shadow-lg transition-all font-semibold"
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
          <div className="text-center py-12">
            <div className="text-plant-green-600">Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <span className="text-6xl mb-4 block">💬</span>
            <p className="text-gray-600">No posts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link href={`/forum/${post._id}`}>
                      <h3 className="text-xl font-semibold text-plant-green-800 mb-2 hover:text-plant-green-600">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.content}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-plant-green-100 text-plant-green-700 rounded-full text-xs font-semibold ml-4">
                    {post.category}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    By{' '}
                    <Link
                      href={`/profile/${post.authorId._id}`}
                      className="font-semibold text-plant-green-600 hover:text-plant-green-700"
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
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

