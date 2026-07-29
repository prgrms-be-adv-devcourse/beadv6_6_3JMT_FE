# 어드민 정산 전달 관리 대시보드 설계

## 1. 목적

Settlement Service가 User Service로 정산 결과를 전달한 뒤 남기는 `settlement_delivery` 원장을 관리자가 조회하고, 전달에 실패한 건을 안전하게 재전송할 수 있는 프론트 화면을 추가한다.

기존 `/admin/settlements`는 정산 승인·보류·지급 상태를 관리한다. 새 화면은 서비스 간 전달 상태를 관리하므로 같은 정산 도메인 안에 두되 별도 라우트와 테이블로 분리한다.

## 2. 라우팅과 정보 구조

- 정산 내역: `/admin/settlements`
- 전달 관리: `/admin/settlements/deliveries`

`app/admin/settlements/layout.tsx`가 두 화면 위에 `정산 내역`, `전달 관리` 탭을 제공한다. 어드민 사이드바에는 새 메뉴를 추가하지 않고 기존 `정산 관리` 메뉴를 그대로 사용한다. 전달 문제가 있으면 사이드바 정산 뱃지에 `DELIVERY_FAILED + MISMATCH` 건수를 표시한다.

## 3. 화면 구성

### 3.1 요약 카드

다음 네 상태의 전체 건수를 표시한다.

- `CALCULATED`: 전달 대기
- `RECONCILED`: 정상 대사
- `DELIVERY_FAILED`: 전달 실패
- `MISMATCH`: 데이터 불일치

`DELIVERY_FAILED`와 `MISMATCH`는 운영 조치가 필요한 상태로 강조한다. 카드 수치는 현재 페이지 목록을 합산하지 않고 백엔드 요약 응답을 사용한다.

### 3.2 필터와 검색

- 상태 필터: 전체, 조치 필요, 전달 대기, 정상 대사, 전달 실패, 데이터 불일치
- 식별자 검색: `settlementId` 또는 `deliveryRequestId` 완전 일치
- 명시적인 새로고침 버튼

기본 필터는 `조치 필요`다. 검색어는 UUID 형식을 프론트에서 강제하지 않고 백엔드 검증 결과를 오류 메시지로 표시한다.

### 3.3 목록

목록은 페이지당 20건으로 표시하고 기존 `DataPagination`을 사용한다.

| 컬럼 | 내용 |
| --- | --- |
| 상태 | Delivery 상태 뱃지와 재전송 진행 여부 |
| Settlement ID | 전체 UUID를 복사할 수 있는 축약 표시 |
| Delivery Request ID | 전체 UUID를 복사할 수 있는 축약 표시 |
| 시도 횟수 | 누적 `attemptCount` |
| 최초 시도 | `firstAttemptAt` |
| 최근 시도 | `lastAttemptAt` |
| 사유 | `statusReason` 한 줄 요약 |
| 관리 | 백엔드가 허용한 재전송 액션 |

긴 상태 사유와 전체 식별자는 행을 펼쳐 확인한다. 별도 상세 API는 만들지 않고 목록 응답만 사용한다.

### 3.4 재전송

- 액션 노출은 프론트의 상태표가 아니라 응답의 `availableActions`를 사용한다.
- `RETRY`가 있을 때만 재전송 버튼을 표시한다.
- 재전송 전 `ConfirmDialog`에서 Settlement ID와 기존 Delivery Request ID를 보여준다.
- 요청 중에는 같은 행의 버튼을 비활성화한다.
- 백엔드는 중복·동시 요청을 최종 차단하고, 프론트는 `409`를 받으면 목록을 새로고침해 최신 상태를 보여준다.
- `MISMATCH`는 이미 User Service에 데이터가 저장된 상태이므로 조회만 가능하다.
- 재전송이 접수되면 `retryInProgress`를 표시하고, 진행 중인 항목이 있는 동안 3초 간격으로 목록과 요약을 갱신한다.

## 4. 프론트 계약

### 4.1 목록 조회

`GET /api/v2/admin/settlements/deliveries`

Query:

- `status`: 단일 Delivery 상태
- `problemOnly`: `true`면 `DELIVERY_FAILED`, `MISMATCH`만 조회
- `identifier`: Settlement ID 또는 Delivery Request ID
- `page`: 0부터 시작
- `size`: 20

Response item:

```ts
interface AdminSettlementDelivery {
  settlementDeliveryId: string
  settlementId: string
  deliveryRequestId: string
  status: 'CALCULATED' | 'RECONCILED' | 'DELIVERY_FAILED' | 'MISMATCH'
  attemptCount: number
  statusReason: string | null
  firstAttemptAt: string | null
  lastAttemptAt: string | null
  reconciledAt: string | null
  retryInProgress: boolean
  availableActions: Array<'RETRY'>
}
```

페이지 메타데이터는 기존 어드민 목록과 동일한 `page`, `size`, `totalElements` 형식을 사용한다.

### 4.2 요약 조회

`GET /api/v2/admin/settlements/deliveries/summary`

```ts
interface AdminSettlementDeliverySummary {
  calculatedCount: number
  reconciledCount: number
  deliveryFailedCount: number
  mismatchCount: number
  retryInProgressCount: number
}
```

### 4.3 재전송

`POST /api/v2/admin/settlements/deliveries/{settlementDeliveryId}/retry`

- 성공: `202 Accepted`
- 이미 재전송 중이거나 현재 상태에서 허용되지 않음: `409 Conflict`
- 응답 본문은 갱신된 `AdminSettlementDelivery`를 반환한다.
- 기존 `deliveryRequestId`를 그대로 사용한다.

## 5. 컴포넌트와 파일 경계

- `app/admin/settlements/layout.tsx`: 두 정산 화면의 공통 탭
- `app/admin/settlements/_components/AdminSettlementTabs.tsx`: 현재 경로에 따른 활성 탭 표시
- `app/admin/settlements/deliveries/page.tsx`: 전달 관리 화면 조합
- `app/admin/settlements/deliveries/_components/AdminSettlementDeliveriesView.tsx`: 조회·필터·페이지네이션·재전송 상태 관리
- `lib/settlementDeliveryContracts.ts`: API DTO 검증과 화면 모델 변환
- `lib/settlementDeliveries.ts`: 목록·요약·재전송 API 호출
- `lib/adminSettlementDeliveryEvents.ts`: 사이드바 뱃지 갱신 이벤트
- `components/admin/Badge.tsx`: Delivery 상태 표시 규칙
- `app/admin/layout.tsx`: 하위 라우트 메타데이터와 문제 건수 뱃지

기존 `AdminSettlementsView`의 승인·지급 로직은 수정하지 않는다.

## 6. 오류와 빈 상태

- 목록 실패: 기존 항목을 정상 데이터처럼 비우지 않고 오류 문구와 다시 시도 버튼을 표시한다.
- 요약 실패: 카드에 0을 표시하지 않고 `-`와 새로고침 안내를 표시한다.
- 빈 목록: 선택 조건에 맞는 전달 내역이 없다는 전용 빈 상태를 표시한다.
- 재전송 실패: 공통 API 오류 메시지를 표시하고 해당 행과 요약을 다시 조회한다.
- 인증 만료: 기존 Axios 인증 갱신과 어드민 로그인 이동 흐름을 그대로 사용한다.

## 7. 디자인 규칙

- 기존 `SectionCard`, `Table`, `StatusBadge`, `DataPagination`, `ConfirmDialog`를 재사용한다.
- 색상·타이포·간격은 `--ph-*` Tailwind 토큰을 사용한다.
- `DELIVERY_FAILED`와 `MISMATCH`는 error tone, `RECONCILED`는 blue tone, `CALCULATED`는 neutral tone을 사용한다.
- 동적 계산이 아닌 인라인 스타일은 추가하지 않는다.
- 모바일에서는 표를 가로 스크롤하고 필터는 여러 줄로 감싼다.

## 8. 테스트와 완료 조건

- 계약 변환 테스트: 모든 상태, nullable 시각·사유, 페이지 메타데이터
- Query 변환 테스트: 전체·조치 필요·단일 상태·식별자 검색
- 액션 테스트: `availableActions`에 `RETRY`가 있을 때만 재전송 가능
- 재전송 상태 테스트: 진행 중 표시와 중복 클릭 방지
- 오류 상태: 목록·요약·재전송 실패 문구와 다시 시도
- 변경 파일 ESLint 통과
- 계약 단위 테스트 통과
- `npm run build` 통과

프로젝트 전체 `npm run lint`는 현재 `.worktrees/**/.next` 생성물과 기존 React 규칙 위반을 함께 검사해 실패하므로 이번 변경의 완료 조건으로 사용하지 않는다. 새로 변경한 파일은 별도로 ESLint를 실행해 오류 0건을 보장한다.

## 9. 범위 제외

- Kubernetes Job 생성·조회
- Settlement Service 재전송 실행 모드
- 백엔드 조회·요약·재전송 API 구현
- `MISMATCH` 자동 보정
- 전달 이력 감사 로그 화면
