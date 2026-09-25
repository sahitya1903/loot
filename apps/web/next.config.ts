import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // @loot/shared ships TypeScript source — let Next compile it.
  transpilePackages: ['@loot/shared'],
  allowedDevOrigins: [
    // allow all origins during development for testing purposes
    '10.145.2.167',
  ],
  images: {
    // Allow images from AWS S3 (presigned URLs) and CloudFront CDN
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.s3.*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
}

export default nextConfig
