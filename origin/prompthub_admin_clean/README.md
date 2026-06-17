# PromptHub 관리자 콘솔 — 정리본

원본 단일 HTML 번들을 Claude Code가 메뉴별로 읽기 쉽게 분리한 비교 기준 프로젝트입니다.

## 메뉴별 파일

- `admin-login-page.js`: 관리자 로그인
- `dashboard-page.js`: 관리자 대시보드
- `users-page.js`: 사용자 관리
- `seller-applications-page.js`: 판매자 신청 관리
- `product-review-page.js`: 상품 검수
- `settlements-page.js`: 정산 관리
- `shared-admin-ui.js`: 사이드바, 상단바, 공통 UI
- `admin-app.js`: 상태와 화면 라우팅
- `mock-data.js`: 목업 데이터
- `design-system.js`: 공통 디자인 시스템
- `main.js`: 앱 시작점

## 토큰 절약

Claude Code에는 전체 원본 HTML을 읽히지 말고, 이 폴더의 디렉터리 구조를 먼저 확인한 뒤 해당 메뉴 파일만 읽히세요. `assets/fonts` 내부 파일은 읽지 않도록 지시하세요.
