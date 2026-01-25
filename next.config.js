// Generated: 2026-01-25 20:10:00 KST

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /typeorm/ },
      ];
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['oracledb', 'typeorm', 'reflect-metadata'],
  },
};

module.exports = nextConfig;
