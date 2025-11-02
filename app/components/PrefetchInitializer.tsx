'use client';

import { useEffect } from 'react';

export default function PrefetchInitializer() {
  useEffect(() => {
    // Add resource hints for critical routes
    const addResourceHints = () => {
      const head = document.head;
      
      // Prefetch critical routes
      const routes = ['/library', '/trades', '/forum'];
      routes.forEach(route => {
        if (!document.querySelector(`link[rel="prefetch"][href="${route}"]`)) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = route;
          link.setAttribute('as', 'document');
          head.appendChild(link);
        }
      });

      // DNS prefetch for API routes
      const apiRoutes = ['/api/plants', '/api/trades', '/api/forum'];
      apiRoutes.forEach(route => {
        if (!document.querySelector(`link[rel="dns-prefetch"][href="${route}"]`)) {
          const link = document.createElement('link');
          link.rel = 'dns-prefetch';
          link.href = route;
          head.appendChild(link);
        }
      });
    };

    // Initialize prefetching after component mounts
    const initPrefetch = async () => {
      try {
        // Add resource hints
        addResourceHints();
        
        // Initialize prefetching system
        const { initPrefetching } = await import('@/lib/routePrefetch');
        initPrefetching();
      } catch (error) {
        // Silently fail - prefetching is optional
        console.debug('Prefetch initialization failed:', error);
      }
    };

    // Small delay to not block initial render
    const timeoutId = setTimeout(initPrefetch, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}

