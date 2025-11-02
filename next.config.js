/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // Set the root directory to silence lockfile warnings
  outputFileTracingRoot: path.join(__dirname),
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Optimize production builds
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons'],
  },
  // Enable compression for API routes
  compress: true,
}

module.exports = nextConfig

