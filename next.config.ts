import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.kakaocdn.net' },
      { protocol: 'http', hostname: '*.kakaocdn.net' },
    ],
  },
  async rewrites() {
    const rules = [];

    // API Gateway 프록시 — 브라우저 CORS 우회
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      rules.push({ source: '/api/:path*', destination: `${apiUrl}/api/:path*` });
    }

    // 정산 서비스 직접 통신 모드: /settlement-proxy/* 를 settlement-service로 프록시 (CORS 회피)
    // NEXT_PUBLIC_SETTLEMENT_DIRECT=true 일 때만 활성화. 대상은 SETTLEMENT_PROXY_TARGET (기본 8080)
    if (process.env.NEXT_PUBLIC_SETTLEMENT_DIRECT === 'true') {
      const target = process.env.SETTLEMENT_PROXY_TARGET || 'http://localhost:8080';
      rules.push({ source: '/settlement-proxy/:path*', destination: `${target}/:path*` });
    }

    // 결제 API 프록시: MSW 우회 + CORS 해결. 게이트웨이(기본 8080)를 통해 결제 서비스로 라우팅.
    if (process.env.NEXT_PUBLIC_PAYMENT_DIRECT === 'true') {
      const target = process.env.PAYMENT_PROXY_TARGET || 'http://localhost:8080';
      rules.push({ source: '/payment-proxy/:path*', destination: `${target}/:path*` });
    }

    return rules;
  },
};

export default nextConfig;
