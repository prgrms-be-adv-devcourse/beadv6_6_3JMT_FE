# 셀러 정산 도우미 프론트엔드 설계

## 목표

`/shop`의 `내 상품`과 `정산 내역` 양쪽 탭에서 항상 접근할 수 있는 셀러 전용 AI 정산 도우미를 제공한다. 첨부된 `preview.html`의 시각적 방향을 유지하면서, `ai-service`의 비동기 run 및 SSE 계약과 실제로 연동한다.

현재 범위는 월·주 단위 정산 분석과 지급 상태 조회까지다. 주문 단위 분석, CSV 다운로드, 어드민용 확장, role 기반 응답 확장은 포함하지 않는다.

## 결정 사항

- 챗봇은 `/shop` 전용 UI로 구현한다.
- API·SSE 코드는 UI와 분리해 추후 다른 화면에서 재사용할 수 있게 한다.
- 버튼은 두 탭에서 항상 표시한다.
- PC에서는 탭 영역 오른쪽의 `AI 정산 도우미` 버튼과 420px 우측 패널을 사용한다.
- 모바일에서는 우측 하단 원형 버튼과 전체 화면 패널을 사용한다.
- 탭 전환이나 패널 닫기로 진행 중인 run을 취소하지 않는다.
- 대화 원본은 Redis의 24시간 보관 데이터를 사용하며 프론트 로컬스토리지에 복제하지 않는다.
- 답변 생성 중에는 입력창과 추천 질문을 비활성화한다.
- SSE 연결 끊김은 1회 자동 재연결하고, 이후에는 사용자가 누르는 재시도 버튼을 제공한다.

## 사용자 경험

### 최초 진입과 복원

챗봇 버튼을 처음 열 때 `GET /api/v2/ai/settlement/conversations/current`를 호출한다. 저장된 대화가 있으면 시간순으로 표시하고, `activeRunId`가 있으면 해당 run의 SSE에 다시 연결한다. 저장된 대화가 없으면 안내 문구와 추천 질문을 표시한다.

### 질문과 답변

추천 질문 또는 입력창은 동일한 질문 등록 함수를 사용한다. 질문을 등록하면 `POST /api/v2/ai/settlement/conversations/current/messages`의 `202 Accepted` 응답에서 `runId`를 얻고 SSE를 구독한다.

진행 단계는 내부 enum 대신 다음 셀러용 문구로 표시한다.

| 서버 단계 | 화면 문구 |
|---|---|
| `ANALYZING` | 질문을 분석하고 있어요 |
| `FETCHING_DATA` | 정산 데이터를 확인하고 있어요 |
| `GENERATING_ANSWER` | 답변을 정리하고 있어요 |

`delta` 이벤트는 현재 답변에 순서대로 붙이고, `done.answer`가 도착하면 최종 답변으로 교체한다. 답변은 줄바꿈을 보존하되 HTML로 실행하지 않는다.

### 추천 질문

- 이번 달 정산 요약
- 지난달과 이번 달 정산 비교
- 이번 달 주간별 정산 분석
- 이번 달 지급 상태 확인

추천 질문은 각각 다음 도구 사용을 유도한다.

- `get_settlement_summary`
- `compare_settlement_periods`
- `get_weekly_settlement_breakdown`
- `get_payout_status`

### 닫기와 탭 전환

`SettlementChat`은 탭 조건부 렌더링 바깥에 한 번만 배치한다. 따라서 `내 상품`과 `정산 내역`을 바꿔도 컴포넌트와 SSE 연결이 유지된다. 패널을 닫아도 run은 계속 진행하며, 다시 열면 현재 진행 상태 또는 완료 답변을 보여준다.

## API와 인증

| Method | Path | 용도 |
|---|---|---|
| `GET` | `/api/v2/ai/settlement/conversations/current` | 최근 24시간 대화와 active run 복원 |
| `POST` | `/api/v2/ai/settlement/conversations/current/messages` | 질문 등록 및 run 시작 |
| `GET` | `/api/v2/ai/settlement/runs/{runId}/events` | run SSE 구독 |

REST 호출은 기존 Axios 인증 인스턴스를 사용한다. 프론트는 운영 환경에서 `X-User-Id`나 role을 직접 지정하지 않고 Bearer 토큰만 보낸다. Gateway가 JWT를 검증하고 `X-User-Id`를 내부 요청에 전달한다.

SSE는 `EventSource` 대신 `fetch`와 `ReadableStream`을 사용한다. 현재 인증이 Bearer 헤더 기반이고 브라우저의 기본 `EventSource`는 임의의 `Authorization` 헤더를 설정할 수 없기 때문이다.

SSE 이벤트 계약은 다음과 같다.

| event | 처리 |
|---|---|
| `snapshot` | 복원된 run의 상태와 단계 반영 |
| `progress` | 진행 문구 변경 |
| `delta` | 스트리밍 답변 조각 추가 |
| `done` | 최종 답변 확정 및 입력 재활성화 |
| `failed` | 오류 안내 및 입력 재활성화 |
| `cancelled` | 실행 취소 안내 및 입력 재활성화 |
| comment heartbeat | 화면 변경 없이 연결 유지 |

최초 연결만 `delta`를 받는다. 재연결 후에는 현재 `snapshot`을 표시하고 terminal `done`의 전체 답변으로 복구한다.

## 오류 처리

| 상태 | 화면 처리 |
|---|---|
| `400` | 질문 내용을 확인해 달라는 인라인 안내 |
| `401` | 기존 Axios 토큰 갱신 흐름을 거친 뒤 SSE 1회 재연결 |
| `403` | 셀러 권한이 필요하다는 안내 |
| `409` | 현재 대화를 다시 조회하고 기존 `activeRunId`에 연결 |
| `429` | 사용량이 많다는 안내 후 입력 재활성화 |
| `503`, `AI_CHAT_DISABLED` | 준비 중 안내와 입력 비활성화 |
| 네트워크/SSE 종료 | 1회 자동 재연결 후 수동 재시도 버튼 |

## 컴포넌트와 파일 책임

```text
app/shop/_components/settlement-chat/
├── SettlementChat.tsx
├── SettlementChatTrigger.tsx
├── SettlementChatPanel.tsx
├── SettlementChatMessages.tsx
├── SettlementChatComposer.tsx
├── useSettlementChat.ts
├── settlementChatState.ts
└── types.ts

lib/
├── settlementChat.ts
└── settlementChatSse.ts
```

- `SettlementChat.tsx`: 열림 상태와 기능 훅을 조립하고 Trigger·Panel을 연결한다.
- `SettlementChatTrigger.tsx`: PC 탭 영역 버튼과 모바일 플로팅 형태를 담당한다.
- `SettlementChatPanel.tsx`: 패널 헤더, 메시지 영역, 입력 영역을 조립한다.
- `SettlementChatMessages.tsx`: 기존 메시지, 추천 질문, 진행 상태, 재시도 UI를 렌더링한다.
- `SettlementChatComposer.tsx`: 최대 2,000자 질문 입력과 전송 제어를 담당한다.
- `useSettlementChat.ts`: 대화 복원, 질문 등록, SSE 연결·종료·재연결을 오케스트레이션한다.
- `settlementChatState.ts`: 테스트 가능한 순수 상태 전이를 제공한다.
- `types.ts`: `/shop` UI 전용 상태와 props 타입을 정의한다.
- `lib/settlementChat.ts`: REST DTO와 Axios 호출을 제공한다.
- `lib/settlementChatSse.ts`: SSE block 파싱과 인증 fetch 스트림을 제공한다.

## 접근성

- 트리거에 `aria-expanded`와 `aria-controls`를 연결한다.
- 패널에 명확한 이름을 제공한다.
- 패널을 열면 입력창으로 포커스를 이동한다.
- `Escape`로 닫고 트리거로 포커스를 돌려준다.
- 메시지 및 진행 상태 영역에 `aria-live="polite"`를 적용한다.
- `prefers-reduced-motion`에서는 패널 전환과 스피너 애니메이션을 제거한다.
- 모바일 전체 화면에서도 닫기 버튼을 키보드로 사용할 수 있게 한다.

## 검증 범위

테스트 범위는 상태와 스트리밍 계약처럼 회귀 위험이 큰 순수 로직에 집중한다.

- SSE 이벤트 block 파싱
- `progress → delta → done` 상태 전이
- 실행 중 중복 질문 방지
- `activeRunId` 복원 후 재연결
- TypeScript 빌드와 ESLint
- PC·모바일 수동 화면 확인

React UI 전체를 광범위한 컴포넌트 테스트로 감싸거나 새 테스트 프레임워크를 도입하지 않는다.

## 제외 범위

- 주문 단위 분석
- CSV 파일 생성·다운로드
- role별 프롬프트 또는 응답 확장
- 어드민용 챗봇 화면
- 프론트 로컬스토리지 대화 저장
- 대화 삭제 및 개별 run 취소 UI
