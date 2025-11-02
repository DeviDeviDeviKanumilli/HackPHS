// Content moderation utilities
// Supports multiple moderation services

/**
 * Moderate text content using Perspective API or local checks
 */
export async function moderateText(
  text: string,
  options?: {
    checkToxicity?: boolean;
    checkSpam?: boolean;
  }
): Promise<{
  approved: boolean;
  reasons: string[];
  score?: number;
}> {
  const reasons: string[] = [];
  let approved = true;

  // 1. Basic local checks (always run)
  if (containsProfanity(text)) {
    approved = false;
    reasons.push('Contains inappropriate language');
  }

  if (isSpam(text)) {
    approved = false;
    reasons.push('Appears to be spam');
  }

  // 2. Use Perspective API if configured and requested
  if (options?.checkToxicity && process.env.PERSPECTIVE_API_KEY) {
    try {
      const perspectiveResult = await checkPerspectiveAPI(text);
      if (perspectiveResult.toxicity > 0.7) {
        approved = false;
        reasons.push('High toxicity score');
      }
    } catch (error) {
      console.error('Perspective API error:', error);
      // Continue with local checks if API fails
    }
  }

  return {
    approved,
    reasons,
  };
}

/**
 * Check Perspective API for toxicity
 */
async function checkPerspectiveAPI(text: string): Promise<{
  toxicity: number;
  spam: number;
}> {
  const apiKey = process.env.PERSPECTIVE_API_KEY;
  if (!apiKey) {
    throw new Error('Perspective API key not configured');
  }

  const response = await fetch(
    `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: { text },
        requestedAttributes: {
          TOXICITY: {},
          SPAM: {},
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Perspective API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    toxicity: data.attributeScores?.TOXICITY?.summaryScore?.value || 0,
    spam: data.attributeScores?.SPAM?.summaryScore?.value || 0,
  };
}

/**
 * Basic profanity check (local)
 */
function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Basic profanity list (expand as needed)
  const profanityPatterns = [
    /\b(fuck|shit|damn|bitch|asshole)\b/i,
    // Add more patterns as needed
  ];

  return profanityPatterns.some(pattern => pattern.test(lowerText));
}

/**
 * Spam detection (local)
 */
function isSpam(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Spam indicators
  const spamIndicators = [
    /(.)\1{10,}/, // Repeated characters
    /(http[s]?:\/\/){2,}/i, // Multiple URLs
    /(buy now|click here|limited time|act now)/i,
    /\b\d{10,}\b/, // Long number sequences (phone numbers, etc.)
  ];

  // Check if text is too repetitive
  const words = lowerText.split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitionRatio = uniqueWords.size / words.length;
  if (words.length > 10 && repetitionRatio < 0.3) {
    return true; // Too repetitive
  }

  return spamIndicators.some(pattern => pattern.test(lowerText));
}

/**
 * Moderate image URL (placeholder for image moderation)
 */
export async function moderateImage(imageUrl: string): Promise<{
  approved: boolean;
  reasons: string[];
}> {
  // In production, use Google Cloud Vision API or AWS Rekognition
  // For now, return approved if URL is valid
  const isValidUrl = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)/i.test(imageUrl);
  
  return {
    approved: isValidUrl,
    reasons: isValidUrl ? [] : ['Invalid image URL format'],
  };
}

/**
 * Check if user should be rate-limited based on moderation history
 */
export async function checkModerationHistory(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // In production, check database for moderation flags
  // For now, always allow
  return { allowed: true };
}

