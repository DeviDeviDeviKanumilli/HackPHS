'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Module-level flag to prevent double initialization across all instances
let mapInitialized = false;

// Prevent double rendering in React Strict Mode
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center">Loading map...</div>,
});

interface MapViewWrapperProps {
  trades: any[];
  userLocation?: { lat: number; lng: number } | null;
}

export default function MapViewWrapper({ trades, userLocation }: MapViewWrapperProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Prevent double mount from React Strict Mode
    if (mountedRef.current) {
      return;
    }
    
    mountedRef.current = true;
    
    // Small delay to ensure DOM is ready and prevent race conditions
    const timer = setTimeout(() => {
      if (!mapInitialized) {
        mapInitialized = true;
        setShouldRender(true);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      // Reset flag on unmount (but only after a delay to handle Strict Mode)
      setTimeout(() => {
        mapInitialized = false;
        mountedRef.current = false;
      }, 100);
    };
  }, []);

  if (!shouldRender) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return <MapView trades={trades} userLocation={userLocation} />;
}

