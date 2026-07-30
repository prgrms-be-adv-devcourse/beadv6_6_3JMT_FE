# 알림 SSE HTTP 500 재연결 중단 설계

## 배경

로그인 사용자의 Header는 `GET /api/v1/notifications/stream`으로 알림 SSE를
연결한다. 현재 프론트 스트림 클라이언트는 HTTP `500`을 포함한 모든 `5xx`
응답을 일시 장애로 판단한다. 연결이 `500`으로 즉시 종료되면 기본 1초 간격의
재연결 루프가 계속되어 브라우저와 서버에 불필요한 요청이 누적된다.

이번 변경의 목적은 HTTP `500 Internal Server Error`를 재시도 불가능한 오류로
분류하여 해당 스트림 실행을 종료하는 것이다.

## 범위

다음 변경만 포함한다.

- 프론트 SSE 오류 분류 정책 변경
- HTTP `500` 무재시도 동작을 고정하는 단위 테스트
- 기존 일시 장애 재시도 테스트의 의미를 명확히 유지

다음 항목은 변경하지 않는다.

- Notification Service, API Gateway 및 Vercel 설정
- SSE 요청 URL과 인증 헤더
- SSE 이벤트 파싱과 `Last-Event-ID` 처리
- Header 알림 상태와 사용자 인터페이스
- 기본 재연결 대기 시간

## 오류 분류 정책

`NotificationStreamHttpError`의 상태 코드에 따라 다음과 같이 처리한다.

| 오류 | 처리 |
|---|---|
| `408 Request Timeout` | 재시도 |
| `429 Too Many Requests` | 재시도 |
| `502 Bad Gateway` | 재시도 |
| `503 Service Unavailable` | 재시도 |
| `504 Gateway Timeout` | 재시도 |
| `500 Internal Server Error` | 즉시 종료 |
| 그 밖의 HTTP 상태 오류 | 즉시 종료 |
| HTTP 응답이 없는 네트워크·스트림 오류 | 기존처럼 재시도 |
| 명시적인 `AbortSignal` 취소 | 즉시 정상 종료 |

일시 장애 상태는 명시적인 허용 목록으로 관리한다. `status >= 500`처럼 범위로
판단하지 않아 `500`과 향후 알 수 없는 서버 오류가 자동 재시도 대상으로
편입되지 않게 한다.

## 실행 흐름

1. `Header`가 로그인 사용자와 토큰을 확인하고 `streamNotifications`를 한 번
   실행한다.
2. `consumeNotificationStreamOnce`가 HTTP 오류를
   `NotificationStreamHttpError`로 변환한다.
3. `streamNotifications`가 오류 분류 함수를 호출한다.
4. `408`, `429`, `502`, `503`, `504` 또는 HTTP 응답 없는 연결 오류라면 기존
   대기 후 같은 스트림 실행에서 재연결한다.
5. `500` 또는 그 밖의 비재시도 HTTP 오류라면 예외를 호출자에게 전달하고
   `while` 루프를 종료한다.
6. `Header`의 기존 최종 `catch`가 오류를 사용자에게 반복 안내하지 않고
   소비한다.

HTTP `500`으로 종료된 스트림은 같은 `Header` 생명주기 안에서 자동으로 다시
시작하지 않는다. 페이지 새로고침, 재로그인 또는 사용자·토큰 변경으로
`Header` effect가 다시 실행될 때 새 스트림을 생성한다. 이는 반복 요청을
중단하려는 이번 변경의 의도된 결과다.

## 파일별 책임

### `lib/notificationSse.ts`

- 재시도 가능한 HTTP 상태를 명시적인 집합으로 정의한다.
- 기존 `shouldRetryStream`가 이 집합을 사용하도록 변경한다.
- 스트림 소비, 파싱, 재연결 대기 및 abort 처리 구조는 유지한다.

### `lib/notificationSse.test.ts`

- HTTP `500` 응답이 발생했을 때 fetch가 정확히 한 번만 호출되고
  `NotificationStreamHttpError`가 호출자에게 전달되는지 검증한다.
- HTTP `503`이 발생했을 때 재연결하는 기존 테스트를 유지한다.
- 기존 인증 오류, `Last-Event-ID`, SSE 파싱 테스트를 회귀 검증한다.

## 테스트 전략

단위 테스트는 실제 네트워크 대신 주입 가능한 `fetcher`를 사용한다.

- `500` 테스트:
  - fetcher가 항상 `500` 응답을 반환한다.
  - `streamNotifications`가 reject되는지 확인한다.
  - 오류가 `NotificationStreamHttpError`이고 상태가 `500`인지 확인한다.
  - 호출 횟수가 `1`인지 확인한다.
- `503` 회귀 테스트:
  - 첫 요청은 `503`, 두 번째 요청은 abort와 정상 응답을 반환한다.
  - 호출 횟수가 `2`인지 확인한다.
- 전체 프론트 단위 테스트와 lint를 실행해 계약 및 정적 분석 회귀를 확인한다.

## 완료 조건

- HTTP `500` 응답 한 번 뒤 같은 스트림 실행에서 추가 요청이 발생하지 않는다.
- `408`, `429`, `502`, `503`, `504`는 재시도 가능한 상태로 남는다.
- 네트워크 오류와 정상적인 연결 종료의 기존 재연결 동작을 유지한다.
- 인증 오류와 명시적인 abort의 기존 종료 동작을 유지한다.
- 백엔드, Gateway, Vercel 설정 파일에는 변경이 없다.
