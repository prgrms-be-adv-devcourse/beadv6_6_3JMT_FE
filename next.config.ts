import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.amazonaws.com' }],
  },
  // 정산 서비스 직접 통신 모드: /settlement-proxy/* 를 settlement-service로 프록시 (CORS 회피)
  // NEXT_PUBLIC_SETTLEMENT_DIRECT=true 일 때만 활성화. 대상은 SETTLEMENT_PROXY_TARGET (기본 8080)
  async rewrites() {
    const rules = [];

    // API Gateway 프록시 — 브라우저 CORS 우회
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      rules.push({ source: '/api/:path*', destination: `${apiUrl}/api/:path*` });
    }

    if (process.env.NEXT_PUBLIC_SETTLEMENT_DIRECT === 'true') {
      const target = process.env.SETTLEMENT_PROXY_TARGET || 'http://localhost:8080';
      rules.push({ source: '/settlement-proxy/:path*', destination: `${target}/:path*` });
    }

    return rules;
  },
};

export default nextConfig;
