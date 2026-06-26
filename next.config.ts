import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.amazonaws.com' }],
  },
  // 정산 서비스 직접 통신 모드: /settlement-proxy/* 를 settlement-service로 프록시 (CORS 회피)
  // NEXT_PUBLIC_SETTLEMENT_DIRECT=true 일 때만 활성화. 대상은 SETTLEMENT_PROXY_TARGET (기본 8080)
  async rewrites() {
    const rules = [];
    if (process.env.NEXT_PUBLIC_SETTLEMENT_DIRECT === 'true') {
      const target = process.env.SETTLEMENT_PROXY_TARGET || 'http://localhost:8080';
      rules.push({ source: '/settlement-proxy/:path*', destination: `${target}/:path*` });
    }
    // 임시: 결제 서비스 직접 통신 프록시 (CORS·MSW 우회)
    if (process.env.NEXT_PUBLIC_PAYMENT_DIRECT === 'true') {
      const target = process.env.PAYMENT_PROXY_TARGET || 'http://localhost:8084';
      rules.push({ source: '/payment-proxy/:path*', destination: `${target}/:path*` });
    }
    return rules;
  },
};

export default nextConfig;
