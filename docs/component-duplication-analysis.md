# 컴포넌트 중복 분석 보고서
작성일: 2026-06-18

---

## 1. 분석 대상 목록

### components/ 폴더
| 파일 | 역할 |
|------|------|
| `components/modals/LoginModal.tsx` | 로그인·회원가입 모달 |
| `components/modals/EmailChangeModal.tsx` | 이메일 변경 모달 (2단계: 입력 → 인증) |
| `components/ui/Toast.tsx` | 하단 고정 토스트 알림 |
| `components/ui/StarRate.tsx` | 별점 입력 위젯 |
| `components/ui/FormField.tsx` | input/textarea 공통 래퍼 |
| `components/ui/ImageUpload.tsx` | 드래그&드롭 이미지 업로드 |
| `components/ui/PaymentTable.tsx` | 결제 내역 테이블 |
| `components/ui/PromptCard.tsx` | 프롬프트 카드 (찜·장바구니 포함) |
| `components/ui/ImageCarousel.tsx` | 이미지 슬라이드 뷰어 |
| `components/ui/Logo.tsx` | 로고 컴포넌트 |
| `components/layout/Header.tsx` | 전역 헤더 |
| `components/layout/Footer.tsx` | 전역 푸터 |
| `components/layout/ConditionalLayout.tsx` | reader 페이지 헤더 제외 래퍼 |
| `components/providers/MockProvider.tsx` | MSW 목 프로바이더 |
| `components/providers/AuthSync.tsx` | 인증 상태 동기화 |

### 분석 페이지 파일
| 파일 | 인라인 컴포넌트 |
|------|----------------|
| `app/mypage/page.tsx` | Button, Card, PHInput, Switch, Row, SectionTitle, EmptyState, PasswordChangeModal (인라인 모달), 회원탈퇴 모달 (인라인), 환불신청 모달 (인라인) |
| `app/checkout/page.tsx` | 에러 메시지 박스 (인라인), 결제 완료 배너 |
| `app/detail/[id]/page.tsx` | Button, Card, Badge, Avatar, Thumb, PriceTag, CircleBtn |
| `app/sell/page.tsx` | Button, Card, Input, Tag, Label |
| `app/shop/page.tsx` | Button, 판매 중단 인라인 컨펌 UI (카드 하단에 인라인) |
| `app/reader/[id]/page.tsx` | Button, Card, Badge, Avatar, ConfirmDialog (인라인 정의) |
| `app/edit/[id]/page.tsx` | Button, Card, Tag, Badge, Label |
| `app/apply/page.tsx` | Button, Card, Input, Tag, Label, Avatar |
| `app/browse/page.tsx` | Tag |

---

## 2. ConfirmDialog 패턴 분석

### 2-1. 발견된 확인/취소 다이얼로그 목록

#### 인스턴스 1 — 회원 탈퇴 확인 모달 (mypage/page.tsx)
- **위치**: `app/mypage/page.tsx` 라인 854~915 (인라인, JSX 내부)
- **마크업 구조 요약**:
  - backdrop: `position: fixed, inset: 0, background: rgba(0,0,0,0.45), zIndex: 1000`
  - 흰 박스: `background: #fff, borderRadius: var(--ph-radius-xl), maxWidth: 400, padding: 28`
  - 아이콘: 원형 52×52, `background: #fef2f2`, `AlertTriangle` (color: `var(--ph-error)`)
  - 구조: 아이콘(중앙 정렬) → 제목(center) → 설명(center) → 버튼 쌍(flex row)
  - 닫기 X 버튼: **없음**
  - 배경 클릭 닫힘: `onClick={() => { if (!withdrawing) setWithdrawModal(false); }}`
- **실제 값**:
  - title: "정말 탈퇴하시겠어요?"
  - description: "탈퇴하면 구매 내역, 찜 목록 등 모든 데이터가 삭제되며 되돌릴 수 없습니다."
  - icon: AlertTriangle (red, `#fef2f2` 배경)
  - confirmLabel: "탈퇴하기"
  - cancelLabel: "취소"
  - onConfirm: `handleWithdraw`
  - onCancel: `() => setWithdrawModal(false)`
  - loading: `withdrawing` state
  - confirmVariant: **danger** (background: `var(--ph-error)`, color: `#fff`)
  - cancelVariant: **secondary** (border: `var(--ph-border)`, bg: `var(--ph-surface)`)

#### 인스턴스 2 — 환불 신청 확인 모달 (mypage/page.tsx)
- **위치**: `app/mypage/page.tsx` 라인 927~970 (인라인, JSX 내부)
- **마크업 구조 요약**:
  - backdrop: `position: fixed, inset: 0, background: rgba(0,0,0,0.45), zIndex: 1000`
  - 흰 박스: `background: #fff, borderRadius: var(--ph-radius-xl), maxWidth: 420, padding: 28`
  - 아이콘: 원형 44×44, `background: rgba(217,45,32,0.10)`, `AlertTriangle` (color: `var(--ph-red)`)
  - 구조: 아이콘(좌측) → 제목(좌측) → 설명 → 버튼 쌍(`Button` 컴포넌트 사용)
  - 닫기 X 버튼: **없음**
  - 배경 클릭 닫힘: `onClick={() => setRefundTarget(null)}`
- **실제 값**:
  - title: "환불 신청"
  - description: "환불 신청 시 구매한 상품 열람이 불가합니다. 환불을 신청하시겠습니까?"
  - icon: AlertTriangle (red)
  - confirmLabel: "환불 신청"
  - cancelLabel: "취소"
  - onConfirm: `requestRefund(refundTarget.id) + setRefundTarget(null)`
  - onCancel: `() => setRefundTarget(null)`
  - loading: 없음
  - confirmVariant: **solid** (primary blue, `Button variant="solid"`)

#### 인스턴스 3 — 다운로드 전 확인 다이얼로그 (reader/[id]/page.tsx)
- **위치**: `app/reader/[id]/page.tsx` 라인 222~275 (`ConfirmDialog` 함수로 분리 정의)
- **마크업 구조 요약**:
  - backdrop: `position: fixed, inset: 0, background: rgba(0,0,0,0.45), zIndex: 1000`
  - 흰 박스: `background: #fff, borderRadius: var(--ph-radius-xl), maxWidth: 420, padding: 28`
  - 아이콘: 원형 44×44, `background: var(--ph-secondary)`, `AlertTriangle` (color: `var(--ph-primary)`)
  - 구조: 아이콘(좌측) → 제목 → 설명 → 버튼 쌍(`Button` 컴포넌트 사용)
  - 닫기 X 버튼: **없음**
  - 배경 클릭 닫힘: `onClick={onCancel}`
- **실제 값**:
  - title: props (`title: "다운로드 전 확인"`)
  - body/description: props (`body: "다운로드 후에는 환불 처리가 불가합니다. 계속하시겠습니까?"`)
  - icon: AlertTriangle (primary blue 배경 - 다른 인스턴스와 색상 차이!)
  - confirmLabel: "다운로드 진행" (하드코딩)
  - cancelLabel: "취소" (하드코딩)
  - onConfirm: props
  - onCancel: props
  - loading: 없음
  - confirmVariant: **solid** (primary)

#### 인스턴스 4 — 판매 중단 인라인 컨펌 (shop/page.tsx)
- **위치**: `app/shop/page.tsx` 라인 278~296 (모달이 아닌 카드 하단 인라인 UI)
- **마크업 구조 요약**: 전통적인 모달 패턴이 **아님**. 카드 아래에 경고 텍스트 + 버튼 쌍이 인라인으로 렌더됨
- **실제 값**:
  - 경고: "중단하면 다시 등록할 수 없어요" (AlertTriangle 아이콘)
  - confirmLabel: "중단"
  - cancelLabel: "취소"
  - 구조: backdrop 없음, 모달 아님 → **ConfirmDialog 통합 대상에서 제외**

### 2-2. 마크업 일치도 비교표

| 항목 | 회원탈퇴 (mypage) | 환불신청 (mypage) | 다운로드확인 (reader) |
|------|:---:|:---:|:---:|
| backdrop rgba | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.45)` |
| zIndex | 1000 | 1000 | 1000 |
| 흰박스 bg | #fff | #fff | #fff |
| 흰박스 radius | `var(--ph-radius-xl)` | `var(--ph-radius-xl)` | `var(--ph-radius-xl)` |
| padding | 28 | 28 | 28 |
| maxWidth | 400 | 420 | 420 |
| role="dialog" | O | O | O |
| aria-modal | O | O | O |
| 아이콘 크기 | 52×52 | 44×44 | 44×44 |
| 아이콘 모양 | AlertTriangle | AlertTriangle | AlertTriangle |
| 아이콘 배경 | `#fef2f2` (red tint) | `rgba(217,45,32,0.10)` (red tint) | `var(--ph-secondary)` (blue tint) |
| 아이콘 컬러 | `var(--ph-error)` | `var(--ph-red)` | `var(--ph-primary)` |
| 제목 정렬 | center | left | left |
| 닫기 X 버튼 | 없음 | 없음 | 없음 |
| 배경 클릭 닫힘 | O | O | O |
| 확인 버튼 스타일 | danger (ph-error) | solid (primary) | solid (primary) |
| 취소 버튼 스타일 | 날것 button | `Button variant="secondary"` | `Button variant="secondary"` |
| loading prop | O (withdrawing) | 없음 | 없음 |

### 2-3. 공통 props 추출 가능 여부

3개 인스턴스 모두 동일한 마크업 골격을 가지며, 차이는 props로 표현 가능하다. 예상 인터페이스:

```typescript
interface ConfirmDialogProps {
  /** 모달 표시 여부 */
  open: boolean;
  /** 제목 */
  title: string;
  /** 본문 설명 */
  description: React.ReactNode;
  /** 아이콘 컴포넌트 (기본: AlertTriangle) */
  icon?: React.ComponentType<{ style?: React.CSSProperties }>;
  /** 아이콘 배경색 (기본: 'rgba(217,45,32,0.10)' — danger tint) */
  iconBg?: string;
  /** 아이콘 색상 (기본: 'var(--ph-error)') */
  iconColor?: string;
  /** 확인 버튼 텍스트 */
  confirmLabel: string;
  /** 취소 버튼 텍스트 (기본: '취소') */
  cancelLabel?: string;
  /** 확인 핸들러 */
  onConfirm: () => void;
  /** 취소/닫기 핸들러 */
  onCancel: () => void;
  /** 처리 중 상태 (확인 버튼 비활성, 취소 불가) */
  loading?: boolean;
  /** 확인 버튼 스타일 변형 */
  confirmVariant?: 'danger' | 'primary';
  /** 최대 너비 (기본: 420) */
  maxWidth?: number;
}
```

### 2-4. ConfirmDialog 통합 판단

**완전 통합 가능**

- 3개 인스턴스의 backdrop·흰박스·아이콘원·제목·설명·버튼쌍 구조가 90% 이상 일치
- 회원탈퇴 모달의 제목 정렬(center) 차이는 `titleAlign?: 'left' | 'center'` prop으로 흡수 가능
- 회원탈퇴의 날것 button 취소는 `Button` 컴포넌트로 정규화 가능
- loading 상태 처리도 prop 하나로 커버 가능

---

## 3. 모달 공통 패턴 (ModalShell) 분석

### 3-1. 기존 modals/ 컴포넌트 패턴

#### LoginModal (`components/modals/LoginModal.tsx`)
- backdrop: `position: fixed, inset: 0, zIndex: 80, background: rgba(15,23,42,0.4), padding: 24`
- 흰 박스: `width: 420, maxWidth: 100%, maxHeight: 92vh, overflowY: auto, background: #fff, borderRadius: var(--ph-radius-xl), border: 1px solid var(--ph-border), padding: 32`
- 헤더 구조: 로고 + X 버튼 (justify: space-between)
- 닫기 버튼: 우상단, X 아이콘 (lucide `X`, 20×20)
- 배경 클릭 닫힘: `onClick={onClose}` → `e.stopPropagation()`
- `role/aria-modal`: **없음**

#### EmailChangeModal (`components/modals/EmailChangeModal.tsx`)
- backdrop: `position: fixed, inset: 0, background: rgba(0,0,0,0.45), zIndex: 1000, padding: 20`
- 흰 박스: `background: #fff, borderRadius: var(--ph-radius-xl), maxWidth: 440, width: 100%, padding: 28`
- 헤더 구조: 아이콘원형(44×44) + X 버튼 (justify: space-between)
- 닫기 버튼: 우상단, X 아이콘 (lucide `X`, 20×20), `aria-label="닫기"`
- 배경 클릭 닫힘: `onClick={onClose}` → `e.stopPropagation()`
- `role="dialog" aria-modal="true"`: O

#### PasswordChangeModal (`app/mypage/page.tsx` 라인 264~406, 인라인 정의)
- backdrop: `position: fixed, inset: 0, background: rgba(0,0,0,0.45), zIndex: 1000, padding: 20`
- 흰 박스: `background: #fff, borderRadius: var(--ph-radius-xl), maxWidth: 440, width: 100%, padding: 28`
- 헤더 구조: 아이콘원형(44×44, bg: var(--ph-secondary)) + SVG X 버튼 (인라인 SVG, 20×20)
- 닫기 버튼: 우상단, `aria-label="닫기"` (lucide X 아닌 인라인 SVG 사용 — 차이)
- 배경 클릭 닫힘: `onClick={onClose}` → `e.stopPropagation()`
- `role="dialog" aria-modal="true"`: O

### 3-2. 인라인 모달 패턴 비교

| 속성 | LoginModal | EmailChangeModal | PasswordChangeModal | 회원탈퇴Modal | 환불신청Modal | 다운로드ConfirmDialog |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| backdrop rgba | `rgba(15,23,42,0.4)` | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.45)` |
| zIndex | 80 | 1000 | 1000 | 1000 | 1000 | 1000 |
| backdrop padding | 24 | 20 | 20 | 20 | 20 | 20 |
| 흰박스 radius | `var(--ph-radius-xl)` | `var(--ph-radius-xl)` | `var(--ph-radius-xl)` | `var(--ph-radius-xl)` | `var(--ph-radius-xl)` | `var(--ph-radius-xl)` |
| 흰박스 padding | 32 | 28 | 28 | 28 | 28 | 28 |
| maxWidth | 420 | 440 | 440 | 400 | 420 | 420 |
| 흰박스 border | 1px solid ph-border | 없음 | 없음 | 없음 | 없음 | 없음 |
| maxHeight/overflow | 92vh / auto | 없음 | 없음 | 없음 | 없음 | 없음 |
| 닫기 X 버튼 | O (lucide X) | O (lucide X) | O (인라인 SVG) | **없음** | **없음** | **없음** |
| role="dialog" | 없음 | O | O | O | O | O |
| aria-modal | 없음 | O | O | O | O | O |
| 배경 클릭 닫힘 | O | O | O | O | O | O |
| 헤더 아이콘원형 | 없음 (로고) | O (44×44) | O (44×44) | O (52×52) | O (44×44) | O (44×44) |

### 3-3. ModalShell 추출 가능 여부 판단

**일부 중복 — ModalShell 추출 권장**

공통 구조:
```
backdrop (fixed, rgba, flex center) 
  └─ 흰 박스 (bg:#fff, radius:xl, padding:28, maxWidth:420)
       ├─ role="dialog" aria-modal="true"
       ├─ 배경 클릭 닫힘 (stopPropagation)
       └─ [선택] 헤더: 아이콘원형 + 닫기 X 버튼
```

차이점:
- `LoginModal`: zIndex 80 (다른 것들은 1000), 흰박스에 border, maxHeight+overflow 필요 → `LoginModal`은 ModalShell에 흡수하기 위해 추가 props 필요
- 닫기 X 버튼: ConfirmDialog 3개(탈퇴/환불/다운로드)는 X 버튼 없음 → ModalShell에서 `showCloseButton` prop으로 제어 가능
- 헤더 아이콘원형 vs 로고: `headerType?: 'icon' | 'logo'` prop으로 분기 가능

예상 ModalShell 인터페이스:
```typescript
interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;          // 기본 420
  padding?: number;           // 기본 28
  zIndex?: number;            // 기본 1000
  showCloseButton?: boolean;  // 기본 true
  showBorder?: boolean;       // 기본 false (LoginModal만 true)
  maxHeight?: string;         // LoginModal용
}
```

---

## 4. 기타 중복 패턴

### 4-1. 인라인 UI 컴포넌트 중복

#### Button 컴포넌트

가장 광범위하게 중복된 패턴. 각 파일에 `variant: 'solid' | 'secondary'`, `size: 'sm' | 'md' | 'lg'`, hover 상태 관리 등 거의 동일한 구조로 반복 정의됨.

| 파일 | 라인 | 주요 차이 |
|------|------|-----------|
| `app/mypage/page.tsx` | 118~176 | `style` prop 있음, `fullWidth` prop 있음 |
| `app/detail/[id]/page.tsx` | 96~148 | `fullWidth` prop 있음, `size`는 'lg'만 |
| `app/sell/page.tsx` | 29~91 | `type` prop 있음, `fullWidth` 있음, `style` 있음 |
| `app/shop/page.tsx` | 54~108 | `fullWidth` 있음, `style` prop 없음 |
| `app/reader/[id]/page.tsx` | 161~218 | `style` prop 있음, `fullWidth` 있음 |
| `app/edit/[id]/page.tsx` | 51~105 | `type` prop 있음, `fullWidth` 없음, `style` 없음 |
| `app/apply/page.tsx` | 62~116 | `type` prop 있음, `fullWidth` 없음, `style` 없음 |

**마크업 구조 핵심 비교**:
- 모두 `hovered` state + `onMouseEnter/Leave` 패턴
- sizes 객체 (`sm: {}, md: {}, lg: {}`) 구조 동일
- `solid` variant: `var(--ph-primary)` bg → hover: `var(--ph-blue-hover)`
- `secondary` variant: `transparent` bg → hover: `var(--ph-gray-100)`
- sell.tsx만 solid의 disabled 처리가 미묘하게 다름 (`disabled ? 'var(--ph-primary)' : hovered ? ...` — disabled 때 hover 색상 적용 안 되는 버그 가능성)

#### Card 컴포넌트

| 파일 | 라인 | 주요 차이 |
|------|------|-----------|
| `app/mypage/page.tsx` | 90~115 | `onClick` prop 있음 |
| `app/detail/[id]/page.tsx` | 152~174 | 기본형 |
| `app/sell/page.tsx` | 149~174 | `boxSizing: 'border-box'` 추가 |
| `app/reader/[id]/page.tsx` | 144~157 | `backgroundColor` (camelCase 차이), `boxSizing: 'border-box'` |
| `app/edit/[id]/page.tsx` | 107~132 | `boxSizing: 'border-box'` |
| `app/apply/page.tsx` | 170~193 | `boxSizing: 'border-box'` |

모두 `background: var(--ph-surface), border: 1px solid var(--ph-border), borderRadius: var(--ph-radius-lg), padding` 구조. 약 95% 일치.

#### Tag/카테고리 선택 버튼 컴포넌트

| 파일 | 라인 | 비고 |
|------|------|------|
| `app/sell/page.tsx` | 178~209 | `Tag` 함수 정의 |
| `app/edit/[id]/page.tsx` | 136~167 | `Tag` 함수 정의 (동일) |
| `app/apply/page.tsx` | 196~228 | `Tag` 함수 정의 (동일) |
| `app/browse/page.tsx` | 34~65 | `Tag` 함수 정의 (동일, `backgroundColor` 키워드 사용) |

4개 모두 `selected` boolean prop + 동일한 스타일 계산 로직. 마크업 90% 이상 일치.

#### Label 컴포넌트 (폼 라벨 + hint)

| 파일 | 라인 |
|------|------|
| `app/sell/page.tsx` | 213~219 |
| `app/edit/[id]/page.tsx` | 214~221 |
| `app/apply/page.tsx` | 232~239 |

3개 완전 동일 (`children + hint` props, `flex + alignItems:baseline + justifyContent:space-between`).

#### Input 컴포넌트 (focus-border 입력창)

`FormField.tsx`의 input 모드와 동일한 패턴이 2개 페이지에 인라인으로 중복 정의됨:

| 파일 | 라인 | 비고 |
|------|------|------|
| `app/sell/page.tsx` | 95~147 | `Input` 함수 정의, `leading` prop |
| `app/apply/page.tsx` | 120~166 | `Input` 함수 정의, `leading` prop (동일) |
| `components/ui/FormField.tsx` | 62~96 | 공유 컴포넌트로 존재, input 모드 |

`sell/page.tsx`와 `apply/page.tsx`의 `Input`은 `FormField`의 input 모드와 마크업이 95% 일치. `maxLength`, `inputMode` prop이 없다는 차이만 존재.

#### PHInput 컴포넌트 (label + input 조합)

| 파일 | 라인 | 비고 |
|------|------|------|
| `app/mypage/page.tsx` | 180~226 | `PHInput` 함수 정의 |
| `components/modals/EmailChangeModal.tsx` | 60~64 (`inputBase` style만) | 직접 `<input>` 사용 |

`PHInput`은 label + input 조합이며 `FormField` (type="input")과 유사하나 focus-border 효과 없음. `FormField`로 대체 가능.

#### Avatar 컴포넌트

| 파일 | 라인 | 비고 |
|------|------|------|
| `app/detail/[id]/page.tsx` | 178~199 | 이니셜 2글자, `name.slice(0,2)` |
| `app/reader/[id]/page.tsx` | 102~119 | 이니셜 단어 첫글자, `toUpperCase()` |
| `app/apply/page.tsx` | 29~58 | reader와 동일한 로직 + `overflow: hidden` 추가 |

3개 모두 원형 div에 이니셜 텍스트. 이니셜 추출 로직만 미묘하게 다름.

#### Badge 컴포넌트

| 파일 | 라인 | tone 지원 |
|------|------|-----------|
| `app/detail/[id]/page.tsx` | 65~92 | `'neutral' | 'blue'`, soft 여부 |
| `app/reader/[id]/page.tsx` | 123~140 | `'blue' | 'neutral'` (단순형) |
| `app/edit/[id]/page.tsx` | 170~210 | `'blue' | 'neutral'`, soft 여부 |

#### won() 헬퍼 함수

| 파일 | 라인 |
|------|------|
| `app/mypage/page.tsx` | 52 |
| `app/checkout/page.tsx` | 11 |
| `app/detail/[id]/page.tsx` | 203 |
| `app/shop/page.tsx` | 49 |
| `components/ui/PromptCard.tsx` | 45 |
| `components/ui/PaymentTable.tsx` | 25 |

6개 파일에 `function won(n: number) { return '₩' + n.toLocaleString('ko-KR'); }` 완전 동일 함수 중복.

#### 에러 메시지 박스 패턴

`background: #fff1f1` 또는 `#fef2f2`, `border: 1px solid #fecaca`, `color: var(--ph-error)` 조합:

| 파일 | 라인 | 비고 |
|------|------|------|
| `components/modals/LoginModal.tsx` | 192~195 | `fontSize:13`, `var(--ph-error)`, `#fff1f1` bg |
| `app/checkout/page.tsx` | 229~241 | `fontSize:13`, `#dc2626`, `#fef2f2` bg |
| `app/apply/page.tsx` | 531~533 | `fontSize:14`, `var(--ph-error)`, `#fff1f1` bg |

색상 변수 사용이 일부 다름 (`var(--ph-error)` vs `#dc2626`).

#### 로딩/빈 상태 텍스트 패턴

| 파일 | 라인 | 내용 |
|------|------|------|
| `app/mypage/page.tsx` | 507~511 | "불러오는 중..." (center, muted) |
| `app/checkout/page.tsx` | 99~104 | "불러오는 중..." (center, muted) |
| `app/reader/[id]/page.tsx` | 326~332 | "불러오는 중..." (100vh flex center) |
| `app/edit/[id]/page.tsx` | 471~476 | "불러오는 중..." (center, muted) |
| `app/detail/[id]/page.tsx` | 583 | "불러오는 중..." (center, muted) |

5개 파일에 동일한 로딩 텍스트. 스타일은 유사하나 구조가 조금씩 다름.

#### 에러 상태 (찾을 수 없음) 패턴

| 파일 | 라인 | 내용 |
|------|------|------|
| `app/detail/[id]/page.tsx` | 585~597 | 텍스트 + 돌아가기 버튼 |
| `app/edit/[id]/page.tsx` | 479~491 | 텍스트 + 돌아가기 버튼 |
| `app/checkout/page.tsx` | 77~95 | 텍스트 + 뒤로 가기 버튼 |

3개 모두 `textAlign:center` + 설명 텍스트 + 액션 버튼 구조.

#### ICON_MAP (카테고리 아이콘 매핑)

| 파일 | 라인 |
|------|------|
| `app/detail/[id]/page.tsx` | 47~56 |
| `app/reader/[id]/page.tsx` | 49~57 |
| `components/ui/PromptCard.tsx` | 35~43 |
| `components/ui/ImageCarousel.tsx` | 9~18 |

4개 파일에 `ICON_MAP` Record 거의 동일하게 중복 (약간의 아이콘 가짓수 차이).

#### CATEGORIES 배열

| 파일 | 라인 | 항목 수 |
|------|------|---------|
| `app/sell/page.tsx` | 18~25 | 6개 (id+label+icon) |
| `app/edit/[id]/page.tsx` | 33~39 | 6개 (id+label만) |
| `app/apply/page.tsx` | 18~25 | 6개 (id+label만) |
| `app/reader/[id]/page.tsx` | 38~45 | 6개 (id+label만) |
| `app/browse/page.tsx` | 21~28 | 7개 ('all' 포함, id+label+icon+desc) |

---

## 5. 전체 중복 분류 요약표

| 컴포넌트·패턴 | 발견 위치 수 | 마크업 일치도 | 공통 props 추출 가능 | 분류 | 우선순위 |
|---------------|:-----------:|:-------------:|:-------------------:|:----:|:--------:|
| **Button** (variant/size/hover) | 7개 파일 | ~92% | O | 완전 중복 | P1 |
| **Card** (surface/border/radius) | 6개 파일 | ~95% | O | 완전 중복 | P1 |
| **ConfirmDialog** (backdrop+흰박스+아이콘+버튼쌍) | 3개 모달 | ~90% | O | 완전 중복 | P1 |
| **Tag** (카테고리 선택 버튼) | 4개 파일 | ~92% | O | 완전 중복 | P1 |
| **won()** 헬퍼 함수 | 6개 파일 | 100% | 해당없음 | 완전 중복 | P1 |
| **ICON_MAP** (카테고리 아이콘 Record) | 4개 파일 | ~85% | 해당없음 | 완전 중복 | P1 |
| **CATEGORIES** 배열 | 5개 파일 | ~80% | 해당없음 | 일부 중복 | P2 |
| **Label** (label+hint 폼 라벨) | 3개 파일 | 100% | O | 완전 중복 | P1 |
| **Input** (focus-border 입력창) vs FormField | 2+1개 파일 | ~95% | O | 완전 중복 | P2 |
| **ModalShell** (backdrop+흰박스 공통 껍데기) | 6개 모달 | ~75% | O | 일부 중복 | P2 |
| **Avatar** (이니셜 원형) | 3개 파일 | ~85% | O | 일부 중복 | P2 |
| **Badge** (tone/soft) | 3개 파일 | ~80% | O | 일부 중복 | P2 |
| **에러 메시지 박스** (red tint box) | 3개 파일 | ~80% | O | 일부 중복 | P3 |
| **PHInput** (label+input) vs FormField | 1+1개 | ~88% | O | 일부 중복 | P3 |
| **로딩 텍스트** ("불러오는 중...") | 5개 파일 | ~60% | O | 일부 중복 | P3 |
| **에러/빈 상태 화면** (텍스트+버튼) | 3개 파일 | ~65% | O | 일부 중복 | P3 |
| **PasswordChangeModal** (mypage 인라인) | 1개 | — | — | components/modals/로 이동 대상 | P2 |

---

## 6. 통합 권장 순서

### P1 — 즉시 추출 (완전 중복, 높은 효과)

1. **`won()` → `lib/utils.ts`** (또는 `lib/format.ts`)
   - 6개 파일에서 동일 함수 중복. 유틸 파일 하나에 export하고 모든 파일에서 import

2. **`ICON_MAP` → `lib/iconMap.ts`**
   - 4개 파일에서 거의 동일한 Record 반복. 공유 파일 하나로 추출

3. **`Button` → `components/ui/Button.tsx`**
   - 7개 파일의 인라인 Button을 공유 컴포넌트로 대체
   - 통합 props: `variant, size, fullWidth, disabled, type, onClick, children, style`
   - sell.tsx의 solid disabled 버그도 이때 수정 가능

4. **`Card` → `components/ui/Card.tsx`**
   - 6개 파일의 인라인 Card를 공유 컴포넌트로 대체
   - 통합 props: `padding, children, style, onClick`

5. **`Tag` → `components/ui/Tag.tsx`**
   - 4개 파일의 인라인 Tag를 공유 컴포넌트로 대체

6. **`Label` → `components/ui/Label.tsx`**
   - 3개 파일의 완전 동일 Label 컴포넌트 추출

7. **`ConfirmDialog` → `components/modals/ConfirmDialog.tsx`**
   - 3개 인스턴스 통합
   - shop.tsx의 인라인 컨펌 UI는 모달이 아니므로 제외

### P2 — 2순위 추출 (일부 중복, 중간 효과)

8. **`ModalShell` → `components/modals/ModalShell.tsx`**
   - EmailChangeModal, PasswordChangeModal, ConfirmDialog가 공통으로 사용 가능
   - LoginModal은 zIndex·border 차이로 별도 prop 필요

9. **`CATEGORIES` → `lib/categories.ts`**
   - 5개 파일에서 반복. 단, 파일마다 필요한 필드(icon, desc)가 달라 가장 큰 버전으로 통합하고 각 파일에서 필요 필드만 사용

10. **`PasswordChangeModal` → `components/modals/PasswordChangeModal.tsx`**
    - mypage/page.tsx 인라인에서 EmailChangeModal처럼 modals/ 폴더로 이동

11. **`Avatar` → `components/ui/Avatar.tsx`**
    - 3개 파일 통합. 이니셜 추출 로직을 통일 (reader 방식 권장)

12. **`Input` (focus-border) → `FormField` 활용 확대**
    - sell.tsx, apply.tsx의 인라인 `Input`을 `FormField`로 대체

### P3 — 3순위 (선택적 추출)

13. **`ErrorBox` → `components/ui/ErrorBox.tsx`**
    - 에러 메시지 박스 패턴 (`#fff1f1` red tint) 3개 파일 통합
    - 색상 변수 불일치(`var(--ph-error)` vs `#dc2626`) 이때 정규화

14. **`LoadingScreen` / `EmptyScreen`**
    - 로딩 텍스트와 에러/빈 상태 화면을 경량 컴포넌트로 추출
    - 5개 파일의 "불러오는 중..." 패턴

15. **`Badge` 통합**
    - detail/reader/edit 3개 파일의 인라인 Badge를 `components/ui/Badge.tsx`로

---

## 부록: 파일별 인라인 정의 목록

| 파일 | 인라인 정의 컴포넌트/함수 |
|------|--------------------------|
| `app/mypage/page.tsx` | Switch, Row, Card, Button, PHInput, EmptyState, SectionTitle, PasswordChangeModal, won() |
| `app/detail/[id]/page.tsx` | Button, Card, Badge, Avatar, Thumb, PriceTag, CircleBtn, Icon, won() |
| `app/sell/page.tsx` | Button, Card, Input, Tag, Label |
| `app/shop/page.tsx` | Button, won() |
| `app/reader/[id]/page.tsx` | Button, Card, Badge, Avatar, ConfirmDialog, won() |
| `app/edit/[id]/page.tsx` | Button, Card, Tag, Badge, Label |
| `app/apply/page.tsx` | Button, Card, Input, Tag, Label, Avatar |
| `app/browse/page.tsx` | Tag |
| `app/checkout/page.tsx` | won() |
