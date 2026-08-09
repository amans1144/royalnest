/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@spb/ui', '@spb/components', '@spb/hooks', '@spb/utils', '@spb/types'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'swiper'],
  },
};

export default nextConfig;
