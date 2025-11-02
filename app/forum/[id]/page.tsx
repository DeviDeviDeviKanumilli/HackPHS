'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { MessageSquare, Send, Trash2, User } from 'lucide-react';

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
    id?: string;
    _id?: string;
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
      } else {
        console.error('Error fetching post:', data.error || 'Unknown error');
        if (response.status === 404) {
          setPost(null);
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setPost(null);
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

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/forum/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/forum');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An error occurred while deleting the post');
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/forum/${postId}/reply/${replyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPost();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete reply');
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      alert('An error occurred while deleting the reply');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="text-plant-green-600 dark:text-plant-green-400 text-lg">Loading post...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="text-red-600 dark:text-red-400 text-lg font-semibold">Post not found</div>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Post ID: {postId || 'undefined'}</p>
          <Link
            href="/forum"
            className="mt-4 inline-block text-plant-green-600 dark:text-plant-green-400 hover:underline"
          >
            ← Back to Forum
          </Link>
        </div>
      </div>
    );
  }

  // Defensive checks for required fields
  if (!post._id && !post.id) {
    console.error('Post missing ID:', post);
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="text-red-600 dark:text-red-400 text-lg font-semibold">Invalid post data</div>
          <Link
            href="/forum"
            className="mt-4 inline-block text-plant-green-600 dark:text-plant-green-400 hover:underline"
          >
            ← Back to Forum
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/forum"
            className="inline-flex items-center text-plant-green-600 hover:text-plant-green-700 mb-6 font-medium transition-colors"
          >
            ← Back to Forum
          </Link>

          {/* Post Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-plant-green-600 to-emerald-500">
                  {post.title || 'Untitled Post'}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <span className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>
                      By{' '}
                      {post.authorId?._id ? (
                        <Link
                          href={`/profile/${post.authorId._id}`}
                          className="font-semibold text-plant-green-600 dark:text-plant-green-400 hover:underline"
                        >
                          {post.authorId.username || 'Unknown'}
                        </Link>
                      ) : (
                        <span className="font-semibold text-gray-600 dark:text-gray-400">
                          {post.authorId?.username || 'Unknown'}
                        </span>
                      )}
                    </span>
                  </span>
                  <span>•</span>
                  <span>{post.timestamp ? new Date(post.timestamp).toLocaleString() : 'Unknown date'}</span>
                  <span className="px-3 py-1 bg-gradient-to-r from-plant-green-100 to-emerald-100 dark:from-plant-green-900 dark:to-emerald-900 text-plant-green-700 dark:text-plant-green-300 rounded-full text-xs font-semibold">
                    {post.category || 'general'}
                  </span>
                </div>
              </div>
              {session?.user?.id === post.authorId?._id && (
                <motion.button
                  onClick={handleDeletePost}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="ml-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold text-sm flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </motion.button>
              )}
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                {post.content || 'No content available.'}
              </p>
            </div>
          </motion.div>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-6">
              <MessageSquare className="w-6 h-6 text-plant-green-600 dark:text-plant-green-400" />
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-plant-green-600 to-emerald-500">
                Comments ({post.replies?.length || 0})
              </h2>
            </div>

            {post.replies && post.replies.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {post.replies.map((replyItem, index) => {
                    const replyId = replyItem.id || replyItem._id || `reply-${index}`;
                    const isReplyAuthor = session?.user?.id === replyItem.userId._id;
                    return (
                      <motion.div
                        key={replyId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border-l-4 border-plant-green-500 relative group hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Link
                            href={`/profile/${replyItem.userId._id}`}
                            className="font-semibold text-plant-green-600 dark:text-plant-green-400 hover:underline flex items-center space-x-2"
                          >
                            <User className="w-4 h-4" />
                            <span>{replyItem.userId.username}</span>
                          </Link>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(replyItem.timestamp).toLocaleString()}
                            </span>
                            {isReplyAuthor && (
                              <motion.button
                                onClick={() => handleDeleteReply(replyId)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="opacity-0 group-hover:opacity-100 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                                title="Delete comment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {replyItem.content}
                        </p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            )}
          </motion.div>

          {/* Comment Form */}
          {session ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center space-x-3 mb-6">
                <MessageSquare className="w-6 h-6 text-plant-green-600 dark:text-plant-green-400" />
                <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-plant-green-600 to-emerald-500">
                  Add a Comment
                </h3>
              </div>
              <form onSubmit={handleReply}>
                <textarea
                  rows={5}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-plant-green-500 focus:border-plant-green-500 dark:focus:ring-plant-green-400 dark:focus:border-plant-green-400 mb-4 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all resize-none"
                  placeholder="Share your thoughts..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  required
                />
                <motion.button
                  type="submit"
                  disabled={replying || !reply.trim()}
                  whileHover={{ scale: replying || !reply.trim() ? 1 : 1.02 }}
                  whileTap={{ scale: replying || !reply.trim() ? 1 : 0.98 }}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-plant-green-600 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {replying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Post Comment</span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 text-center"
            >
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
                Please{' '}
                <Link href="/login" className="text-plant-green-600 dark:text-plant-green-400 hover:underline font-semibold">
                  log in
                </Link>{' '}
                to join the conversation
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

