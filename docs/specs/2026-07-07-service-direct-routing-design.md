# 서비스별 로컬 직접 라우팅(Direct Routing) 설계

> **Superseded (2026-07-08)**: 서비스별로 `DIRECT_ROUTING_CONFIGS` 배열을 미리 등록해두는 이 설계는
> 백엔드 라우트 테이블을 FE가 통째로 복제해야 하는 문제로 폐기했다. 대신 `lib/directRouting.ts`는
> `NEXT_PUBLIC_LOCAL_PROXY_PATHS`/`NEXT_PUBLIC_LOCAL_PROXY_TARGET` 단일 슬롯 방식으로 단순화됐다 —
> 지금 로컬로 띄운 서비스 하나의 경로 목록/대상만 개인 `.env.local`에 적으면 된다. 아래 내용은
> "왜 Eureka 자체 등록 방식이 아닌가" 같은 배경 설명은 여전히 유효하지만, 구체적인 설계(공용 배열)는
> 더 이상 실제 코드와 맞지 않는다.

## 배경 / 목적

FE는 기본적으로 로컬(`localhost:3000`)에서 AWS에 배포된 API Gateway(`NEXT_PUBLIC_API_URL`)를 바라보며 개발한다. mock data 없이 실제 AWS 백엔드 + DB를 공통으로 사용하는 것이 기본 워크플로우다.

다만 특정 서비스(예: product-service)의 백엔드 코드를 수정 중일 때는, "그 서비스만 로컬로 띄우고 나머지 서비스(+config/discovery/apigateway)는 AWS에 배포된 걸 그대로 쓰는" 하이브리드 테스트가 필요하다. 매번 5개 서비스 전체를 로컬에 띄우지 않고도, 로컬 프론트 + 로컬 서비스 1개 + 원격 나머지 조합으로 실제 플로우를 확인하기 위함이다.

## 왜 Eureka 자체 등록 방식이 아닌가

AWS 인프라(`docker-compose.yml`)를 확인한 결과:
- 외부에 노출된 포트는 `apigateway`(host 80 → 컨테이너 8000, 보안그룹 오픈)뿐이다.
- `user-service`, `product-service` 등 나머지 서비스는 `127.0.0.1:포트`로 EC2 로컬호스트에만 바인딩되거나, gRPC 포트(9081/9082 등)는 아예 호스트에 노출되지 않고 Docker 내부 브리지 네트워크(`prompthub`)에서만 통신한다.
- 즉 AWS → 개발자 로컬 PC로 역방향 접속할 경로가 없다. 로�컬 product-service를 AWS Eureka에 직접 등록해 AWS 게이트웨이가 그걸 호출하게 만드는 방식은 불가능하다(터널/VPN을 새로 구축하지 않는 한).
- 설령 가능하더라도, 같은 서비스명으로 AWS 인스턴스와 함께 등록되면 Eureka가 요청을 랜덤 분산해 "내 로컬 코드가 아니라 AWS 인스턴스가 응답"하는 비결정적 상황이 생기고, 공유 dev 백엔드를 쓰는 다른 팀원 요청도 영향을 받는다.

따라서 방향을 뒤집어 **FE(브라우저/Next.js dev server)가 서비스별로 요청 목적지를 나눠 보내는 방식**을 택한다. 개발자의 로컬 PC는 AWS도, 자기 자신(localhost)도 문제없이 호출할 수 있기 때문에 새 인프라가 필요 없다.

## 설계

### 1. 공용 라우팅 설정 — `lib/directRouting.ts` (신규)

서비스별 "env 플래그 이름 + 대상 경로 prefix"를 한 곳에 정의해서, `next.config.ts`(rewrite 생성)와 `lib/auth.ts`(헤더 주입 판단) 양쪽이 같은 소스를 참조한다. 경로 목록이 두 곳에서 따로 관리되어 어긋나는 걸 방지한다.

경로 prefix는 apigateway의 실제 라우트 predicate(`apigateway/src/main/resources/application.yaml`)를 그대로 미러링한다. **배열 순서가 중요** — 더 구체적인 경로가 먼저 오고, user-service의 `/api/v1/admin/**` 같은 catch-all은 맨 마지막에 온다(게이트웨이의 라우트 선언 순서와 동일한 원칙).

```ts
export interface DirectRoutingConfig {
  service: 'user' | 'product' | 'order' | 'payment' | 'settlement';
  enableEnvVar: string;   // 예: 'NEXT_PUBLIC_PRODUCT_DIRECT'
  targetEnvVar: string;   // 예: 'PRODUCT_PROXY_TARGET'
  defaultTarget: string;  // 예: 'http://localhost:8082'
  pathPrefixes: string[]; // 구체적인 것 → 포괄적인 것 순서
}

export const DIRECT_ROUTING_CONFIGS: DirectRoutingConfig[] = [
  {
    service: 'settlement',
    enableEnvVar: 'NEXT_PUBLIC_SETTLEMENT_DIRECT',
    targetEnvVar: 'SETTLEMENT_PROXY_TARGET',
    defaultTarget: 'http://localhost:8085',
    pathPrefixes: ['/api/v1/sellers/me/settlements', '/api/v1/admin/settlements'],
  },
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
    service: 'payment',
    enableEnvVar: 'NEXT_PUBLIC_PAYMENT_DIRECT',
    targetEnvVar: 'PAYMENT_PROXY_TARGET',
    defaultTarget: 'http://localhost:8084',
    pathPrefixes: ['/api/v1/payments'],
  },
  {
    service: 'user',
    enableEnvVar: 'NEXT_PUBLIC_USER_DIRECT',
    targetEnvVar: 'USER_PROXY_TARGET',
    defaultTarget: 'http://localhost:8081',
    pathPrefixes: [
      '/api/v1/auth', '/api/v1/users', '/api/v1/seller',
      '/api/v1/sellers', '/api/v1/wishlists', '/api/v1/admin', // catch-all, 반드시 마지막
    ],
  },
];
```

기존 `NEXT_PUBLIC_SETTLEMENT_DIRECT`/`SETTLEMENT_PROXY_TARGET`, `NEXT_PUBLIC_PAYMENT_DIRECT`/`PAYMENT_PROXY_TARGET`는 이미 존재하므로 이름을 그대로 유지하고 이 설정 파일로 옮겨온다(중복 제거).

### 2. `next.config.ts` — rewrite 규칙을 설정에서 동적으로 생성

```ts
async rewrites() {
  const rules = [];

  for (const cfg of DIRECT_ROUTING_CONFIGS) {
    if (process.env[cfg.enableEnvVar] === 'true') {
      const target = process.env[cfg.targetEnvVar] || cfg.defaultTarget;
      for (const prefix of cfg.pathPrefixes) {
        rules.push({ source: `${prefix}/:path*`, destination: `${target}${prefix}/:path*` });
        rules.push({ source: prefix, destination: `${target}${prefix}` }); // path 파라미터 없는 정확한 경로
      }
    }
  }

  // 기본 게이트웨이 프록시 — 위에서 매칭 안 된 나머지 전부
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    rules.push({ source: '/api/:path*', destination: `${apiUrl}/api/:path*` });
  }

  return rules;
}
```

플래그가 꺼진 서비스는 규칙 자체가 생성되지 않으므로, 그 서비스의 경로는 자연히 마지막의 기본 게이트웨이 규칙(`/api/:path*` → AWS)으로 빠진다.

### 3. 헤더 주입 — `lib/auth.ts` axios 인터셉터 확장

게이트웨이를 거치지 않으므로, JWT를 검증해 `X-User-Id`/`X-User-Role`을 넣어주는 단계가 사라진다. 이미 로그인 시 `useAuthStore`에 있는 실제 유저 정보를 그대로 실어 보낸다.

```ts
import { DIRECT_ROUTING_CONFIGS } from '@/lib/directRouting';

function isDirectRoutedUrl(url?: string): boolean {
  if (!url || process.env.NODE_ENV === 'production') return false; // 프로덕션 이중 안전장치
  return DIRECT_ROUTING_CONFIGS.some((cfg) =>
    process.env[cfg.enableEnvVar] === 'true' &&
    cfg.pathPrefixes.some((p) => url === p || url.startsWith(`${p}/`) || url.startsWith(`${p}?`))
  );
}

// api.interceptors.request.use 내부, 기존 Authorization 헤더 설정 다음에 추가
if (isDirectRoutedUrl(config.url)) {
  const { user } = useAuthStore.getState();
  if (user) {
    config.headers['X-User-Id'] = user.id;
    config.headers['X-User-Role'] = user.roles[0]?.toUpperCase();
  }
}
```

**안전장치**: `NODE_ENV !== 'production'`이 아니면 무조건 비활성화. Vercel 프로덕션 배포 env에 실수로 `NEXT_PUBLIC_X_DIRECT=true`가 남아있어도 프로덕션 빌드에서는 항상 무시되고 정상적으로 AWS 게이트웨이 경로를 탄다.

### 4. `.env.local` 사용 예시

```
# product-service만 로컬로 테스트
NEXT_PUBLIC_PRODUCT_DIRECT=true
PRODUCT_PROXY_TARGET=http://localhost:8082
# 나머지는 그대로 AWS
NEXT_PUBLIC_API_URL=https://<aws-dev-gateway>
```

## 스코프 경계 (이번 작업에 포함하지 않음)

- **gRPC 의존성**: product-service의 판매자 정보 조회(`SellerClient`)는 이미 `StubSellerClient`(`@Profile({"default","test"})`)가 있어 gRPC 없이도 동작한다(고정값 "테스트판매자"). 실제 값이 필요하면 SSH 터널(EC2 gRPC 포트를 `127.0.0.1`에 바인딩 + SSH 접근)로 AWS gRPC를 직접 호출하는 것도 가능하나, 이는 인프라 담당자와 별도로 조율할 BE/인프라 작업이며 이 스펙의 실행 항목에는 포함하지 않는다. user-service/order-service/settlement-service가 로컬 단독 실행 시 자신의 gRPC 의존성(product-service 호출 등)에 대해 동일한 stub/fallback을 갖고 있는지는 서비스별로 별도 확인이 필요하다(현재 order-service는 `ProductRestClientAdapter`/`SellerRestFallbackClient` fallback을 보유한 것으로 확인, user-service/settlement-service는 미확인).
- **Kafka**: 컨슈머 그룹 리밸런싱 특성상 로컬 인스턴스와 AWS 인스턴스가 안전하게 이벤트를 나눠 처리할 방법이 없다. 로컬 테스트 시 Kafka 발행/구독에 의존하는 동작(예: product-service가 발행하는 `product.created`/`product.updated` 이벤트를 user-service가 구독해 반영하는 흐름)은 검증되지 않는다는 걸 알려진 제약으로 받아들인다.
- **mock 인프라(`mocks/`, `NEXT_PUBLIC_API_MOCKING`, `MockProvider.tsx`) 전체 제거**: 이 direct-routing이 자리 잡아 실제로 검증되면 자연히 불필요해지지만, 파일 수가 많고 다른 기능이 여전히 mock에 의존하고 있는지 검증이 필요해 별도 후속 이슈로 분리한다.

## 검증 계획

1. `NEXT_PUBLIC_PRODUCT_DIRECT=true`로 로컬 product-service(기본 프로파일, Stub 판매자) + `npm run dev` 실행
2. 브라우저에서 상품 목록/상세(`/browse`, `/detail/[id]`) — product-service 공개 API가 로컬로 정상 응답하는지 확인
3. 실제 AWS 계정으로 로그인 후 판매자 상품 등록(`/sell`) — `X-User-Id`/`X-User-Role` 헤더가 로컬 product-service에 제대로 전달되는지, 등록이 성공하는지 확인
4. 나머지 화면(마이페이지, 주문, 정산 등 product-service 무관 경로)이 여전히 AWS로 정상 흘러가는지 확인
5. `NEXT_PUBLIC_PRODUCT_DIRECT=false`(또는 미설정) 상태에서 기존처럼 전부 AWS로 나가는지 회귀 확인
6. 프로덕션 빌드(`NODE_ENV=production`)에서 direct-routing env가 설정되어 있어도 무시되는지 확인
