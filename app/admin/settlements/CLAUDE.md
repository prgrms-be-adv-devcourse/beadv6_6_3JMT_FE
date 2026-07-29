# app/admin/settlements — 정산 관리

## 역할

- 판매자·월 단위 정산 집계 목록을 표시한다.
- 월별 행을 펼쳐 주간 정산과 가능한 관리자 액션을 표시한다.
- 액션 노출은 프론트 상태표가 아니라 백엔드 `availableActions`를 기준으로 한다.
- 월 필터를 목록과 요약 카드에 함께 적용한다.

## 구조

- `page.tsx`는 정산 화면 컴포넌트만 조합한다.
- `_components/AdminSettlementsView.tsx`가 필터, 목록, 상세 캐시와 관리자 액션 상태를 관리한다.
- 기존 `/admin/payments`는 호환을 위한 `/admin/settlements` 리다이렉트만 제공한다.
- `layout.tsx`와 `_components/AdminSettlementTabs.tsx`는 정산 내역과 전달 관리 하위 탭을 제공한다.
- `deliveries/page.tsx`는 서비스 간 정산 전달 운영 화면을 조합한다.
- `deliveries/_components/AdminSettlementDeliveriesView.tsx`가 전달 상태 필터, ID 검색, 상세 펼침, 재시도 및 재시도 중 폴링을 관리한다.

## 주의 사항

- 월별 합계는 백엔드 응답값을 사용하고 주간 행을 프론트에서 다시 합산하지 않는다.
- 상태 전이 후 현재 월 상세, 월별 목록, 요약 카드를 다시 조회한다.
- 취소는 확인 다이얼로그를 거친다.
- `settlement-service`의 배치 API는 기능 플래그로 켜는 로컬 검증 전용이므로 관리자 UI에 노출하지 않는다.
- 전달 재시도 노출은 백엔드 `availableActions`의 `RETRY`와 `retryInProgress`를 함께 따른다.
- 전달 장애 배지는 `DELIVERY_FAILED + MISMATCH` 합계이며, 재시도 요청 후 공용 이벤트로 갱신한다.
- 전달 재시도 중인 행이 있으면 3초 간격으로 목록과 요약을 갱신한다.
