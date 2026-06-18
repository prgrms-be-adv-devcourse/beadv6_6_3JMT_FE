# /sell — 프롬프트 등록

## 역할
판매자가 새 프롬프트를 등록하는 폼 페이지.
좌측 폼 + 우측 라이브 미리보기(`PromptCard`) 2열 레이아웃.

---

## 리팩토링 플랜

### 추출할 컴포넌트 → `components/ui/`

| 현위치 | 이동 대상 | 비고 |
|--------|-----------|------|
| `Input` (line 33) | `components/ui/Input.tsx` | apply/page.tsx의 `Input`과 동일 컴포넌트 |

### 추출할 페이지 섹션 → `app/sell/_components/`

| 컴포넌트 | 책임 |
|----------|------|
| `BasicInfoCard.tsx` | 제목·카테고리·모델·가격 Card |
| `PromptBodyCard.tsx` | 프롬프트 내용 textarea Card |
| `TagImageCard.tsx` | 태그 입력 + 썸네일 + 소개 이미지 Card |
| `PreviewSidebar.tsx` | 우측 라이브 미리보기 사이드바 |
| `SubmitBar.tsx` | 임시저장/등록하기 버튼 영역 + 상태 표시 |

### 이동할 상수 → `lib/constants.ts`

- `CATEGORIES` — 6개 페이지 중복

### 인라인 스타일 → Tailwind 전환

- 모든 `style={{}}` → `--ph-*` 토큰 기반 Tailwind 클래스
