import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Exclude test files and problematic modules
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /node_modules\/thread-stream\/(test|README)/,
      use: 'null-loader',
    });

    return config;
  },
  transpilePackages: ['wagmi', 'viem', '@wagmi/core', '@wagmi/connectors'],
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
