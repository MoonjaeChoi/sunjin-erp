// Generated: 2026-01-25 18:20:00 KST

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  swcMinify: false, // Disable SWC minification to prevent TypeORM circular dependency issues
  staticPageGenerationTimeout: 1200, // Increase timeout for slow builds
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals]),
        'oracledb',
        'typeorm',
        'reflect-metadata',
      ];
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['oracledb', 'typeorm', 'reflect-metadata'],
    isrMemoryCacheSize: 0, // Disable ISR memory caching
  },
};

module.exports = nextConfig;
