# Notification Service API

**Base:** `/api/v1/notifications`

## 공통 사항

- 외부 인증과 토큰 검증은 API Gateway가 담당한다.
- Gateway가 주입한 `X-User-Id` 헤더를 수신자 식별자로 사용한다.
- 아래 JSON의 날짜·시간은 ISO-8601 UTC 기준 예시다.
- 일반 성공 응답은 `ApiResult` envelope를 사용한다.
- 목록 응답은 `PageResponse` envelope를 사용한다.
- Notification API는 요청 body를 사용하지 않는다. 필터·페이지 정보는 query parameter로 전달한다.

## Enum

### `category`

`ORDER`, `PAYMENT`, `REFUND`, `PRODUCT`, `SYSTEM`, `MARKETING`

### `type`

`ORDER_CREATED`, `ORDER_PAID`, `ORDER_PAYMENT_FAILED`, `ORDER_EXPIRED`, `ORDER_REFUND_REQUESTED`, `ORDER_PARTIALLY_REFUNDED`, `ORDER_REFUNDED`, `ORDER_REFUND_FAILED`

---

## GET `/api/v1/notifications` - 알림 목록 조회

- 인증: 필요
- 필수 헤더: `X-User-Id: UUID`
- 정렬: 최신 생성 시각순
- 만료되지 않은 알림만 조회한다.

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---|---|:---:|:---:|---|
| `category` | Enum | N | - | 알림 카테고리 필터 |
| `page` | Integer | N | `1` | 1부터 시작하는 페이지 번호. 1보다 작으면 1로 보정 |
| `size` | Integer | N | `20` | 페이지 크기. 1~100 범위로 보정 |

예: `/api/v1/notifications?category=ORDER&page=1&size=20`

### Request

```http
GET /api/v1/notifications?category=ORDER&page=1&size=20 HTTP/1.1
X-User-Id: 7c2f6e91-2c1b-4a3b-9f99-3f527f7d1234
```

Request body는 없다.

### Response `200 OK`

| 필드 | 타입 | 설명 |
|---|---|---|
| `success` | Boolean | 성공 여부 |
| `data[]` | NotificationResponse[] | 알림 목록 |
| `data[].notificationId` | UUID | 알림 ID |
| `data[].type` | String Enum | 알림 유형 |
| `data[].category` | String Enum | 알림 카테고리 |
| `data[].title` | String | 알림 제목 |
| `data[].content` | String | 알림 내용 |
| `data[].linkUrl` | String \| null | 클릭 시 이동할 URL |
| `data[].reference` | Object | 연관 리소스 정보 |
| `data[].reference.type` | String \| null | 연관 리소스 유형 |
| `data[].reference.id` | UUID \| null | 연관 리소스 ID |
| `data[].read` | Boolean | 읽음 여부 |
| `data[].readAt` | DateTime \| null | 읽은 시각 |
| `data[].occurredAt` | DateTime | 알림이 발생한 시각 |
| `data[].createdAt` | DateTime | 알림이 생성된 시각 |
| `message` | String | 성공 시 `success` |
| `meta.page` | Integer | 현재 페이지 |
| `meta.size` | Integer | 적용된 페이지 크기 |
| `meta.total` | Long | 전체 알림 수 |
| `meta.hasNext` | Boolean | 다음 페이지 존재 여부 |

```json
{
  "success": true,
  "data": [
    {
      "notificationId": "9f1c2a7e-4b8d-4e2a-9c11-2d3e4f5a1111",
      "type": "ORDER_PAID",
      "category": "ORDER",
      "title": "주문 결제가 완료되었습니다.",
      "content": "면접 준비 프롬프트 주문 결제가 완료되었습니다.",
      "linkUrl": "/orders/9f1c2a7e-4b8d-4e2a-9c11-2d3e4f5a2222",
      "reference": {
        "type": "ORDER",
        "id": "9f1c2a7e-4b8d-4e2a-9c11-2d3e4f5a2222"
      },
      "read": false,
      "readAt": null,
      "occurredAt": "2026-07-28T09:30:00Z",
      "createdAt": "2026-07-28T09:30:01Z"
    }
  ],
  "message": "success",
  "meta": {
    "page": 1,
    "size": 20,
    "total": 1,
    "hasNext": false
  }
}
```

---

## GET `/api/v1/notifications/unread-count` - 읽지 않은 알림 개수 조회

### Request

```http
GET /api/v1/notifications/unread-count HTTP/1.1
X-User-Id: 7c2f6e91-2c1b-4a3b-9f99-3f527f7d1234
```

Request body는 없다.

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  },
  "message": "success"
}
```

---

## GET `/api/v1/notifications/stream` - 실시간 알림 SSE 연결

- 인증: 필요
- 필수 헤더: `X-User-Id: UUID`
- 응답 Content-Type: `text/event-stream`
- 선택 헤더: `Last-Event-ID: UUID`
- 동일 사용자당 최대 SSE 연결 수는 3개다.
- 최초 연결 시 `Last-Event-ID`가 없으면 replay 없이 연결한다.
- 재연결 시 `Last-Event-ID` 이후의 만료되지 않은 알림을 replay한다.

### Request

```http
GET /api/v1/notifications/stream HTTP/1.1
Accept: text/event-stream
X-User-Id: 7c2f6e91-2c1b-4a3b-9f99-3f527f7d1234
Last-Event-ID: 9f1c2a7e-4b8d-4e2a-9c11-2d3e4f5a1111
```

Request body는 없다. 최초 연결에서는 `Last-Event-ID`를 생략한다.

### `notification` event

서버가 새 알림을 전달하거나 재연결 후 누락 알림을 replay할 때 전송한다. `id`는 `notificationId`와 같다.

```text
event: notification
id: 72d95cb0-1835-49bf-8f08-2e0f1c4e4aaa
data: {"notificationId":"72d95cb0-1835-49bf-8f08-2e0f1c4e4aaa","type":"ORDER_PAID","title":"주문 결제가 완료되었습니다.","content":"면접 준비 프롬프트 주문 결제가 완료되었습니다.","unreadCount":3}
```

`data` JSON 구조:

```json
{
  "notificationId": "72d95cb0-1835-49bf-8f08-2e0f1c4e4aaa",
  "type": "ORDER_PAID",
  "title": "주문 결제가 완료되었습니다.",
  "content": "면접 준비 프롬프트 주문 결제가 완료되었습니다.",
  "unreadCount": 3
}
```

### `sync-required` event

마지막 이벤트 이후 누락된 알림이 100개를 초과하면 전송된다. 이 이벤트를 받으면 SSE 재연결보다 목록 API를 호출해 전체 목록을 동기화해야 한다.

```text
event: sync-required
data: {"code":"REPLAY_LIMIT_EXCEEDED","replayLimit":100}
```

```json
{
  "code": "REPLAY_LIMIT_EXCEEDED",
  "replayLimit": 100
}
```

---

## PATCH `/api/v1/notifications/{notificationId}/read` - 단건 알림 읽음 처리

### Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|:---:|---|
| `notificationId` | UUID | O | 읽음 처리할 알림 ID |

### Request

```http
PATCH /api/v1/notifications/9f1c2a7e-4b8d-4e2a-9c11-2d3e4f5a1111/read HTTP/1.1
X-User-Id: 7c2f6e91-2c1b-4a3b-9f99-3f527f7d1234
```

Request body는 없다.

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "notificationId": "9f1c2a7e-4b8d-4e2a-9c11-2d3e4f5a1111",
    "read": true,
    "readAt": "2026-07-28T09:35:00Z"
  },
  "message": "success"
}
```

---

## PATCH `/api/v1/notifications/read-all` - 전체 알림 읽음 처리

### Request

```http
PATCH /api/v1/notifications/read-all HTTP/1.1
X-User-Id: 7c2f6e91-2c1b-4a3b-9f99-3f527f7d1234
```

Request body는 없다.

### Response `200 OK`

```json
{
  "success": true,
  "data": {
    "updatedCount": 3,
    "readAt": "2026-07-28T09:36:00Z"
  },
  "message": "success"
}
```

---

## 주요 오류

오류 응답은 모든 Notification API에서 다음 envelope를 사용한다.

```json
{
  "success": false,
  "data": null,
  "message": "알림을 찾을 수 없습니다.",
  "code": "N001"
}
```

| Status Code | Error Code | 설명 |
|---:|---|---|
| 400 | `V001` | query parameter 또는 UUID 형식 등 입력값 오류 |
| 404 | `N001` | 알림이 없거나 현재 사용자의 알림이 아님 |
| 429 | `N002` | 사용자당 SSE 연결 한도 초과 |
| 500 | `SYS001` | 서버 내부 오류 |
