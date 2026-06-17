# PromptHub 정리본

원본은 이미지, 폰트, React/Babel 라이브러리와 화면 코드를 Base64로 한 HTML 안에 묶은 오프라인 번들입니다.
정리본은 실행 코드는 유지하면서 파일을 역할별로 분리했습니다.

## 실행

`index.html`을 브라우저에서 열거나 VS Code Live Server로 실행합니다.

## 구조

- `index.html`: 문서 뼈대와 스크립트 로딩
- `assets/css/styles.css`: 공통 디자인 토큰 및 반응형 스타일
- `assets/js/app.js`: 라우팅과 최상위 앱
- `assets/js/home-page.js`: 홈 화면
- `assets/js/browse-page.js`: 탐색/검색 화면
- `assets/js/product-components.js`: 상품 카드·상세·판매자 정보
- `assets/js/seller-pages.js`: 판매자 등록·관리 화면
- `assets/js/mypage.js`: 마이페이지
- `assets/js/shared-layout.js`: 헤더 등 공통 레이아웃
- `assets/js/mock-data.js`: 목업 데이터
- `assets/js/version-history.js`: 상품 버전 관리 도우미
- `assets/js/design-system.js`: 디자인 시스템 번들
- `assets/js/base-components.jsx`: 공통 기반 컴포넌트
- `assets/js/react*.js`, `babel-standalone.min.js`, `lucide.js`: 외부 라이브러리
- `assets/img`: 이미지
- `assets/fonts`: 폰트

## 참고

이 정리본도 브라우저에서 Babel로 JSX를 변환하는 프로토타입 구조입니다. 실제 Next.js/React 프로젝트에 반영할 때는 화면별 컴포넌트만 가져가고 React/Babel 로컬 라이브러리는 복사하지 않는 편이 좋습니다.
