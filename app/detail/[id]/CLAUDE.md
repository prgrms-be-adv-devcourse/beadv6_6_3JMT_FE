# /detail/[id] — 프롬프트 상세

## 역할
개별 프롬프트의 상세 정보, 구매/장바구니/찜 액션, 버전 기록, 연관 프롬프트를 보여주는 페이지.
`DetailScreen`(내부 컴포넌트)이 실제 UI를 담당하고, page export는 데이터 페칭 + 로딩/에러 처리.

---

## 리팩토링 플랜

### 추출할 컴포넌트 → `components/ui/`

| 현위치 | 이동 대상 | 비고 |
|--------|-----------|------|
| `Avatar` (line 87) | `components/ui/Avatar.tsx` | apply, reader에도 동일 컴포넌트 중복 |

### 추출할 페이지 섹션 → `app/detail/[id]/_components/`

| 컴포넌트 | 책임 | 비고 |
|----------|------|------|
| `PriceTag.tsx` | 가격 표시 (구매완료/무료/할인/일반) | detail 전용 |
| `PurchaseCard.tsx` | 구매/장바구니/찜 버튼 + 기능 목록 Card | `CircleBtn` 포함 |
| `VersionHistory.tsx` | 버전 기록 아코디언 Card | |
| `SellerCard.tsx` | 판매자 정보 Card | `Avatar` 사용 |
| `Thumb.tsx` | 썸네일 플레이스홀더 | detail 전용 |

### 인라인 유틸 → 유지 또는 이동

- `Icon` 유틸 함수 (line 49) → `lib/iconMap.ts`에 헬퍼로 추가하거나 현위치 유지
- `Badge` (line 56) → `components/ui/` 또는 현위치 유지 (detail/edit/reader 간 미세한 prop 차이 있음)

### 이동할 상수 → `lib/constants.ts`

- (해당 없음 — detail은 CATEGORIES 미사용)

### 인라인 스타일 → Tailwind 전환

- 모든 `style={{}}` → `--ph-*` 토큰 기반 Tailwind 클래스
