// Socket.IO server setup for real-time messaging
import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { logInfo, logError } from './logger';

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server
 */
export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth
      const token = socket.handshake.auth?.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token (using NextAuth's JWT decode)
      // In production, verify with NextAuth session
      // For now, we'll accept the token and verify on message send
      socket.data.userId = token; // Store userId from token
      next();
    } catch (error) {
      logError(error as Error, { context: 'socket_auth' });
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    logInfo('Socket connected', { userId, socketId: socket.id });

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle joining conversation room
    socket.on('join_conversation', (otherUserId: string) => {
      const roomId = getConversationRoomId(userId, otherUserId);
      socket.join(roomId);
      logInfo('Joined conversation room', { userId, otherUserId, roomId });
    });

    // Handle leaving conversation room
    socket.on('leave_conversation', (otherUserId: string) => {
      const roomId = getConversationRoomId(userId, otherUserId);
      socket.leave(roomId);
      logInfo('Left conversation room', { userId, otherUserId, roomId });
    });

    // Handle typing indicator
    socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(data.conversationId).emit('user_typing', {
        userId,
        isTyping: data.isTyping,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logInfo('Socket disconnected', { userId, socketId: socket.id });
    });
  });

  logInfo('Socket.IO server initialized');
  return io;
}

/**
 * Get Socket.IO instance
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit message to conversation room
 */
export function emitMessage(
  senderId: string,
  receiverId: string,
  message: any
) {
  if (!io) {
    logError(new Error('Socket.IO not initialized'), {
      context: 'emit_message',
    });
    return;
  }

  const roomId = getConversationRoomId(senderId, receiverId);
  io.to(roomId).emit('new_message', message);
  
  // Also notify user's personal room for real-time updates
  io.to(`user:${receiverId}`).emit('message_notification', {
    senderId,
    message,
  });

  logInfo('Message emitted', { senderId, receiverId, roomId });
}

/**
 * Emit typing indicator
 */
export function emitTyping(
  userId: string,
  otherUserId: string,
  isTyping: boolean
) {
  if (!io) {
    return;
  }

  const roomId = getConversationRoomId(userId, otherUserId);
  io.to(roomId).emit('user_typing', {
    userId,
    isTyping,
  });
}

/**
 * Get conversation room ID (consistent ordering)
 */
function getConversationRoomId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `conversation:${sorted[0]}:${sorted[1]}`;
}

