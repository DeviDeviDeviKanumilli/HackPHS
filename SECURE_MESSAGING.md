# Secure Messaging Features

## Security Implementations

### 1. **Content Sanitization**
- **XSS Protection**: All HTML tags are stripped from messages
- **Input Validation**: Messages are validated for length and format
- **Content Filtering**: Basic inappropriate content detection

### 2. **Authentication & Authorization**
- **User Verification**: All endpoints require authentication
- **Access Control**: Users can only view/delete their own messages
- **Receiver Validation**: Verifies receiver exists before sending
- **Self-Message Prevention**: Blocks users from messaging themselves

### 3. **Rate Limiting**
- **Message Limits**: Maximum 10 messages per minute per user
- **Prevents Spam**: Protects against automated message flooding
- **Configurable**: Limits can be adjusted in `lib/messageSecurity.ts`

### 4. **Data Validation**
- **ObjectId Validation**: Ensures all user IDs are valid MongoDB ObjectIds
- **Content Length**: Messages limited to 5000 characters
- **Required Fields**: All required fields are validated before processing

### 5. **Read Receipts**
- **Read Status**: Tracks when messages are read
- **Auto-Mark Read**: Messages automatically marked as read when viewed
- **Visual Indicators**: Shows ✓ (sent) and ✓✓ (read) in message UI

### 6. **Message Deletion**
- **Soft Delete**: Messages are marked as deleted, not permanently removed
- **Sender Only**: Only the sender can delete their messages
- **Privacy**: Deleted messages don't appear in conversation history

### 7. **Query Security**
- **User Isolation**: Users can only see messages they're part of
- **Limit Protection**: Results limited to 100 messages per query
- **Deleted Filter**: Deleted messages are automatically excluded

## API Endpoints

### `GET /api/messages`
- Fetches messages for authenticated user
- Query params: `userId` (optional) - to get messages with specific user
- Returns only messages where user is sender or receiver
- Excludes deleted messages

### `POST /api/messages`
- Creates a new message
- Requires: `receiverId`, `content`
- Validates and sanitizes content
- Checks rate limits
- Verifies receiver exists

### `PATCH /api/messages/[id]`
- Marks message as read
- Only receiver can mark messages as read
- Used automatically when viewing conversation

### `DELETE /api/messages/[id]`
- Soft deletes a message
- Only sender can delete their messages
- Marks message as deleted (doesn't remove from DB)

## Client-Side Features

### Message Display
- **Read Receipts**: Shows ✓ for sent, ✓✓ for read
- **Delete Button**: Senders can delete their messages (hover to see)
- **Character Limit**: Input field enforces 5000 character limit
- **Auto-Scroll**: Automatically scrolls to latest message
- **Unread Indicators**: Shows unread count in conversations list

### Auto-Mark Read
- Messages are automatically marked as read when viewing conversation
- Happens in background without user interaction

## Security Best Practices

1. **Always validate** user input on both client and server
2. **Sanitize** all content before storing in database
3. **Rate limit** to prevent abuse and spam
4. **Authenticate** all endpoints
5. **Authorize** to ensure users can only access their data
6. **Use soft deletes** for audit trail
7. **Limit query results** to prevent DoS attacks

## Future Enhancements

- End-to-end encryption for messages (requires client-side key management)
- Advanced content moderation using AI services
- Message reporting functionality
- Block user feature
- Persistent rate limiting with Redis
- Message search functionality
- File attachments (with virus scanning)
- Message forwarding capabilities

