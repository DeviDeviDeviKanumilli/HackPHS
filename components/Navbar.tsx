'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Settings, Mail } from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Fetch unread message count
  useEffect(() => {
    if (session?.user?.id) {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch('/api/messages/conversations');
          if (response.ok) {
            const data = await response.json();
            const totalUnread = data.conversations?.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0) || 0;
            setUnreadCount(totalUnread);
          }
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };

      fetchUnreadCount();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleSignOut = async () => {
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error) {
      console.error('Sign out error:', error);
      router.push('/');
      router.refresh();
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navLinks = [
    { href: '/library', label: 'Plant Library' },
    { href: '/trades', label: 'Trades' },
    { href: '/forum', label: 'Forum' },
    { href: '/tips', label: 'Tips' },
  ];

  const authNavLinks = [
    { href: '/my-trades', label: 'My Trades' },
  ];

  if (!mounted) {
    return (
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-plant-green-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌿</span>
              <span className="text-xl font-bold text-plant-green-600">SproutShare</span>
            </Link>
            <div className="text-gray-400 text-sm">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  const isLoading = status === 'loading';

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-plant-green-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold text-plant-green-600 dark:text-plant-green-400">SproutShare</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-plant-green-600 dark:text-plant-green-400 bg-plant-green-50 dark:bg-plant-green-900/30'
                    : 'text-gray-700 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {isLoading ? (
              <div className="text-gray-400 text-sm px-3 py-2">Loading...</div>
            ) : session ? (
              <>
                {authNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? 'text-plant-green-600 dark:text-plant-green-400 bg-plant-green-50 dark:bg-plant-green-900/30'
                        : 'text-gray-700 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {session.user?.id && (
                  <Link
                    href={`/profile/${session.user.id}`}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/profile')
                        ? 'text-plant-green-600 dark:text-plant-green-400 bg-plant-green-50 dark:bg-plant-green-900/30'
                        : 'text-gray-700 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    Profile
                  </Link>
                )}
                <Link
                  href="/messages"
                  className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/messages')
                      ? 'text-plant-green-600 dark:text-plant-green-400 bg-plant-green-50 dark:bg-plant-green-900/30'
                      : 'text-gray-700 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  title="Messages"
                >
                  <Mail className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/settings"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/settings')
                      ? 'text-plant-green-600 dark:text-plant-green-400 bg-plant-green-50 dark:bg-plant-green-900/30'
                      : 'text-gray-700 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-plant-green-600 dark:bg-plant-green-700 text-white rounded-lg hover:bg-plant-green-700 dark:hover:bg-plant-green-600 transition-colors text-sm font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/login')
                      ? 'text-plant-green-600 dark:text-plant-green-400 bg-plant-green-50 dark:bg-plant-green-900/30'
                      : 'text-gray-700 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-plant-green-600 dark:bg-plant-green-700 text-white rounded-lg hover:bg-plant-green-700 dark:hover:bg-plant-green-600 transition-colors text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-plant-green-500"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-plant-green-600 dark:text-plant-green-400 bg-plant-green-50 dark:bg-plant-green-900/30'
                      : 'text-gray-700 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {isLoading ? (
                <div className="px-3 py-2 text-gray-400 dark:text-gray-500 text-base">Loading...</div>
              ) : session ? (
                <>
                  {session.user?.id && (
                    <Link
                      href={`/profile/${session.user.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isActive('/profile')
                          ? 'text-plant-green-600 dark:text-plant-green-400 bg-plant-green-50 dark:bg-plant-green-900/30'
                          : 'text-gray-700 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      Profile
                    </Link>
                  )}
                  <Link
                    href="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`relative block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive('/messages')
                        ? 'text-plant-green-600 dark:text-plant-green-400 bg-plant-green-50 dark:bg-plant-green-900/30'
                        : 'text-gray-700 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      <span>Messages</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive('/settings')
                        ? 'text-plant-green-600 dark:text-plant-green-400 bg-plant-green-50 dark:bg-plant-green-900/30'
                        : 'text-gray-700 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-plant-green-600 dark:bg-plant-green-700 text-white hover:bg-plant-green-700 dark:hover:bg-plant-green-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive('/login')
                        ? 'text-plant-green-600 dark:text-plant-green-400 bg-plant-green-50 dark:bg-plant-green-900/30'
                        : 'text-gray-700 dark:text-gray-300 hover:text-plant-green-600 dark:hover:text-plant-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium bg-plant-green-600 dark:bg-plant-green-700 text-white hover:bg-plant-green-700 dark:hover:bg-plant-green-600 transition-colors text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
