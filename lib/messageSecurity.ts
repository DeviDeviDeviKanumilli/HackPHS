/**
 * Security utilities for messaging system
 * Includes content sanitization, validation, and security checks
 */

/**
 * Sanitize message content to prevent XSS attacks
 * Removes HTML tags but preserves plain text
 */
export function sanitizeMessage(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove HTML tags completely
  let sanitized = content.replace(/<[^>]*>/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validate message content
 * Returns validation result with error message if invalid
 */
export function validateMessage(content: string): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content is required' };
  }

  const trimmed = content.trim();

  // Check minimum length
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  // Check maximum length (5000 characters)
  if (trimmed.length > 5000) {
    return { valid: false, error: 'Message cannot exceed 5000 characters' };
  }

  // Check for suspicious patterns (basic spam detection)
  const suspiciousPatterns = [
    /(.)\1{10,}/, // Repeated characters (e.g., "aaaaaaaaaaa")
    /(http[s]?:\/\/){2,}/i, // Multiple URLs
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Message contains suspicious content' };
    }
  }

  return { valid: true };
}

/**
 * Check for potentially inappropriate content (basic filtering)
 * In production, use a proper content moderation service
 */
export function containsInappropriateContent(content: string): boolean {
  // Basic profanity filter - in production, use a proper service
  const inappropriateWords = [
    // Add common inappropriate words here if needed
    // This is just a placeholder for a more sophisticated system
  ];

  const lowerContent = content.toLowerCase();
  
  // Check for spam indicators
  const spamIndicators = [
    /buy now/i,
    /click here/i,
    /limited time/i,
    /act now/i,
  ];

  return spamIndicators.some(pattern => pattern.test(lowerContent));
}

/**
 * Rate limiting check (basic implementation)
 * In production, use Redis or a proper rate limiting service
 */
const messageRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string, maxMessages: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = messageRateLimits.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    messageRateLimits.set(userId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (userLimit.count >= maxMessages) {
    return false; // Rate limit exceeded
  }

  // Increment count
  userLimit.count++;
  messageRateLimits.set(userId, userLimit);
  return true;
}

/**
 * Validate user ID format (Prisma CUID format)
 * CUID format: starts with 'c' followed by base36 characters, length 25
 */
export function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // Prisma CUID format: starts with 'c' followed by base36, length 25
  return /^c[a-z0-9]{24}$/.test(id);
}

