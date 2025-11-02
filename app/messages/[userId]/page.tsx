'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
// import { io, Socket } from 'socket.io-client';

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
  read: boolean;
}

export default function ChatPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  // const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUserId = params.userId as string;

  // Memoize fetchMessages to prevent unnecessary re-renders
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/messages?userId=${otherUserId}`);
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [otherUserId]);

  useEffect(() => {
    if (session) {
      fetchMessages();
      // Poll less frequently to reduce server load
      const interval = setInterval(fetchMessages, 5000); // Changed from 2s to 5s
      return () => clearInterval(interval);
    }
  }, [session, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Removed duplicate - using memoized version above

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: otherUserId,
          content: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!session) {
    return <div>Please log in to view messages</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg h-[600px] flex flex-col"
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-plant-green-800">
            Chat
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-plant-green-600">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message, index) => {
              const isSender = message.senderId._id === session.user?.id;
              // Ensure we have a unique, stable key
              const messageKey = message._id || `message-${index}-${message.timestamp}`;
              return (
                <div
                  key={messageKey}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                      isSender
                        ? 'bg-plant-green-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p
                        className={`text-xs ${
                          isSender ? 'text-plant-green-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                      {isSender && (
                        <span className="text-xs text-plant-green-100">
                          {message.read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                    {isSender && (
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/messages/${message._id}`, {
                              method: 'DELETE',
                            });
                            if (response.ok) {
                              fetchMessages();
                            }
                          } catch (err) {
                            console.error('Error deleting message:', err);
                          }
                        }}
                        className="absolute top-1 right-1 text-xs opacity-0 hover:opacity-100 transition-opacity text-white hover:text-red-200"
                        title="Delete message"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                // Client-side length validation
                if (e.target.value.length <= 5000) {
                  setNewMessage(e.target.value);
                }
              }}
              placeholder="Type a message... (max 5000 characters)"
              maxLength={5000}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-plant-green-500 focus:border-plant-green-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors font-semibold"
            >
              Send
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

