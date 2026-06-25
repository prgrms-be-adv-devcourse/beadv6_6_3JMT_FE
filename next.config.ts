import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.amazonaws.com' }],
  },
  // 정산 서비스 직접 통신 모드: /settlement-proxy/* 를 settlement-service로 프록시 (CORS 회피)
  // NEXT_PUBLIC_SETTLEMENT_DIRECT=true 일 때만 활성화. 대상은 SETTLEMENT_PROXY_TARGET (기본 8080)
  async rewrites() {
    if (process.env.NEXT_PUBLIC_SETTLEMENT_DIRECT !== 'true') return [];
    const target = process.env.SETTLEMENT_PROXY_TARGET || 'http://localhost:8080';
    return [{ source: '/settlement-proxy/:path*', destination: `${target}/:path*` }];
  },
};

export default nextConfig;
