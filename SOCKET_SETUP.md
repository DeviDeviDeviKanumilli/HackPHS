# Socket.IO Setup Guide

Socket.IO requires a custom server setup to work with Next.js. Follow these steps:

## 1. Install Dependencies

```bash
npm install socket.io @types/socket.io
```

## 2. Update package.json

Add a new script to run the custom server:

```json
{
  "scripts": {
    "dev:server": "node server.js",
    "start:server": "NODE_ENV=production node server.js"
  }
}
```

## 3. Environment Variables

Add to `.env.local`:

```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000/api/socket
```

## 4. Usage in Components

```typescript
import { useSocket } from '@/hooks/useSocket';

function ChatComponent() {
  const { socket, isConnected, emit, on, off } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Join conversation
    emit('join_conversation', otherUserId);

    // Listen for new messages
    const handleNewMessage = (message: any) => {
      // Update UI with new message
    };
    
    on('new_message', handleNewMessage);

    return () => {
      off('new_message', handleNewMessage);
      emit('leave_conversation', otherUserId);
    };
  }, [socket, otherUserId]);

  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
      {/* Chat UI */}
    </div>
  );
}
```

## 5. Running the Server

Development:
```bash
npm run dev:server
```

Production:
```bash
npm run build
npm run start:server
```

## Notes

- Socket.IO runs on the same port as Next.js (3000)
- Authentication is handled via NextAuth session tokens
- Messages are emitted to conversation rooms for real-time delivery

