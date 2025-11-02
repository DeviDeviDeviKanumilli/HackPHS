'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

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

export default function PostPage() {
  const params = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);

  const postId = params.id as string;

  useEffect(() => {
    fetchPost();
    // Poll for updates less frequently
    const interval = setInterval(fetchPost, 10000); // Changed from 3s to 10s
    return () => clearInterval(interval);
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/forum/${postId}`);
      const data = await response.json();
      if (response.ok && data.post) {
        setPost(data.post);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !session) return;

    setReplying(true);
    try {
      const response = await fetch(`/api/forum/${postId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: reply }),
      });

      if (response.ok) {
        setReply('');
        fetchPost();
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="text-plant-green-600">Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="text-red-600">Post not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          href="/forum"
          className="text-plant-green-600 hover:text-plant-green-700 mb-4 inline-block"
        >
          ← Back to Forum
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-plant-green-800 mb-4">
                {post.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                <span>
                  By{' '}
                  <Link
                    href={`/profile/${post.authorId._id}`}
                    className="font-semibold text-plant-green-600 hover:text-plant-green-700"
                  >
                    {post.authorId.username}
                  </Link>
                </span>
                <span>•</span>
                <span>{new Date(post.timestamp).toLocaleString()}</span>
                <span className="px-3 py-1 bg-plant-green-100 text-plant-green-700 rounded-full text-xs font-semibold">
                  {post.category}
                </span>
              </div>
            </div>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-plant-green-800 mb-4">
            Replies ({post.replies?.length || 0})
          </h2>

          {post.replies && post.replies.length > 0 ? (
            <div className="space-y-4">
              {post.replies.map((replyItem, index) => (
                <div
                  key={index}
                  className="border-l-4 border-plant-green-200 pl-4 py-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/profile/${replyItem.userId._id}`}
                      className="font-semibold text-plant-green-600 hover:text-plant-green-700"
                    >
                      {replyItem.userId.username}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {new Date(replyItem.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{replyItem.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No replies yet. Be the first to reply!</p>
          )}
        </div>

        {session ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-plant-green-800 mb-4">
              Add a Reply
            </h3>
            <form onSubmit={handleReply}>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500 mb-4"
                placeholder="Write your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={replying}
                className="px-6 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold disabled:opacity-50"
              >
                {replying ? 'Posting...' : 'Post Reply'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-600 mb-4">
              Please{' '}
              <Link href="/login" className="text-plant-green-600 hover:text-plant-green-700 font-semibold">
                log in
              </Link>{' '}
              to reply
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

