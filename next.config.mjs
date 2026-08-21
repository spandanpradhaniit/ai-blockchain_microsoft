/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      "@coinbase/cdp-sdk",
      "@base-org/account",
    ],
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@coinbase/cdp-sdk": false,
      "@base-org/account": false,
      "@x402/evm": false,
      "@x402/core": false,
      "@x402/svm": false,
    };
    return config;
  },
};

export default nextConfig;
