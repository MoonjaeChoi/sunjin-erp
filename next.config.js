// Generated: 2026-01-24 21:10:00 KST

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['oracledb', 'typeorm', 'reflect-metadata'],
  },
};

module.exports = nextConfig;
