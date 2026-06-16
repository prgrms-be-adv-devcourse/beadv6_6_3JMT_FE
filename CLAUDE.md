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
