// Centralized error handling utilities
import { NextResponse } from 'next/server';
import { logError, generateRequestId } from './logger';
import { captureException } from './sentry';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle API route errors consistently
 */
export function handleApiError(
  error: unknown,
  context?: {
    userId?: string;
    endpoint?: string;
    requestId?: string;
  }
): NextResponse {
  const requestId = context?.requestId || generateRequestId();

  // Log the error
  logError(error, {
    ...context,
    requestId,
  });

  // Send to Sentry if it's not an operational error
  if (error instanceof AppError && !error.isOperational) {
    captureException(error, {
      userId: context?.userId,
      tags: {
        endpoint: context?.endpoint || 'unknown',
        requestId,
      },
    });
  } else if (!(error instanceof AppError)) {
    // Non-AppError exceptions should be tracked
    captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        userId: context?.userId,
        tags: {
          endpoint: context?.endpoint || 'unknown',
          requestId,
        },
      }
    );
  }

  // Return appropriate response
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        requestId,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
        }),
      },
      { status: error.statusCode }
    );
  }

  // Database errors
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return NextResponse.json(
        {
          error: 'Request timed out. Please try again.',
          requestId,
        },
        { status: 504 }
      );
    }

    if (
      error.message.includes('Unique constraint') ||
      error.message.includes('duplicate')
    ) {
      return NextResponse.json(
        {
          error: 'A record with this information already exists.',
          requestId,
        },
        { status: 409 }
      );
    }

    if (error.message.includes('Record to update not found')) {
      return NextResponse.json(
        {
          error: 'Resource not found.',
          requestId,
        },
        { status: 404 }
      );
    }
  }

  // Generic error response
  return NextResponse.json(
    {
      error: 'An unexpected error occurred. Please try again later.',
      requestId,
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : String(error),
      }),
    },
    { status: 500 }
  );
}

/**
 * Wrap API route handler with error handling
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract context from request if available
      const request = args[0] as { url?: string };
      const endpoint = request?.url ? new URL(request.url).pathname : undefined;

      return handleApiError(error, {
        endpoint,
        requestId: generateRequestId(),
      });
    }
  };
}

