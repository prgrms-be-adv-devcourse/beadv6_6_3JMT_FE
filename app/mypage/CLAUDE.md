# /mypage — 마이페이지

## 역할
프로필·구매·찜·결제·설정 5개 탭을 사이드바로 전환하는 계정 관리 페이지.
`useSearchParams` 사용으로 `MyPageContent`를 `Suspense`로 래핑.

---

## 리팩토링 플랜

### 추출할 컴포넌트 → `components/ui/`

| 현위치 | 이동 대상 | 비고 |
|--------|-----------|------|
| `Switch` (line 56) | `components/ui/Switch.tsx` | 토글 스위치 |
| `PHInput` (line 90) | `components/ui/Input.tsx` | apply의 `Input`과 통합 가능 |
| `EmptyState` (line 140) | `components/ui/EmptyState.tsx` | icon + text + CTA 패턴 |

### 추출할 모달 → `components/modals/`

| 현위치 | 이동 대상 |
|--------|-----------|
| `PasswordChangeModal` (line 174) | `components/modals/PasswordChangeModal.tsx` |

### 추출할 페이지 섹션 → `app/mypage/_components/`

| 컴포넌트 | 책임 |
|----------|------|
| `SideNav.tsx` | 좌측 탭 네비게이션 |
| `ProfileTab.tsx` | 프로필 탭 (프로필 카드 + 통계 3개) |
| `PurchasedTab.tsx` | 구매한 프롬프트 탭 |
| `WishlistTab.tsx` | 찜한 프롬프트 탭 |
| `PaymentsTab.tsx` | 결제 내역 탭 |
| `SettingsTab.tsx` | 설정 탭 (닉네임·이메일·비밀번호·알림) |
| `ContentSkeleton.tsx` | 콘텐츠 로딩 스켈레톤 |
| `GridSkeleton.tsx` | 카드 그리드 로딩 스켈레톤 |
| `TableSkeleton.tsx` | 테이블 로딩 스켈레톤 |

### 이동할 상수

- `NOTIF_ROWS` → `app/mypage/constants.ts` (mypage 전용)
- `NAV` 배열 → `app/mypage/constants.ts`

### 인라인 스타일 → Tailwind 전환

- 모든 `style={{}}` → `--ph-*` 토큰 기반 Tailwind 클래스
- `Row` 컴포넌트의 분리선 패턴도 Tailwind로 전환

### 패턴 유지

- `MyPageContent` + `Suspense` 래핑 구조는 `useSearchParams` 요건이므로 유지.
