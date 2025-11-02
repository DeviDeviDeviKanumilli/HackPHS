'use client';

/**
 * Utility functions for aggressive route prefetching
 * This makes navigation extremely fast by preloading routes
 */

// List of critical routes to prefetch on page load
const CRITICAL_ROUTES = [
  '/library',
  '/trades',
  '/forum',
  '/login',
  '/register',
];

// API routes that should be prefetched
const CRITICAL_API_ROUTES = [
  '/api/plants?limit=20',
  '/api/trades?limit=50',
  '/api/forum?limit=20',
];

/**
 * Prefetch a route using Next.js router
 */
export async function prefetchRoute(href: string) {
  if (typeof window === 'undefined') return;
  
  try {
    // Use Next.js built-in prefetching
    const { default: router } = await import('next/navigation');
    // Note: Next.js automatically prefetches on hover, but we can trigger it manually
    // by using router.prefetch() if available, or by creating a link and hovering
    
    // For now, we'll use link prefetching strategy
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  } catch (error) {
    // Silently fail - prefetching is optional
    console.debug('Prefetch failed for:', href);
  }
}

/**
 * Prefetch multiple routes in parallel
 */
export function prefetchRoutes(routes: string[]) {
  routes.forEach(route => {
    prefetchRoute(route);
  });
}

/**
 * Prefetch critical routes on page load
 */
export function prefetchCriticalRoutes() {
  if (typeof window === 'undefined') return;
  
  // Wait a bit after page load to not block initial render
  setTimeout(() => {
    prefetchRoutes(CRITICAL_ROUTES);
  }, 1000);
}

/**
 * Prefetch API routes that are commonly accessed
 */
export function prefetchCriticalAPIs() {
  if (typeof window === 'undefined') return;
  
  setTimeout(() => {
    CRITICAL_API_ROUTES.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  }, 2000);
}

/**
 * Setup aggressive prefetching on hover
 */
export function setupHoverPrefetch() {
  if (typeof window === 'undefined') return;
  
  // Intercept all link hovers
  document.addEventListener('mouseover', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;
    
    if (link && link.href) {
      const url = new URL(link.href);
      
      // Only prefetch same-origin links
      if (url.origin === window.location.origin) {
        const pathname = url.pathname;
        
        // Don't prefetch if already loaded
        if (!document.querySelector(`link[rel="prefetch"][href="${pathname}"]`)) {
          prefetchRoute(pathname);
        }
      }
    }
  }, { passive: true });
}

/**
 * Initialize all prefetching strategies
 */
export function initPrefetching() {
  if (typeof window === 'undefined') return;
  
  // Prefetch critical routes after page load
  prefetchCriticalRoutes();
  
  // Prefetch critical APIs
  prefetchCriticalAPIs();
  
  // Setup hover prefetching
  setupHoverPrefetch();
}

