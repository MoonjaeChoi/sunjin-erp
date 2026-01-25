// Generated: 2026-01-25 18:30:00 KST

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  swcMinify: false, // Disable SWC minification to prevent TypeORM circular dependency issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark TypeORM and related packages as external (don't bundle them)
      config.externals = config.externals || [];
      if (!Array.isArray(config.externals)) {
        config.externals = [config.externals];
      }

      config.externals.push(
        'oracledb',
        'typeorm',
        'reflect-metadata',
        'typeorm/connection',
        'typeorm/decorator',
        'typeorm/decorator/entity',
        'typeorm/entity',
        'typeorm/repository',
        'typeorm/query-builder'
      );
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: [
      'oracledb',
      'typeorm',
      'reflect-metadata',
    ],
  },
};

module.exports = nextConfig;
