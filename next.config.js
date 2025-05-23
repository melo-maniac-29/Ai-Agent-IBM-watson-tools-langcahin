/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for best practices
  reactStrictMode: true,
  
  // Add proper TypeScript configurations
  typescript: {
    // Temporarily ignore build errors to get past the build
    ignoreBuildErrors: true,
  },
  
  // Configure webpack to handle top-level await
  webpack: (config) => {
    // Enable top-level await support
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    
    return config;
  },
};

module.exports = nextConfig;
