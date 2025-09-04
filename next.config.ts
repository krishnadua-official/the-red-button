import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // This block disables ESLint during the build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // This block disables TypeScript errors during the build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
