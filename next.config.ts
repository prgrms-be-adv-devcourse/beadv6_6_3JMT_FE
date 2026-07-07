import type { NextConfig } from "next";
import { buildDirectRoutingRewrites } from "./lib/directRouting";

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

    // 로컬 직접 라우팅(지금 로컬로 띄운 서비스 하나만) — 반드시 아래 /api/:path* 캐치올보다
    // 먼저 와야 이 규칙이 더 구체적인 경로로 먼저 매칭된다. lib/directRouting.ts 참고.
    rules.push(...buildDirectRoutingRewrites());

    // API Gateway 프록시 — 브라우저 CORS 우회 (위에서 매칭 안 된 나머지 전부)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      rules.push({ source: '/api/:path*', destination: `${apiUrl}/api/:path*` });
    }

    return rules;
  },
};

export default nextConfig;
