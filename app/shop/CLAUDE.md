# /shop — 내 상점

## 역할
판매자의 등록 프롬프트 목록과 정산 내역을 관리하는 페이지.
"내 프롬프트" / "정산 내역" 2탭 구조.

---

## 리팩토링 플랜

### 추출할 페이지 섹션 → `app/shop/_components/`

| 컴포넌트 | 책임 |
|----------|------|
| `StatsCards.tsx` | 통계 카드 3개 (등록·판매·수익) |
| `TabBar.tsx` | "내 프롬프트" / "정산 내역" 탭 버튼 |
| `ListingsTab.tsx` | 내 프롬프트 그리드 + 카드 하단 액션 버튼 |
| `PaymentsTab.tsx` | 정산 내역 필터 + PaymentTable |

### 인라인 상수

- `FILTER_OPTIONS` — shop 전용이므로 `app/shop/constants.ts` 또는 `ListingsTab` 내부에 유지.

### 인라인 스타일 → Tailwind 전환

- 모든 `style={{}}` → `--ph-*` 토큰 기반 Tailwind 클래스
