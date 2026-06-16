# /store 디렉토리 규칙

## 상태 관리 원칙
- Zustand 사용
- 스토어는 기능 단위로 분리
- store/useAuthStore.ts — 로그인 유저 정보, 역할(buyer/seller)
- store/useCartStore.ts — 장바구니
- store/useWishStore.ts — 찜 목록

## 스토어 구조 원칙
- 각 스토어는 상태 + 액션을 함께 정의
- persist 미들웨어로 localStorage에 저장 (token, role, cart)
- 다른 작업은 하지 마
