# PromptHub — Next.js 마이그레이션 규칙

## 🚨 절대 규칙
- `PromptHub main page.html` 은 읽기 전용 원본이다. 절대 수정하지 않는다
- 시각적 결과물(색상, 간격, 폰트, 레이아웃, 애니메이션)을 픽셀 단위로 보존한다
- 디자인 개선·임의 리팩토링 금지. 이식만 한다
- 각 스텝 완료 후 반드시 브라우저에서 원본과 비교 확인을 요청한다

## 기술 스택
- Next.js (App Router) + TypeScript
- Tailwind CSS v4 — 커스텀 토큰은 globals.css의 @theme 블록에 등록
- Zustand (전역 상태)
- Axios (API 통신)
- 패키지 매니저: npm

## 디자인 토큰 — CSS 변수를 Tailwind에 그대로 매핑
- 이 프로젝트는 Tailwind v4를 사용한다
- tailwind.config.ts 없음 → globals.css의 @theme 블록에서 관리
- :root의 --ph-* 변수와 @theme 블록은 항상 동기화 상태를 유지한다
- 임의로 값을 바꾸지 않는다

### Tailwind v4 단위 규칙
Tailwind v4는 spacing 기본 단위가 `--spacing: 0.25rem`이라 **단위 없는 소수점 클래스**가 동작한다.
(`gap-2.5` = 2.5 × 0.25rem = 0.625rem ≈ 10px)

**간격 우선순위**
1. `--ph-*` 토큰 클래스 — `gap-ph-xs`(10px), `gap-ph-8`(8px) 등
2. Tailwind 소수점 스케일 — `gap-2.5`, `p-3.5` 등 (토큰 미정의 값)
3. px 임의값 — `gap-[10px]` (위 두 방법 모두 부적합할 때만)

**폰트 크기 우선순위**
1. `--ph-*` 토큰 클래스 — `text-ph-caption`(13px), `text-ph-body-sm`(14px) 등
2. px 임의값 — `text-[13.5px]` (토큰 미정의 크기; rem 소수점 임의값은 가독성이 낮아 사용하지 않는다)

**토큰 추가 기준** (`globals.css`)
- 새 폰트 크기 토큰은 rem 단위로 정의한다 (`--ph-caption-size: 0.8125rem`)

## 디자인/페이지 작업 시 토큰 사용 (필수)
- **새 디자인·페이지·컴포넌트를 만들 때는 반드시 `--ph-*` 디자인 토큰을 사용**한다
  - Tailwind 클래스: `bg-ph-primary`, `text-ph-text-secondary`, `border-ph-border`, `rounded-ph-lg`, `font-ph` 등
  - 인라인 스타일: `var(--ph-*)`
- **임의 색상 금지**: 표준 Tailwind 색상 클래스(`bg-blue-500`, `text-gray-600` 등)나 하드코딩 HEX를 새로 도입하지 않는다
  - 예외: 원본 HTML이 토큰화하지 않고 인라인 리터럴로 쓴 값(예: 에러 배경 `#fdeceb`, 그라데이션)은 원본 픽셀 보존을 위해 그대로 둔다
- 토큰 ↔ 클래스 매핑·치수·공통 컴포넌트 스펙은 **`docs/design-tokens.md`** 치트시트를 먼저 참고한다
- 어드민 공통 컴포넌트는 `components/admin/*`(Badge/StatusBadge, SectionCard, Table 등)를 재사용한다
- 상수·컴포넌트·스타일 사용 규칙은 **`docs/conventions.md`** 를 먼저 확인한다

## 디자인 시스템 ↔ 문서 동기화 (필수)
- `app/globals.css`(토큰)나 `components/admin/*`(공통 컴포넌트)에 **새 토큰/컴포넌트를 추가·변경하면**, 같은 작업에서 **`docs/design-tokens.md`를 반드시 동기화**한다
- 이 두 경로를 Edit/Write 하면 PostToolUse hook이 동기화 리마인더를 띄운다 (`.claude/settings.json`)
- 동기화 항목: 추가된 색상/타이포/간격/radius 토큰, 새 공통 컴포넌트의 props·치수·사용 예시

## 컴포넌트 규칙
- `'use client'` 는 useState / useEffect / 이벤트 핸들러 사용 시에만 추가
- 이미지는 `<img>` 금지 → Next.js `<Image>` 컴포넌트만 사용
- thumbnail_url이 null이면 Promy 기본 이미지(`/images/promy-default.png`) 사용
- S3 도메인은 next.config.ts images.domains에 추가

## 반응형 기준
- 모바일: 768px 미만
- 태블릿: 768px ~ 1024px
- 데스크탑: 1024px 이상
- 원본의 `@media (max-width: 768px)` 규칙을 그대로 이식한다

## 라우트 구조 (9개)
| 원본 route | Next.js 경로 |
|------------|-------------|
| home | `/` |
| browse | `/browse` |
| detail | `/detail/[id]` |
| sell | `/sell` |
| shop | `/shop` |
| mypage | `/mypage` |
| reader | `/reader/[id]` |
| edit | `/edit/[id]` |
| apply | `/apply` |

모달: LoginModal → `components/modals/LoginModal.tsx`

## 폰트
Pretendard Variable을 CDN으로 로드한다 (번들 인라인 금지).
`https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css`

## 이미지 자산
원본 HTML의 UUID 번들에서 추출한 PNG 2장:
- `362ea1b0` → `/public/images/promy-character.png` (마스코트)
- `01c5025e` → `/public/images/hero-mockup.png` (히어로 목업)

## 작업 순서 원칙
한 번에 하나의 스텝만 진행한다.
스텝 완료 → 확인 → 다음 스텝. 절대 건너뛰지 않는다.


@AGENTS.md

api 구현 시 @plan.md 를 보고 없는 기능이면 추가 플랜을 넣는다. 