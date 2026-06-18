# /reader/[id] — 프롬프트 리더

## 역할
구매한 프롬프트의 전문을 열람하고 TXT/MD/PDF로 다운로드하는 페이지.
다운로드 전 블러 처리 → 확인 다이얼로그 → 언블러 → 별점 평가 플로우.

---

## 리팩토링 플랜

### 추출할 컴포넌트 → `components/ui/`

| 현위치 | 이동 대상 | 비고 |
|--------|-----------|------|
| `Avatar` (line 92) | `components/ui/Avatar.tsx` | apply, detail에도 동일 컴포넌트 중복 |

### 이동할 유틸 → `lib/`

| 현위치 | 이동 대상 | 비고 |
|--------|-----------|------|
| `buildPromptText(p)` (line 60) | `lib/promptBuilder.ts` | 프롬프트 텍스트 생성 로직 |
| `ROLE_BY_CAT` 상수 (line 51) | `lib/promptBuilder.ts` | buildPromptText와 같이 이동 |
| `triggerBlob(blob, filename)` | `lib/download.ts` | 파일 다운로드 유틸 |

### 이동할 상수 → `lib/constants.ts`

- `CATEGORIES` (id/label) — 6개 페이지 중복

### 추출할 페이지 섹션 → `app/reader/[id]/_components/`

| 컴포넌트 | 책임 |
|----------|------|
| `PromptTextCard.tsx` | 프롬프트 전문 카드 (블러 + 다운로드 버튼) |
| `RatingCard.tsx` | 별점 평가 Card |
| `SellerCard.tsx` | 판매자 정보 Card |
| `DownloadButtons.tsx` | TXT/MD/PDF 버튼 그룹 |

### 인라인 스타일 → Tailwind 전환

- 모든 `style={{}}` → `--ph-*` 토큰 기반 Tailwind 클래스
- `Badge` 컴포넌트 → detail/edit과 통합 검토 후 `components/ui/` 이동 또는 로컬 유지
