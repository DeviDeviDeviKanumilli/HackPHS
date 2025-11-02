'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface PrefetchLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
  [key: string]: any;
}

/**
 * Enhanced Link component with aggressive prefetching
 * Automatically prefetches routes on hover for faster navigation
 */
export default function PrefetchLink({ 
  href, 
  children, 
  className, 
  prefetch = true,
  ...props 
}: PrefetchLinkProps) {
  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && prefetch) {
      // Prefetch the route and related resources
      import('@/lib/routePrefetch').then(({ prefetchRoute }) => {
        prefetchRoute(href);
      });
    }
  };

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={className}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
}

