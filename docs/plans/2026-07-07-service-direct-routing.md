# 서비스별 로컬 직접 라우팅 (Direct Routing) Implementation Plan

> **Superseded (2026-07-08)**: 이 플랜의 `DIRECT_ROUTING_CONFIGS`(서비스별 하드코딩 배열) 설계는
> 폐기됐다. `lib/directRouting.ts`는 `NEXT_PUBLIC_LOCAL_PROXY_PATHS`/`NEXT_PUBLIC_LOCAL_PROXY_TARGET`
> 단일 env 슬롯 방식으로 재구현됐다 — 자세한 배경은 `docs/specs/2026-07-07-service-direct-routing-design.md`의
> superseded 안내 참고.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** order-service/product-service/user-service 요청 경로별로, env 플래그가 켜져 있으면 로컬 백엔드(localhost)로, 꺼져 있으면(기본값) AWS 배포 게이트웨이로 보내도록 Next.js rewrite와 인증 헤더 주입을 확장한다.

**Architecture:** `next.config.ts`의 `rewrites()`가 서비스별 경로 prefix를 로컬 대상으로 재작성하는 규칙을 동적으로 생성하고(같은 `/api/v1/...` 경로를 그대로 쓰되 목적지만 바뀜), `lib/auth.ts`의 axios 요청 인터셉터가 이 우회 대상 요청에 한해 게이트웨이가 하던 `X-User-Id`/`X-User-Role` 주입을 실제 로그인 유저 정보로 대신 수행한다. 새 로직은 모두 `lib/directRouting.ts`라는 단일 설정 파일에서 나온다.

**Tech Stack:** Next.js 16 (`next.config.ts` rewrites), axios 인터셉터, zustand(`useAuthStore`), `node:test`/`node:assert/strict` (기존 `lib/hybridApi.test.ts`, `lib/orderAdapters.test.ts`와 동일한 테스트 컨벤션).

## Global Constraints

- 대상 저장소: `C:/programmers_prj/beadv6_6_3JMT_FE` (BE 저장소인 `beadv6_6_3JMT_BE`와는 별개 git 저장소).
- **git add/commit 금지**: 이 저장소는 사용자가 명시적으로 요청하기 전까지 커밋하지 않는다. 아래 각 태스크의 "커밋" 스텝은 실행하지 않고 파일 저장까지만 한다. (표준 writing-plans 템플릿엔 커밋 스텝이 있지만 이 저장소 정책상 생략한다.)
- **프로덕션 안전장치**: `process.env.NODE_ENV === 'production'`이면 direct-routing 관련 로직(헤더 주입) 전체가 무조건 비활성화되어야 한다. env 플래그가 실수로 켜져 있어도 무시한다.
- **기존 `settlement-proxy`/`payment-proxy` 메커니즘은 건드리지 않는다.** 그건 전용 axios 인스턴스(`baseURL: '/settlement-proxy'`) + 고정 테스트 유저 ID 환경변수 방식이고, 이번에 추가하는 order/product/user 3개는 "같은 `/api/v1/...` 경로를 그대로 쓰고 rewrite destination만 바꾸는" 다른 방식이다. 두 메커니즘은 서로 다른 URL 네임스페이스(`/settlement-proxy/*` vs `/api/v1/*`)를 쓰므로 충돌하지 않는다.
- **경로 겹침 순서 고정**: `DIRECT_ROUTING_CONFIGS` 배열 순서는 반드시 `order → product → user`. user-service가 `/api/v1/sellers`, `/api/v1/admin` 같은 넓은 catch-all 경로를 갖고 있어서, order/product의 더 구체적인 경로(`/api/v1/admin/orders`, `/api/v1/admin/products`, `/api/v1/sellers/me/products`)가 먼저 매칭되어야 한다. 이는 실제 `apigateway/src/main/resources/application.yaml`의 라우트 선언 순서(order-service → product-service → ... → user-service)와 동일한 원칙이다.
- **로컬 기본 포트**: user-service 8081, product-service 8082, order-service 8083 (각 서비스 `application.yml`의 `server.port` 기준).
- **테스트 실행 명령**: 이 프로젝트는 `npm test` 스크립트가 없다. 기존 테스트(`lib/hybridApi.test.ts`, `lib/orderAdapters.test.ts`)와 동일하게 `node --experimental-strip-types --test <파일경로>`로 직접 실행한다.

---

### Task 1: `lib/directRouting.ts` — 설정 + 순수 로직 + 단위 테스트

**Files:**
- Create: `lib/directRouting.ts`
- Test: `lib/directRouting.test.ts`

**Interfaces:**
- Produces:
  - `export interface DirectRoutingConfig { service: 'order' | 'product' | 'user'; enableEnvVar: string; targetEnvVar: string; defaultTarget: string; pathPrefixes: string[]; }`
  - `export const DIRECT_ROUTING_CONFIGS: DirectRoutingConfig[]`
  - `export function buildDirectRoutingRewrites(): { source: string; destination: string }[]`
  - `export function isDirectRoutedUrl(url?: string): boolean`
  - `export function directRoutingHeaders(url: string | undefined, user: { id: string; roles: string[] } | null | undefined): Record<string, string> | null`
- Consumes: 없음 (외부 의존성은 `process.env`만).

- [ ] **Step 1: 실패하는 테스트부터 작성**

`lib/directRouting.test.ts` 파일을 아래 내용으로 새로 만든다.

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DIRECT_ROUTING_CONFIGS,
  buildDirectRoutingRewrites,
  directRoutingHeaders,
  isDirectRoutedUrl,
} from './directRouting.ts'

const ENV_KEYS = DIRECT_ROUTING_CONFIGS.flatMap((c) => [c.enableEnvVar, c.targetEnvVar])

function resetEnv() {
  for (const key of ENV_KEYS) delete process.env[key]
  delete process.env.NODE_ENV
}

test('buildDirectRoutingRewrites returns nothing when no flags are set', () => {
  resetEnv()
  assert.deepEqual(buildDirectRoutingRewrites(), [])
})

test('buildDirectRoutingRewrites builds a rewrite per path prefix for an enabled service', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  const rules = buildDirectRoutingRewrites()
  assert.deepEqual(rules, [
    { source: '/api/v1/products/:path*', destination: 'http://localhost:8082/api/v1/products/:path*' },
    { source: '/api/v1/sellers/me/products/:path*', destination: 'http://localhost:8082/api/v1/sellers/me/products/:path*' },
    { source: '/api/v1/admin/products/:path*', destination: 'http://localhost:8082/api/v1/admin/products/:path*' },
  ])
  resetEnv()
})

test('buildDirectRoutingRewrites honors a custom proxy target', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_ORDER_DIRECT = 'true'
  process.env.ORDER_PROXY_TARGET = 'http://localhost:9999'
  const rules = buildDirectRoutingRewrites()
  assert.equal(rules[0].destination, 'http://localhost:9999/api/v1/orders/:path*')
  resetEnv()
})

test('buildDirectRoutingRewrites keeps order before product before user when several are enabled', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_USER_DIRECT = 'true'
  process.env.NEXT_PUBLIC_ORDER_DIRECT = 'true'
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  const rules = buildDirectRoutingRewrites()
  const firstOrderIdx = rules.findIndex((r) => r.source.startsWith('/api/v1/orders'))
  const firstProductIdx = rules.findIndex((r) => r.source.startsWith('/api/v1/products'))
  const firstUserIdx = rules.findIndex((r) => r.source.startsWith('/api/v1/auth'))
  assert.ok(firstOrderIdx < firstUserIdx)
  assert.ok(firstProductIdx < firstUserIdx)
  resetEnv()
})

test('isDirectRoutedUrl is false when the matching service flag is off', () => {
  resetEnv()
  assert.equal(isDirectRoutedUrl('/api/v1/products/123'), false)
})

test('isDirectRoutedUrl is true for an enabled service, exact and nested paths', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  assert.equal(isDirectRoutedUrl('/api/v1/products'), true)
  assert.equal(isDirectRoutedUrl('/api/v1/products/123/related?limit=4'), true)
  assert.equal(isDirectRoutedUrl('/api/v1/admin/products/123/approve'), true)
  resetEnv()
})

test('isDirectRoutedUrl does not match an unrelated path even when a flag is on', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  assert.equal(isDirectRoutedUrl('/api/v1/orders'), false)
  resetEnv()
})

test('isDirectRoutedUrl is always false in production regardless of flags', () => {
  resetEnv()
  process.env.NODE_ENV = 'production'
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  assert.equal(isDirectRoutedUrl('/api/v1/products/123'), false)
  resetEnv()
})

test('directRoutingHeaders returns null when the url is not direct-routed', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  assert.equal(directRoutingHeaders('/api/v1/orders', { id: 'u-1', roles: ['seller'] }), null)
  resetEnv()
})

test('directRoutingHeaders returns null when there is no logged-in user', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  assert.equal(directRoutingHeaders('/api/v1/admin/products/1/approve', null), null)
  resetEnv()
})

test('directRoutingHeaders injects the real user id and uppercased role', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  assert.deepEqual(
    directRoutingHeaders('/api/v1/sellers/me/products', { id: 'u-1', roles: ['seller'] }),
    { 'X-User-Id': 'u-1', 'X-User-Role': 'SELLER' },
  )
  resetEnv()
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd C:/programmers_prj/beadv6_6_3JMT_FE && node --experimental-strip-types --test lib/directRouting.test.ts`
Expected: FAIL — `Cannot find module './directRouting.ts'` (파일이 아직 없음)

- [ ] **Step 3: `lib/directRouting.ts` 구현**

```ts
export type DirectRoutingService = 'order' | 'product' | 'user'

export interface DirectRoutingConfig {
  service: DirectRoutingService
  enableEnvVar: string
  targetEnvVar: string
  defaultTarget: string
  pathPrefixes: string[]
}

// 순서 고정: apigateway(application.yaml)의 라우트 선언 순서(order → product → ... → user)와 동일하게
// order → product → user. user-service는 /api/v1/sellers, /api/v1/admin 같은 넓은 경로를 갖고 있어서
// 반드시 마지막에 와야 product/order의 더 구체적인 경로가 먼저 매칭된다.
export const DIRECT_ROUTING_CONFIGS: DirectRoutingConfig[] = [
  {
    service: 'order',
    enableEnvVar: 'NEXT_PUBLIC_ORDER_DIRECT',
    targetEnvVar: 'ORDER_PROXY_TARGET',
    defaultTarget: 'http://localhost:8083',
    pathPrefixes: ['/api/v1/orders', '/api/v1/cart', '/api/v1/admin/orders'],
  },
  {
    service: 'product',
    enableEnvVar: 'NEXT_PUBLIC_PRODUCT_DIRECT',
    targetEnvVar: 'PRODUCT_PROXY_TARGET',
    defaultTarget: 'http://localhost:8082',
    pathPrefixes: ['/api/v1/products', '/api/v1/sellers/me/products', '/api/v1/admin/products'],
  },
  {
    service: 'user',
    enableEnvVar: 'NEXT_PUBLIC_USER_DIRECT',
    targetEnvVar: 'USER_PROXY_TARGET',
    defaultTarget: 'http://localhost:8081',
    pathPrefixes: [
      '/api/v1/auth',
      '/api/v1/users',
      '/api/v1/seller',
      '/api/v1/sellers',
      '/api/v1/wishlists',
      '/api/v1/admin',
    ],
  },
]

function isEnabled(cfg: DirectRoutingConfig): boolean {
  return process.env[cfg.enableEnvVar] === 'true'
}

function targetFor(cfg: DirectRoutingConfig): string {
  return process.env[cfg.targetEnvVar] || cfg.defaultTarget
}

export function buildDirectRoutingRewrites(): { source: string; destination: string }[] {
  const rules: { source: string; destination: string }[] = []
  for (const cfg of DIRECT_ROUTING_CONFIGS) {
    if (!isEnabled(cfg)) continue
    const target = targetFor(cfg)
    for (const prefix of cfg.pathPrefixes) {
      rules.push({ source: `${prefix}/:path*`, destination: `${target}${prefix}/:path*` })
    }
  }
  return rules
}

export function isDirectRoutedUrl(url?: string): boolean {
  if (!url || process.env.NODE_ENV === 'production') return false
  const path = url.split('?')[0]
  return DIRECT_ROUTING_CONFIGS.some(
    (cfg) => isEnabled(cfg) && cfg.pathPrefixes.some((p) => path === p || path.startsWith(`${p}/`)),
  )
}

export function directRoutingHeaders(
  url: string | undefined,
  user: { id: string; roles: string[] } | null | undefined,
): Record<string, string> | null {
  if (!user || !isDirectRoutedUrl(url)) return null
  const role = user.roles[0]
  return {
    'X-User-Id': user.id,
    'X-User-Role': role ? role.toUpperCase() : '',
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd C:/programmers_prj/beadv6_6_3JMT_FE && node --experimental-strip-types --test lib/directRouting.test.ts`
Expected: `# pass 11`, `# fail 0` (테스트 11개 전부 통과)

- [ ] **Step 5: 파일 저장 확인만 하고 커밋은 하지 않는다** (Global Constraints 참고 — git add/commit 생략)

---

### Task 2: `next.config.ts` — direct-routing rewrite 규칙 연결

**Files:**
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: `buildDirectRoutingRewrites(): { source: string; destination: string }[]` (Task 1에서 생성)
- Produces: 없음 (최종 산출물, 다음 태스크가 이 파일을 소비하지 않음)

- [ ] **Step 1: 현재 파일 확인**

Run: `cd C:/programmers_prj/beadv6_6_3JMT_FE && cat next.config.ts`
Expected 내용(수정 전):

```ts
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
```

- [ ] **Step 2: 아래 전체 내용으로 교체**

```ts
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

    // 서비스별 로컬 직접 라우팅(order/product/user) — 반드시 아래 /api/:path* 캐치올보다 먼저 와야
    // 이 규칙들이 더 구체적인 경로로 먼저 매칭된다. lib/directRouting.ts 참고.
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
```

- [ ] **Step 3: 설정 파일이 에러 없이 로드되는지 확인**

Run: `cd C:/programmers_prj/beadv6_6_3JMT_FE && npx next build --no-lint 2>&1 | head -40`
Expected: `next.config.ts`/`lib/directRouting.ts` 관련 모듈 로드 에러 없이 빌드 진행 (다른 사전 존재 타입 에러가 없다면 `Compiled successfully` 계열 로그까지 도달). `Cannot find module './lib/directRouting'` 같은 에러가 나오면 import 경로를 점검한다.

- [ ] **Step 4: `NEXT_PUBLIC_PRODUCT_DIRECT=true`로 rewrite가 실제 반영되는지 확인**

터미널 1 (dev 서버를 별도 창/탭에서 실행 — 백그라운드 처리 없이 그냥 포그라운드로 띄워둔다):
```powershell
cd C:/programmers_prj/beadv6_6_3JMT_FE
$env:NEXT_PUBLIC_PRODUCT_DIRECT = "true"
npx next dev --webpack
```

터미널 2 (dev 서버가 "Ready" 로그를 찍은 뒤 실행):
```powershell
curl.exe -s -o NUL -w "%{http_code}`n" http://localhost:3000/api/v1/products
```
Expected: product-service(8082)가 로컬에 안 떠 있는 상태이므로 `502`(Bad Gateway, Next.js가 destination에 연결 실패) 또는 연결 거부 관련 상태 코드가 나오면 **rewrite 자체는 정상 작동 중**인 것으로 판단한다(= AWS로 안 가고 localhost:8082로 시도했다는 뜻). 확인 후 터미널 1을 Ctrl+C로 종료한다.

- [ ] **Step 5: 파일 저장 확인만 하고 커밋은 하지 않는다**

---

### Task 3: `lib/auth.ts` — direct-routing 헤더 주입 연결

**Files:**
- Modify: `lib/auth.ts`

**Interfaces:**
- Consumes: `directRoutingHeaders(url, user): Record<string,string> | null` (Task 1)

- [ ] **Step 1: 현재 인터셉터 부분 확인**

Run: `cd C:/programmers_prj/beadv6_6_3JMT_FE && sed -n '1,20p' lib/auth.ts` (또는 Read 툴로 1~20줄 확인)
Expected 내용(수정 전):

```ts
import axios from 'axios'
import { attachHybridGatewayHeaders, isApiMockingEnabled } from '@/lib/hybridApi'
import { useAuthStore } from '@/store/useAuthStore'

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use((config) => {
  const { token, user } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  attachHybridGatewayHeaders(config, token, user?.roles?.find(r => r === 'admin') ?? user?.roles?.[0])
  return config
})
```

- [ ] **Step 2: import와 인터셉터에 direct-routing 헤더 주입 추가**

`import { useAuthStore } from '@/store/useAuthStore'` 줄 바로 위에 아래 줄을 추가한다.

```ts
import { directRoutingHeaders } from '@/lib/directRouting'
```

`attachHybridGatewayHeaders(...)` 호출 바로 다음, `return config` 바로 전에 아래를 추가한다.

```ts
  const directHeaders = directRoutingHeaders(config.url, user ?? null)
  if (directHeaders) {
    Object.assign(config.headers, directHeaders)
  }
```

수정 후 인터셉터 전체 모습:

```ts
api.interceptors.request.use((config) => {
  const { token, user } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  attachHybridGatewayHeaders(config, token, user?.roles?.find(r => r === 'admin') ?? user?.roles?.[0])
  const directHeaders = directRoutingHeaders(config.url, user ?? null)
  if (directHeaders) {
    Object.assign(config.headers, directHeaders)
  }
  return config
})
```

- [ ] **Step 3: 타입체크로 회귀 확인**

Run: `cd C:/programmers_prj/beadv6_6_3JMT_FE && npx tsc --noEmit`
Expected: 에러 0건 (기존과 동일하게 클린)

- [ ] **Step 4: 수동 통합 확인 (product-service 로컬 실행 필요)**

이 단계는 로컬 product-service가 실제로 떠 있어야 의미가 있다. product-service 팀원/본인이 로컬에서 `default` 프로파일(스텁 판매자)로 8082 포트에 띄운 뒤:

```powershell
cd C:/programmers_prj/beadv6_6_3JMT_FE
$env:NEXT_PUBLIC_PRODUCT_DIRECT = "true"
npx next dev --webpack
```

브라우저에서 `http://localhost:3000/browse` 접속 → 상품 목록이 로컬 product-service(8082)에서 응답하는지 브라우저 개발자도구 Network 탭에서 요청/응답 확인. 이어서 실제 AWS 계정으로 로그인 후 `/sell`에서 상품 등록 시도 → Network 탭에서 해당 POST 요청에 `X-User-Id`/`X-User-Role` 헤더가 실제 로그인 유저 값으로 실려 있는지, 로컬 product-service가 200/201로 응답하는지 확인.

- [ ] **Step 5: 파일 저장 확인만 하고 커밋은 하지 않는다**

---

### Task 4: 문서화 + 전체 회귀/안전장치 검증

**Files:**
- Modify: `.env.local` (예시 주석 추가 — 실제 값은 켜지 않은 채로 둔다)

**Interfaces:** 없음 (마무리 태스크)

- [ ] **Step 1: `.env.local`에 사용법 주석 추가**

현재 `.env.local` 끝에 아래 블록을 추가한다 (기존 `NEXT_PUBLIC_API_URL=http://localhost:8000` 등은 그대로 둔다).

```
# 서비스별 로컬 직접 라우팅 (기본 꺼짐 — 필요한 서비스만 개별로 켠다)
# 예: product-service만 로컬로 테스트하고 싶을 때
# NEXT_PUBLIC_PRODUCT_DIRECT=true
# PRODUCT_PROXY_TARGET=http://localhost:8082
# NEXT_PUBLIC_ORDER_DIRECT=true
# ORDER_PROXY_TARGET=http://localhost:8083
# NEXT_PUBLIC_USER_DIRECT=true
# USER_PROXY_TARGET=http://localhost:8081
```

- [ ] **Step 2: 플래그 전부 꺼진 기본 상태 회귀 확인**

Run (PowerShell, 위에서 추가한 예시 줄은 주석 상태 유지 = 전부 꺼짐):
```powershell
cd C:/programmers_prj/beadv6_6_3JMT_FE
node --experimental-strip-types --test lib/directRouting.test.ts lib/hybridApi.test.ts lib/orderAdapters.test.ts
```
Expected: 세 파일 전부 `# fail 0` (새 기능이 기존 hybridApi/orderAdapters 테스트에 영향 없음 확인)

- [ ] **Step 3: 프로덕션 빌드에서 무시되는지 확인**

Run (PowerShell):
```powershell
cd C:/programmers_prj/beadv6_6_3JMT_FE
$env:NODE_ENV = "production"
$env:NEXT_PUBLIC_PRODUCT_DIRECT = "true"
node --experimental-strip-types -e "import('./lib/directRouting.ts').then(m => console.log(m.isDirectRoutedUrl('/api/v1/products/1')))"
```
Expected: `false` 출력 (NODE_ENV=production이면 플래그가 켜져 있어도 무시됨). 확인 후 `$env:NODE_ENV`와 `$env:NEXT_PUBLIC_PRODUCT_DIRECT`를 제거한다(`Remove-Item Env:NODE_ENV`, `Remove-Item Env:NEXT_PUBLIC_PRODUCT_DIRECT`).

- [ ] **Step 4: 전체 회귀 — 플래그 없이 기존처럼 AWS로만 나가는지 최종 확인**

```powershell
cd C:/programmers_prj/beadv6_6_3JMT_FE
npx next dev --webpack
```
브라우저에서 `/browse`, `/mypage`, `/shop` 등 여러 화면을 열어 평소처럼(AWS 게이트웨이 대상) 정상 동작하는지 확인. 이상 없으면 완료.

- [ ] **Step 5: 파일 저장 확인만 하고 커밋은 하지 않는다** — 커밋은 사용자가 명시적으로 요청할 때 별도로 진행한다.

---

## 이번 계획에 포함하지 않은 것 (스펙의 스코프 경계 그대로)

- gRPC SSH 터널(인프라 담당자 협조 필요, 이 저장소 밖의 작업)
- Kafka 로컬 테스트(컨슈머 그룹 리밸런싱 문제로 불가능, 알려진 제약으로만 기록)
- `mocks/`, `NEXT_PUBLIC_API_MOCKING`, `MockProvider.tsx` 등 mock 인프라 전체 제거(이번 기능이 검증된 뒤 별도 이슈)
- settlement-service/payment-service의 기존 `-proxy` 방식을 이번 `directRouting.ts` 패턴으로 통합하는 것(동작 중인 코드라 이번 스코프에서 건드리지 않음)
