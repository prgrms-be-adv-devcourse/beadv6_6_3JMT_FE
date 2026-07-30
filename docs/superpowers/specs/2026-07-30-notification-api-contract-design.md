# Frontend 알림 API 계약 수정 설계

## 배경

배포된 Frontend의 Header는 공통 `API_BASE`인 `/api/v2` 뒤에
`/notifications`를 붙여 조회한다. Notification Service와 API Gateway는
알림 API를 `/api/v1/notifications`로만 제공하므로 실제 요청은 Gateway에서
404가 된다. Header가 이 오류를 무시해 사용자는 저장된 알림이 있어도
`새 알림이 없어요`만 보게 된다.

또한 기존 Header의 임시 알림 타입과 읽음 처리 메서드는 Backend 계약과 다르다.

- Frontend 임시 타입: `id`, `icon`, `text`, `timestamp`
- Backend 타입: `notificationId`, `type`, `category`, `title`, `content`,
  `linkUrl`, `reference`, `read`, `readAt`, `occurredAt`, `createdAt`
- Frontend 읽음 처리: `POST`
- Backend 읽음 처리: `PATCH`

## 목표

- Header의 알림 목록과 미읽음 개수를 Backend v1 계약으로 조회한다.
- 단건 및 전체 읽음 처리를 Backend HTTP 메서드와 응답 형식에 맞춘다.
- SSE로 신규 알림을 반영하고 재연결 시 `Last-Event-ID`를 사용한다.
- API 실패를 빈 목록으로 오인하지 않도록 사용자에게 조회 실패를 알린다.
- 최신 remote `main`의 다른 변경을 보존한다.

## 범위

### 포함

- 알림 목록 조회
- 미읽음 개수 조회
- 단건 읽음 처리
- 전체 읽음 처리
- Notification SSE 연결, 이벤트 파싱, 재연결 및 목록 동기화
- Header 알림 Dropdown의 Backend DTO 적용
- 관련 단위 테스트와 Frontend 정적 검증

### 제외

- 알림 단건·전체 삭제 UI
- 카테고리별 알림 수신 설정 UI
- Notification Service 또는 API Gateway 변경
- Header 외 별도 알림 센터 페이지

## 통합 전략

기존 로컬 `main`은 최신 remote `main`보다 뒤처져 있고 알림 구현 커밋 하나를
별도로 가진다. 기존 브랜치를 재작성하지 않고 최신 `origin/main`에서
`fix/notification-api-contract` 브랜치를 만든 뒤 알림 관련 변경만 적용한다.

이 방식은 최신 Frontend 변경을 보존하고 알림 수정의 diff를 독립적으로
검토할 수 있게 한다.

## 구성

### API 타입

`types/api/notifications.ts`에 다음 계약을 명시한다.

- `NotificationCategory`
- `NotificationType`
- `NotificationItem`
- `NotificationListResponse`
- `UnreadCountResponse`
- 단건·전체 읽음 응답
- `notification`, `sync-required` SSE 이벤트

Backend가 추가 유형을 먼저 배포해도 화면이 즉시 깨지지 않도록 표시용
`type`과 `category`는 알려진 enum 외 문자열도 받을 수 있게 한다.

### REST API 모듈

`lib/notifications.ts`는 공통 `/api/v2` 상수를 사용하지 않고
`/api/v1/notifications`를 전용 Base URL로 사용한다.

- `getNotifications`: `GET /api/v1/notifications`
- `getUnreadCount`: `GET /api/v1/notifications/unread-count`
- `markNotificationAsRead`:
  `PATCH /api/v1/notifications/{notificationId}/read`
- `markAllNotificationsAsRead`:
  `PATCH /api/v1/notifications/read-all`

페이지는 1부터, 크기는 1~100으로 보정한다. 인증은 기존 Axios 인스턴스가
Bearer token을 추가하고 Gateway가 `X-User-Id`를 주입하는 흐름을 유지한다.

### SSE 모듈

`lib/notificationSse.ts`는 `fetch` 기반으로
`GET /api/v1/notifications/stream`에 연결한다. 기본 `EventSource` 대신
`fetch`를 사용하는 이유는 Gateway 인증용 `Authorization` 헤더가 필요하기
때문이다.

- `Accept: text/event-stream`
- `Authorization: Bearer ...`
- 재연결 시 `Last-Event-ID`
- AbortSignal을 이용한 Header unmount 및 로그아웃 정리

SSE block parser는 heartbeat 주석을 무시하고 `notification`과
`sync-required`만 반환한다. 일시적인 연결 종료 후 마지막 이벤트 ID를
사용해 재연결한다. 인증 실패나 명시적인 abort에서는 재시도하지 않는다.

### Header 상태와 데이터 흐름

로그인 사용자가 생기면 목록과 미읽음 개수를 병렬 조회하고 SSE를 연결한다.

1. 초기 목록과 미읽음 개수를 조회한다.
2. `notification` 이벤트를 받으면 Backend가 준 `unreadCount`를 반영하고
   목록을 다시 조회해 완전한 `NotificationItem`을 확보한다.
3. `sync-required` 이벤트를 받으면 목록과 미읽음 개수를 모두 다시 조회한다.
4. 단건 읽음 성공 시 해당 항목을 읽음으로 표시하고 미읽음 수를 1 감소시킨다.
5. 전체 읽음 성공 시 현재 목록을 모두 읽음으로 표시하고 미읽음 수를 0으로
   변경한다.
6. 알림의 `linkUrl`이 있으면 읽음 처리 후 해당 경로로 이동한다.

목록과 미읽음 상태를 분리해 첫 페이지에 20개만 있어도 전체 미읽음 badge가
정확하도록 한다.

## 오류 처리

- 초기 목록 또는 미읽음 조회가 실패하면 알림이 없다고 처리하지 않고
  사용자에게 불러오기 실패를 안내한다.
- 단건·전체 읽음 요청이 실패하면 서버 목록을 다시 조회해 optimistic state를
  복구하고 실패를 안내한다.
- SSE 일시 오류는 자동 재연결하되 반복 Toast를 띄우지 않는다.
- 인증 오류와 로그아웃에 따른 abort는 재연결하지 않는다.

## 테스트

단위 테스트에서 다음 계약을 고정한다.

- 알림 API Base URL이 `/api/v1/notifications`다.
- 목록 query의 기본값과 page·size 보정이 Backend 규칙과 같다.
- SSE heartbeat는 무시한다.
- `notification`과 `sync-required` event를 올바르게 파싱한다.
- 잘못된 SSE JSON은 화면을 깨뜨리지 않고 무시한다.

Header 통합은 TypeScript와 Next build로 실제 DTO 필드와 컴포넌트 사용을
검증한다. 최종 검증은 관련 단위 테스트, ESLint, Next production build
순서로 수행한다.

## 완료 조건

- Gateway 로그에서 Header 요청이 `/api/v1/notifications`로 라우팅된다.
- 저장된 `ORDER_CREATED`와 `ORDER_PAID` 알림이 Dropdown에 표시된다.
- badge가 Backend 미읽음 개수와 일치한다.
- 단건·전체 읽음 요청이 `PATCH`로 성공한다.
- SSE 신규 알림과 재동기화가 목록에 반영된다.
- 관련 테스트, lint, build가 통과한다.
