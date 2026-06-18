# /edit/[id] — 프롬프트 수정

## 역할
판매자가 등록한 프롬프트를 PATCH(소수정) / MAJOR(대수정) 버전 유형을 선택해 수정하는 폼 페이지.
`EditScreen`(내부 컴포넌트)이 폼 UI를 담당하고, page export는 데이터 페칭 + 로딩/에러 처리.

---

## 리팩토링 플랜

### 이동할 유틸 → `lib/utils.ts` 또는 `app/edit/[id]/utils.ts`

- `nextVer(latest, type)` 함수 (line 45) — 버전 문자열 증가 로직

### 추출할 페이지 섹션 → `app/edit/[id]/_components/`

| 컴포넌트 | 책임 |
|----------|------|
| `BasicInfoCard.tsx` | 제목·카테고리·모델·가격 Card (sell과 유사) |
| `PromptBodyCard.tsx` | 프롬프트 내용 textarea Card |
| `ThumbnailCard.tsx` | 대표 썸네일 업로드 Card |
| `VersionCard.tsx` | 버전 유형 선택 + 변경 내용 textarea Card |

### 인라인 상수/스타일

- `CATEGORIES` → `lib/constants.ts` (6개 페이지 중복)
- `taStyle` 객체 → Tailwind 클래스로 전환
- `Badge` 컴포넌트 → detail/reader와 통합 검토 후 `components/ui/` 이동 또는 로컬 유지

### 인라인 스타일 → Tailwind 전환

- 모든 `style={{}}` → `--ph-*` 토큰 기반 Tailwind 클래스
