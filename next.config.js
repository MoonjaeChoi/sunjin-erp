// Generated: 2026-01-25 18:15:00 KST

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  swcMinify: false, // Disable SWC minification to prevent TypeORM circular dependency issues
  experimental: {
    serverComponentsExternalPackages: ['oracledb', 'typeorm', 'reflect-metadata'],
  },
};

module.exports = nextConfig;
