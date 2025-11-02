// Sentry error tracking setup
// Only initialize in server-side code

let sentryInitialized = false;

let dsn: string | undefined;

export function initSentry() {
  if (typeof window !== 'undefined' || sentryInitialized) {
    return;
  }

  dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log('⚠️ Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  try {
    // Dynamic import to avoid bundling Sentry in client
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        debug: process.env.NODE_ENV === 'development',
        // Configure release tracking
        release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
        // Filter out sensitive data
        beforeSend(event, hint) {
          // Remove sensitive data from error contexts
          if (event.request) {
            delete event.request.cookies;
            if (event.request.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
            }
          }
          return event;
        },
      });
      sentryInitialized = true;
      console.log('✅ Sentry initialized');
    }).catch((error) => {
      console.error('❌ Failed to initialize Sentry:', error);
    });
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
}

/**
 * Capture exception to Sentry
 */
export async function captureException(
  error: Error,
  context?: {
    userId?: string;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  if (!sentryInitialized || !dsn) {
    return;
  }

  try {
    const Sentry = await import('@sentry/nextjs');
    
    Sentry.withScope((scope) => {
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (context?.extra) {
        scope.setContext('extra', context.extra);
      }
      Sentry.captureException(error);
    });
  } catch (err) {
    console.error('Failed to capture exception to Sentry:', err);
  }
}

/**
 * Capture message to Sentry
 */
export async function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) {
  if (!sentryInitialized || !process.env.SENTRY_DSN) {
    return;
  }

  try {
    const Sentry = await import('@sentry/nextjs');
    
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('extra', context);
      }
      Sentry.captureMessage(message, level);
    });
  } catch (err) {
    console.error('Failed to capture message to Sentry:', err);
  }
}

// Initialize Sentry on module load (server-side only)
if (typeof window === 'undefined') {
  initSentry();
}

