# app/auth/kakao/callback — 리팩토링 플랜

## 현황
- 약 84줄, 카카오 OAuth 콜백 처리 전용 페이지
- `LoadingUI` 컴포넌트가 page 내부에 선언되어 있으며 모든 스타일이 `style={{}}`

## 인라인 컴포넌트 처리

### `LoadingUI` → Tailwind 클래스 교체
현재 인라인 스타일 전체를 Tailwind + ph-* 토큰으로 교체.

```tsx
// 현재
<div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', ... }}>

// 교체
<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ph-background">
```

```tsx
// 아이콘 래퍼 현재
<span style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--ph-primary)', color: '#fff', ... }}>

// 교체
<span className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-ph-primary text-white">
```

```tsx
// 텍스트 현재
<p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: 0 }}>

// 교체
<p className="m-0 text-ph-body-md text-ph-text-secondary">
```

## 구조 설명

```
KakaoCallbackPage (page.tsx)
└── Suspense
    ├── fallback: <LoadingUI />
    └── <KakaoCallbackContent /> → useSearchParams 사용 (Suspense 필수)
        └── <LoadingUI /> (항상 렌더, API 응답 후 router.replace)
```

## 주의 사항
- `useSearchParams()`는 반드시 `<Suspense>` 내부에서 사용해야 함 (현재 구조 유지)
- `called` ref로 중복 API 호출 방지 — 이 패턴 유지
- 성공/실패 모두 `/`로 redirect하므로 에러 UI 불필요

## 분리 필요 없음
- `KakaoCallbackContent`는 이 페이지 전용 로직이므로 page 파일 내 유지
- `LoadingUI`도 이 페이지에서만 사용하므로 page 내 유지 (단, 스타일만 교체)
