# Admin Settlement Filter Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 정산 필터가 요약 카드 버킷이 아니라 7개 실제 주간 정산 상태 건수를 표시하게 한다.

**Architecture:** 상단 카드용 `/admin/settlements/summary` 호출은 유지하고, 필터 건수용 `/admin/settlements/weeks` 호출을 추가한다. 주간 응답의 `statusCounts` 변환과 필터별 합산은 순수 함수로 두고, 클라이언트 화면은 별도 상태로 조회·갱신한다.

**Tech Stack:** Next.js 16.2 App Router, React 19 Client Component, TypeScript, Axios, `node:test`

## Global Constraints

- 백엔드 API 계약과 상단 네 개 요약 카드의 버킷 정책은 변경하지 않는다.
- 상태 필터 목록은 기존 판매자·월 그룹 조회 방식을 유지한다.
- `GET /api/v2/admin/settlements/weeks`는 `page=0`, `size=1`로 호출하고 목록 항목은 사용하지 않는다.
- 선택 월이 있으면 `settlementMonth`를 동일하게 전달한다.
- 새 테스트 프레임워크나 런타임 의존성을 추가하지 않는다.

---

### Task 1: 7개 상태 건수 계약과 API 호출 추가

**Files:**
- Modify: `lib/settlementContracts.ts`
- Modify: `lib/settlementContracts.test.ts`
- Modify: `lib/settlements.ts`

**Interfaces:**
- Produces: `mapAdminSettlementStatusCounts(value: unknown): SettlementStatusCount[]`
- Produces: `settlementStatusCount(counts: SettlementStatusCount[], status?: SettlementDisplayStatus): number`
- Produces: `getAdminSettlementStatusCounts(settlementMonth?: string): Promise<SettlementStatusCount[]>`

- [ ] **Step 1: 주간 응답의 독립 상태 건수와 전체 합계를 검증하는 실패 테스트 작성**

```ts
test('admin weekly status counts keep all filter statuses independent', () => {
  const counts = mapAdminSettlementStatusCounts({
    statusCounts: [
      { status: 'WAITING', statusLabel: '대기', count: '60' },
      { status: 'APPROVAL_ON_HOLD', statusLabel: '승인 보류', count: '8' },
      { status: 'APPROVED', statusLabel: '승인', count: 0 },
      { status: 'PAYOUT_REQUESTED', statusLabel: '지급 신청', count: 4 },
      { status: 'PAYOUT_ON_HOLD', statusLabel: '지급 보류', count: 0 },
      { status: 'PAID', statusLabel: '지급 완료', count: 9 },
      { status: 'CANCELLED', statusLabel: '취소', count: 1 },
    ],
  })

  assert.equal(settlementStatusCount(counts, 'APPROVAL_ON_HOLD'), 8)
  assert.equal(settlementStatusCount(counts, 'PAYOUT_REQUESTED'), 4)
  assert.equal(settlementStatusCount(counts, 'CANCELLED'), 1)
  assert.equal(settlementStatusCount(counts), 82)
})
```

- [ ] **Step 2: 관련 테스트를 실행해 새 함수 부재로 실패하는지 확인**

Run:

```bash
node --experimental-strip-types --test lib/settlementContracts.test.ts
```

Expected: `mapAdminSettlementStatusCounts` 또는 `settlementStatusCount` export 부재로 FAIL.

- [ ] **Step 3: 응답 변환과 필터별 합산을 최소 구현**

```ts
export function mapAdminSettlementStatusCounts(value: unknown): SettlementStatusCount[] {
  return mapStatusCounts(record(value).statusCounts)
}

export function settlementStatusCount(
  counts: SettlementStatusCount[],
  status?: SettlementDisplayStatus,
): number {
  return counts
    .filter((count) => status == null || count.status === status)
    .reduce((sum, count) => sum + count.count, 0)
}
```

- [ ] **Step 4: 주간 상태 건수 API 함수 추가**

```ts
export async function getAdminSettlementStatusCounts(
  settlementMonth?: string,
): Promise<SettlementStatusCount[]> {
  const res = await api.get(`${API_BASE}/admin/settlements/weeks`, {
    params: {
      page: 0,
      size: 1,
      ...(settlementMonth ? { settlementMonth } : {}),
    },
  })
  return mapAdminSettlementStatusCounts(res.data?.data)
}
```

- [ ] **Step 5: 관련 테스트가 통과하는지 확인**

Run:

```bash
node --experimental-strip-types --test lib/settlementContracts.test.ts
```

Expected: 모든 `settlementContracts` 테스트 PASS.

### Task 2: 관리자 필터 배지를 실제 상태 건수에 연결

**Files:**
- Modify: `app/admin/settlements/_components/AdminSettlementsView.tsx`

**Interfaces:**
- Consumes: `getAdminSettlementStatusCounts(settlementMonth?: string)`
- Consumes: `settlementStatusCount(counts, status?)`

- [ ] **Step 1: 요약 카드와 필터 상태를 분리**

```ts
const [summary, setSummary] = useState<SettlementSummaryCard[]>([])
const [statusCounts, setStatusCounts] = useState<SettlementStatusCount[]>([])

const loadStatusCounts = async (month: string) => {
  try {
    setStatusCounts(await getAdminSettlementStatusCounts(month || undefined))
  } catch {
    setStatusCounts([])
  }
}
```

- [ ] **Step 2: 최초 진입·필터 변경·액션 후 상태 건수를 갱신**

초기 `useEffect`, `changeFilters`, `refreshAfterAction`에서 기존 요약 및 목록 호출과 함께
`loadStatusCounts`를 실행한다.

```ts
void loadStatusCounts('')
```

```ts
void loadStatusCounts(month)
```

```ts
loadStatusCounts(settlementMonth)
```

- [ ] **Step 3: 필터 배지를 7개 상태 건수로 계산**

```ts
const tabCount = (status: SettlementFilter) =>
  settlementStatusCount(statusCounts, status === 'all' ? undefined : status)
```

기존 `summary.reduce` 및 `summary.find` 기반의 `totalCount`와 `tabCount`는 제거한다.

- [ ] **Step 4: 관련 테스트와 정적 검사를 실행**

Run:

```bash
node --experimental-strip-types --test lib/settlementContracts.test.ts
npx eslint lib/settlementContracts.ts lib/settlementContracts.test.ts lib/settlements.ts app/admin/settlements/_components/AdminSettlementsView.tsx
```

Expected: 테스트와 ESLint 모두 exit 0.

### Task 3: 전체 검증과 main 게시

**Files:**
- Verify all modified files

- [ ] **Step 1: 전체 TypeScript 테스트 실행**

```bash
node --experimental-strip-types --test $(rg --files -g '*.test.ts')
```

Expected: 전체 테스트 PASS, 실패 0.

- [ ] **Step 2: 전체 ESLint 실행**

```bash
npm run lint
```

Expected: ESLint 오류 0.

- [ ] **Step 3: 프로덕션 빌드 실행**

```bash
npm run build
```

Expected: Next.js 빌드 exit 0.

- [ ] **Step 4: 변경사항 검토 후 구현 커밋**

```bash
git diff --check
git status --short
git add lib/settlementContracts.ts lib/settlementContracts.test.ts lib/settlements.ts app/admin/settlements/_components/AdminSettlementsView.tsx docs/superpowers/plans/2026-07-30-admin-settlement-filter-count.md
git commit -m "fix: 관리자 정산 필터 상태별 건수 표시"
```

- [ ] **Step 5: 원격 main과 동기화 상태를 확인하고 푸시**

```bash
git fetch origin
git rev-list --left-right --count origin/main...main
git push origin main
```

Expected: 원격 `main`이 현재 구현 커밋까지 fast-forward.
