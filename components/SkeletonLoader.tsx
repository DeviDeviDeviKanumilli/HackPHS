'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  height?: string;
  rounded?: boolean;
}

export function Skeleton({ className = '', height = 'h-4', rounded = true }: SkeletonProps) {
  return (
    <div
      className={`${height} bg-gray-200 dark:bg-gray-700 animate-pulse ${
        rounded ? 'rounded' : ''
      } ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <Skeleton height="h-64" rounded={false} />
      <div className="p-6 space-y-4">
        <Skeleton height="h-6" className="w-3/4" />
        <Skeleton height="h-4" className="w-full" />
        <Skeleton height="h-4" className="w-5/6" />
        <div className="flex gap-2">
          <Skeleton height="h-6" className="w-20" />
          <Skeleton height="h-6" className="w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTradeCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton height="h-6" className="w-3/4" />
            <Skeleton height="h-4" className="w-full" />
          </div>
          <Skeleton height="h-6" className="w-16" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton height="h-4" className="w-24" />
          <Skeleton height="h-4" className="w-20" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPostCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton height="h-6" className="w-2/3" />
            <Skeleton height="h-4" className="w-full" />
            <Skeleton height="h-4" className="w-5/6" />
          </div>
          <Skeleton height="h-6" className="w-20" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton height="h-4" className="w-40" />
          <Skeleton height="h-4" className="w-16" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <SkeletonCard />
        </motion.div>
      ))}
    </div>
  );
}

