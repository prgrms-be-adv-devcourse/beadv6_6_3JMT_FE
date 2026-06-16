# /components 디렉토리 규칙

## 컴포넌트 생성 원칙
- 원본 HTML의 style={{}} 인라인 스타일 그대로 유지
- CSS 변수 var(--ph-*) 그대로 유지
- 임의로 Tailwind 유틸리티 클래스로 변환 금지
- 'use client'는 useState/useEffect/이벤트 핸들러 사용 시에만
- 이미지는 반드시 Next.js <Image> 컴포넌트 사용
- thumbnail_url이 null이면 /images/promy-character.png 사용

## 디렉토리 구조
- components/layout/ → Header, Footer 등 레이아웃
- components/ui/ → 버튼, 카드, 모달 등 재사용 컴포넌트
- components/modals/ → LoginModal 등 모달
