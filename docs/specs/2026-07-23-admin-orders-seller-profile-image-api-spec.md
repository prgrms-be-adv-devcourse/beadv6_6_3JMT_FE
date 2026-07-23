# GET /api/v2/admin/orders — SellerSummary에 profileImageUrl 필드 추가 요청

- 작성일: 2026-07-23
- 담당: order-service
- 배경: `/admin/orders`(주문 관리) 테이블의 판매자 컬럼이 아바타를 표시한다. 프론트에서 주문마다 `GET /sellers/product?sellerId=`를 병렬 호출해 이미지를 채우는 방식을 검토했으나, 페이지당 주문 수만큼 N+1 호출이 발생해 채택하지 않았다. `admin/orders` 응답 자체가 필요한 데이터를 다 내려주는 게 맞다.

## 결정 사항

- `AdminOrderListResponse.sellers`(`SellerSummary`)에 `profileImageUrl: String?` 필드를 추가한다.
- User 서비스가 갖고 있는 프로필 이미지를 order-service가 조회(내부 gRPC 등, 기존 `sellerNickname` 조합 경로와 동일한 방식)해 함께 내려준다.
- 이미지가 없는 판매자는 `profileImageUrl: null` (에러 아님, `sellers/product` 스펙과 동일한 관례).

## 변경 전/후 응답 비교

### 변경 전 (현재)

```json
{
  "sellerId": "3f2b6c1a-9d4e-4b8a-9c3f-1a2b3c4d5e6f",
  "sellerNickname": "김철수",
  "productCount": 2,
  "orderAmount": 34000
}
```

### 변경 후 (요청)

```json
{
  "sellerId": "3f2b6c1a-9d4e-4b8a-9c3f-1a2b3c4d5e6f",
  "sellerNickname": "김철수",
  "profileImageUrl": "https://.../profile.png",
  "productCount": 2,
  "orderAmount": 34000
}
```

## 프론트 반영

- `types/api/orders.ts`의 `AdminOrderSellerSummary`에 `profileImageUrl: string | null`을 이미 추가해 둠.
- `app/admin/orders/page.tsx`는 `order.sellers[0]?.profileImageUrl`을 그대로 `Identity`의 `imageUrl`로 전달한다(추가 API 호출 없음). 필드가 아직 내려오지 않는 동안은 `undefined`로 처리돼 기존 이니셜 아바타로 자연스럽게 fallback된다.

## 범위 밖

- 구매자(`AdminOrderBuyer`)의 프로필 이미지는 이번 스펙 대상이 아니다 — 주문 관리 화면에서 구매자 컬럼은 아바타 없이 이름만 표시하기로 별도 결정됨.
