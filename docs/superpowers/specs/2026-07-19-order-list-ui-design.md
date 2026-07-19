# 주문 내역 UI 설계 (결제 내역 → 주문 내역)

## 배경
mypage "결제 내역" 탭이 아이템 단위 플랫 테이블(`PaymentTable`)로 되어 있다. `order_list.html`(참고 목업) 방식으로 주문 단위 그룹 + 펼침 UI로 바꾼다.

## 범위
- `app/mypage/page.tsx`의 결제 내역 탭 UI 교체만. 탭 id/URL(`?tab=payments`), API(`getPayments`), 환불 컨펌 플로우(`ConfirmDialog` + `handleRefund`)는 변경 없음.
- 백엔드 변경 없음. `PaymentItem[]`(아이템 단위, `orderId` 포함)을 클라이언트에서 `orderId` 기준으로 그룹핑.
- 화면 노출 텍스트만 "결제"→"주문"으로 변경 (탭 라벨, 섹션 타이틀/부제, 빈 상태 문구).

## 컴포넌트

### `components/ui/OrderList.tsx` (신규, `PaymentTable.tsx` 대체)
`PaymentTable`은 mypage 한 곳에서만 쓰여 대체 후 삭제.

```ts
interface OrderListProps {
  payments: PaymentItem[];
  onRefund: (paymentId: string) => void;
}
```

내부 구조:
- 순수 함수 `groupOrders(payments: PaymentItem[]): GroupedOrder[]` — `orderId` 기준 그룹핑 + 주문 레벨 필드 계산. 백엔드가 나중에 `orderStatus`를 내려주면 이 함수만 교체하면 되도록 분리.
- `GroupedOrder`: `{ orderId, paidAt, amount, status: '결제완료' | '부분 환불' | '전체 환불', items: PaymentItem[] }`
  - `amount` = items amount 합산
  - `paidAt` = items 중 첫 항목 기준
  - `status` 계산 규칙:
    - 전부 `PAID` → `결제완료`
    - 전부 `REFUNDED` → `전체 환불`
    - 그 외(REFUNDING 또는 REFUNDED가 일부 섞임) → `부분 환불`
- `openOrderId` state (단일 아코디언, 원본 `openIdx`와 동일 동작) — 다른 주문 클릭 시 이전 것 닫힘.
- Refund 버튼은 그대로 `onRefund(paymentId)` 호출 → 상위에서 `setRefundTargetId` → 기존 `ConfirmDialog` 흐름.

### 아이템 행 버튼 재사용
기존 `PaymentTable` 내부의 커스텀 `RefundButton`은 `components/ui/Button`(`variant="secondary" size="sm"`)과 스타일이 100% 동일(padding 7px 12px, minHeight 34, border `--ph-text`, radius sm, hover `--ph-gray-100`) → 커스텀 버튼 제거하고 `Button` 재사용.
- `REFUNDED`: 버튼 없음, `—` 표시 (기존 `PaymentTable` 로직 유지)
- `REFUNDING`: `<Button variant="secondary" size="sm" disabled>신청됨</Button>`
- `PAID` + `isRefundable`: `<Button variant="secondary" size="sm" onClick={...}>환불 신청</Button>`
- `PAID` + `!isRefundable`(다운로드됨): `—` + 안내문구(기존 유지)

## 레이아웃 & 토큰 매핑 (`docs/design-tokens.md` 기준)

그리드: `grid-cols-[1.4fr_1fr_1fr_1fr_96px]` (주문 행 · 아이템 행 공통, 아이템 행은 `item-name`이 1~2번 컬럼 `col-span-2`로 병합 — 원본 `grid-column:1/3`과 동일)

| 요소 | 원본 값 | 적용 클래스/토큰 |
|---|---|---|
| 헤더 행 | padding 12px 16px, border-bottom, 13px/500 muted | `py-ph-12 px-ph-16 border-b border-ph-border text-ph-caption font-medium text-ph-text-secondary` |
| 주문 행 | padding 18px 16px, 14px, border-bottom, hover `#fafafa` | `py-4.5 px-ph-16 text-ph-body-sm border-b border-ph-border hover:bg-ph-gray-50 cursor-pointer` (원본 `--row-hover:#fafafa`는 임의색 → 기존 토큰 `--ph-gray-50` 사용) |
| 주문번호/금액 (bold) | font-weight 700 | `font-bold text-ph-text` |
| 날짜 (muted) | | `text-ph-text-secondary` |
| 쉐브론 | 12px, rotate 180 on expand, transition 0.15s | `text-ph-text-muted transition-transform duration-150` + `rotate-180`(펼침 시) |
| 주문 상태 배지 | bg #eaf1fb / fg #2563a8, 13px/500, padding 4px 12px, radius full | 결제완료: `bg-ph-secondary text-ph-primary` / 부분 환불: `bg-[#fdeceb] text-ph-error`(기존 `PaymentTable` REFUNDING과 동일 인라인 리터럴 재사용) / 전체 환불: `bg-ph-gray-100 text-ph-text-secondary` — 공통 `text-ph-caption font-medium px-ph-12 py-ph-4 rounded-ph-full` |
| 펼침 패널 배경 | `#fafafa` | `bg-ph-gray-50` |
| 아이템 행 | padding 14px 16px, border-top | `py-3.5 px-ph-16 border-t border-ph-border` |
| 아이템명 | 14px/500 | `text-ph-body-sm font-medium` |
| 아이템 가격 | 14px muted | `text-ph-body-sm text-ph-text-secondary` |
| 아이템 상태 배지 | 12px/500, padding 2px 10px, radius full | 기존 `PaymentTable`의 `STATUS_MAP` 색상 그대로 재사용 (PAID: `--ph-primary`/`--ph-secondary`, REFUNDING: `--ph-red`/`rgba(217,45,32,0.10)`, REFUNDED: `--ph-gray-600`/`--ph-gray-100`) |

## 텍스트 변경
| 위치 | 기존 | 변경 |
|---|---|---|
| 탭 목록 라벨 | 결제 내역 | 주문 내역 |
| 섹션 타이틀 | 결제 내역 | 주문 내역 |
| 섹션 부제 | 결제한 내역과 환불 상태를 확인하세요. | 주문한 내역과 환불 상태를 확인하세요. |
| 빈 상태 문구 | 아직 결제 내역이 없어요. | 아직 주문 내역이 없어요. |

탭 id(`payments`)/`TabId` 타입/`VALID_TABS`/URL 쿼리(`?tab=payments`)는 변경 없음 — 텍스트만 교체.

## 페이지네이션
기존 "더 보기"(`handleLoadMorePayments`) 로직 그대로. 새 페이지 로드 시 `payments` state가 늘어나고 `groupOrders`가 `useMemo`로 재계산되어 그룹이 자동 갱신됨.

## 에러 처리
API 실패/로딩/빈 상태는 기존 `loadingPayments` / `TableSkeleton` / `EmptyState` 로직 그대로 사용, 컨텐츠만 `OrderList`로 교체.

## 테스트
- `groupOrders` 순수 함수 유닛 테스트: 단일 아이템 주문, 다중 아이템(전부 PAID/일부 REFUNDING/일부 REFUNDED/전부 REFUNDED) 상태 계산 케이스.
