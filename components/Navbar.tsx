'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white shadow-sm border-b border-plant-green-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold text-plant-green-600">SproutShare</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link
              href="/library"
              className="text-gray-700 hover:text-plant-green-600 transition-colors"
            >
              Plant Library
            </Link>
            <Link
              href="/trades"
              className="text-gray-700 hover:text-plant-green-600 transition-colors"
            >
              Trades
            </Link>
            <Link
              href="/forum"
              className="text-gray-700 hover:text-plant-green-600 transition-colors"
            >
              Forum
            </Link>
            {status === 'loading' ? (
              <div className="text-gray-400">Loading...</div>
            ) : session ? (
              <>
                <Link
                  href={`/profile/${session.user?.id}`}
                  className="text-gray-700 hover:text-plant-green-600 transition-colors"
                >
                  Profile
                </Link>
                <Link
                  href="/messages"
                  className="text-gray-700 hover:text-plant-green-600 transition-colors"
                >
                  Messages
                </Link>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-plant-green-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-plant-green-600 text-white rounded-lg hover:bg-plant-green-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

