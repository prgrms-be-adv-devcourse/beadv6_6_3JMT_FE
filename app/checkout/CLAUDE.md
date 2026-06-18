# /checkout — 주문 · 결제

## 역할
단건 구매(`?id=`) 또는 장바구니 결제 두 모드를 처리하는 결제 확인 페이지.
`useSearchParams` 사용으로 `CheckoutContent`를 `Suspense`로 래핑.

---

## 리팩토링 플랜

### 추출할 페이지 섹션 → `app/checkout/_components/`

| 컴포넌트 | 책임 |
|----------|------|
| `OrderItemList.tsx` | 주문 상품 목록 (thumbnail + 삭제 버튼) |
| `PriceSummary.tsx` | 상품 금액 / 최종 결제 금액 요약 |
| `PaymentButton.tsx` | 결제 버튼 + disabled/loading 상태 |

### 인라인 스타일 → Tailwind 전환

- 모든 `style={{}}` → `--ph-*` 토큰 기반 Tailwind 클래스
- 에러 배경(`#fef2f2`, `#fecaca`)은 원본 값 그대로 유지 (토큰 미정의)

### 패턴 유지

- `CheckoutContent` + `Suspense` 래핑 구조는 Next.js `useSearchParams` 요건이므로 유지.
- 에러 상태 / 로딩 상태 / 완료 배너는 `CheckoutContent` 내부에서 조건부 렌더링 유지.
