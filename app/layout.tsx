import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';
import PrefetchInitializer from './components/PrefetchInitializer';
import NavigationLoader from '@/components/NavigationLoader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SproutShare - Plant Swapping Community',
  description: 'Connect with local plant lovers to trade plants, share care tips, and grow community connections.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <Providers>
            <NavigationLoader />
            <Navbar />
            <main className="min-h-screen bg-gradient-to-b from-plant-green-50 to-white dark:from-gray-900 dark:to-gray-800">
              {children}
            </main>
            <PrefetchInitializer />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

// Client component to initialize prefetching
function PrefetchInitializer() {
  if (typeof window !== 'undefined') {
    // Initialize prefetching after component mounts
    import('@/lib/routePrefetch').then(({ initPrefetching }) => {
      initPrefetching();
    });
  }
  return null;
}

