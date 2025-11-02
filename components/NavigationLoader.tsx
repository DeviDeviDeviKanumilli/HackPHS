'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function NavigationLoader() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Intercept all link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:')) {
        const url = new URL(link.href);
        // Only show loader for internal navigation
        if (url.origin === window.location.origin) {
          setIsNavigating(true);
          setProgress(0);
          startTimeRef.current = Date.now();
          
          // Clear any existing interval and cleanup
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          if (cleanupRef.current) {
            cleanupRef.current();
          }

          // Track document ready state for accurate progress
          const checkDocumentState = () => {
            const readyState = document.readyState;
            let currentProgress = 0;

            // Map readyState to progress
            if (readyState === 'loading') {
              currentProgress = 30; // Document is loading
            } else if (readyState === 'interactive') {
              currentProgress = 70; // DOM is ready but resources may still be loading
            } else if (readyState === 'complete') {
              currentProgress = 90; // Everything is loaded
            }

            setProgress(currentProgress);
          };

          // Check immediately
          checkDocumentState();

          // Monitor document ready state changes
          const handleStateChange = () => {
            checkDocumentState();
          };

          document.addEventListener('readystatechange', handleStateChange);

          // Store cleanup function
          cleanupRef.current = () => {
            document.removeEventListener('readystatechange', handleStateChange);
          };

          // Fallback: gradually increase progress if readyState doesn't change
          // This handles cases where navigation is slow
          let fallbackProgress = 10;
          progressIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - (startTimeRef.current || Date.now());
            const elapsedSeconds = elapsed / 1000;
            
            // Base progress on time elapsed (capped at 85% until page actually loads)
            // Fast navigation: 0-100ms = 10-30%, 100-300ms = 30-60%, 300-500ms = 60-85%
            if (elapsedSeconds < 0.1) {
              fallbackProgress = Math.min(30, 10 + (elapsedSeconds * 200));
            } else if (elapsedSeconds < 0.3) {
              fallbackProgress = Math.min(60, 30 + ((elapsedSeconds - 0.1) * 150));
            } else if (elapsedSeconds < 0.5) {
              fallbackProgress = Math.min(85, 60 + ((elapsedSeconds - 0.3) * 125));
            } else {
              fallbackProgress = Math.min(90, 85 + ((elapsedSeconds - 0.5) * 10));
            }

            // Only update if current progress is less than fallback
            setProgress((prev) => Math.max(prev, fallbackProgress));

            // Clean up after 5 seconds (shouldn't take that long)
            if (elapsedSeconds > 5) {
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
            }
          }, 16); // ~60fps updates
        }
      }
    };

    // Listen for link clicks
    document.addEventListener('click', handleLinkClick, true);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // When pathname changes, complete the progress
    if (isNavigating) {
      // Check if page is actually loaded
      const checkComplete = () => {
        if (document.readyState === 'complete') {
          setProgress(100);
          
          // Clean up interval
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
          }

          // Hide loader after a brief moment
          const timer = setTimeout(() => {
            setIsNavigating(false);
            setProgress(0);
            startTimeRef.current = null;
          }, 300);

          return () => clearTimeout(timer);
        } else {
          // If not complete, wait a bit and check again
          const timer = setTimeout(() => {
            if (document.readyState === 'complete') {
              setProgress(100);
              setTimeout(() => {
                setIsNavigating(false);
                setProgress(0);
                startTimeRef.current = null;
              }, 300);
            }
          }, 100);

          return () => clearTimeout(timer);
        }
      };

      // Check immediately
      const cleanup = checkComplete();

      // Also listen for readystatechange
      const handleComplete = () => {
        if (document.readyState === 'complete') {
          setProgress(100);
          setTimeout(() => {
            setIsNavigating(false);
            setProgress(0);
            startTimeRef.current = null;
          }, 300);
        }
      };

      document.addEventListener('readystatechange', handleComplete);

      return () => {
        if (cleanup) cleanup();
        document.removeEventListener('readystatechange', handleComplete);
      };
    }
  }, [pathname, isNavigating]);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
        >
          {/* Accurate progress bar container */}
          <div className="relative h-1 bg-gray-200 dark:bg-gray-700">
            {/* Progress bar */}
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-plant-green-400 via-emerald-500 to-plant-green-600 shadow-lg"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            />
            {/* Shimmer effect overlay */}
            {progress > 0 && progress < 100 && (
              <motion.div
                className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{ left: `${Math.max(0, progress - 20)}%` }}
                animate={{
                  x: [0, progress > 20 ? 80 : progress * 4],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

