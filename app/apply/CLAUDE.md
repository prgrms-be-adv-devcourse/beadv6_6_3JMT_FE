# /apply — 판매자 신청

## 역할
비판매자가 판매자 권한을 신청하는 폼 페이지.
비로그인 게이트 → 신청 폼 → 완료 화면 3단계 뷰를 가진다.

---

## 리팩토링 플랜

### 추출할 컴포넌트

| 현위치 | 이동 대상 | 비고 |
|--------|-----------|------|
| `Avatar` (line 33) | `components/ui/Avatar.tsx` | detail, reader에도 동일 컴포넌트 중복 |
| `Input` (line 66) | `components/ui/Input.tsx` | sell/page.tsx에도 동일 컴포넌트 중복 |

### 추출할 페이지 섹션 → `app/apply/_components/`

| 컴포넌트 | 책임 |
|----------|------|
| `LoginGate.tsx` | 비로그인 안내 화면 |
| `SuccessView.tsx` | 신청 완료 화면 |
| `ApplicantCard.tsx` | 신청자 정보 + 카테고리 선택 Card |
| `IntroCard.tsx` | 판매 계획 소개 textarea Card |
| `PortfolioCard.tsx` | 포트폴리오 링크 Input Card |
| `AgreementCard.tsx` | 약관 동의 체크박스 Card |
| `ProcessSidebar.tsx` | 우측 진행 안내 사이드바 |

### 이동할 상수 → `lib/constants.ts`

- `CATEGORIES` (id/label 배열) — browse, home, sell, edit, reader 포함 6개 페이지 중복

### 이동할 상수 → `app/apply/constants.ts`

- `STEPS` (진행 안내 3단계 데이터) — apply 전용

### 인라인 스타일 → Tailwind 전환

- `taStyle` 객체 (textarea 스타일) 제거 → Tailwind 클래스로
- 모든 `style={{}}` → `--ph-*` 토큰 기반 Tailwind 클래스

### 최종 page.tsx 책임
상태 관리 + API 호출(`/api/v1/sellers/apply-status`, `/api/v1/seller`) + 레이아웃 조합만 담당.
