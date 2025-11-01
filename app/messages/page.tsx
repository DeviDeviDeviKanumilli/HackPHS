'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Message {
  _id: string;
  senderId: {
    username: string;
    _id: string;
  };
  receiverId: {
    username: string;
    _id: string;
  };
  content: string;
  timestamp: string;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchConversations();
    } else {
      router.push('/login');
    }
  }, [session]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      if (response.ok) {
        // Group messages by conversation
        const conversationMap = new Map();
        
        data.messages?.forEach((message: Message) => {
          const otherUser =
            message.senderId._id === session?.user?.id
              ? message.receiverId
              : message.senderId;
          const conversationId =
            message.senderId._id === session?.user?.id
              ? message.receiverId._id
              : message.senderId._id;

          // Count unread messages for this conversation
          const isUnread = !message.read && message.receiverId._id === session?.user?.id;
          
          if (!conversationMap.has(conversationId)) {
            conversationMap.set(conversationId, {
              userId: otherUser._id,
              username: otherUser.username,
              lastMessage: message,
              unreadCount: isUnread ? 1 : 0,
            });
          } else {
            const existing = conversationMap.get(conversationId);
            if (new Date(message.timestamp) > new Date(existing.lastMessage.timestamp)) {
              existing.lastMessage = message;
            }
            if (isUnread) {
              existing.unreadCount = (existing.unreadCount || 0) + 1;
            }
          }
        });

        setConversations(Array.from(conversationMap.values()));
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-plant-green-800 mb-8">
          Messages 💬
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-plant-green-600">Loading conversations...</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <span className="text-6xl mb-4 block">💬</span>
            <p className="text-gray-600 mb-4">No messages yet</p>
            <p className="text-sm text-gray-500">
              Start a conversation by visiting someone's profile
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {conversations.map((conversation) => (
              <Link
                key={conversation.userId}
                href={`/messages/${conversation.userId}`}
                className="block border-b border-gray-200 hover:bg-plant-green-50 transition-colors p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-plant-green-800">
                        {conversation.username}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-plant-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm truncate">
                      {conversation.lastMessage.content}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-500">
                      {new Date(conversation.lastMessage.timestamp).toLocaleDateString()}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <div className="w-2 h-2 bg-plant-green-600 rounded-full mt-1 ml-auto"></div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

