# PATCH /api/v2/admin/users/{userId}/role — 회원 유형(role) 변경 API 스펙

- 작성일: 2026-07-21
- 배경: `/admin/users`(회원 관리) 페이지에서 관리자가 회원의 `role`(구매자/판매자)을 변경하는 기능. 기존에는 `PUT /api/v2/admin/users/{userId}`로 정의돼 있었으나, role 단일 필드만 바꾸는 부분 수정이라 PUT의 "리소스 전체 교체" 시맨틱과 맞지 않아 PATCH로 재정의한다.

## 결정 사항

- **메서드**: PATCH (PUT 아님) — role 하나만 바꾸는 부분 수정이고, 이 엔드포인트는 앞으로도 role 전용으로 유지한다 (다른 필드 추가 계획 없음).
- **경로**: `/role` 서브 리소스로 분리 — 같은 파일의 `PATCH /admin/users/{userId}/status`와 동일한 패턴. 계정 상태(status) 변경과 유형(role) 변경을 각자 독립된 엔드포인트로 둔다.
- **응답**: 변경된 필드만 lean하게 반환 — 프론트가 응답 body를 화면 갱신에 쓰지 않고 로컬 state로 직접 반영하므로, 안 쓰는 필드(name/email/status)를 굳이 돌려줄 이유가 없다.

## 엔드포인트

```
PATCH /api/v2/admin/users/{userId}/role
```

### 인증

관리자 인증 필요 (다른 `/admin/*` 엔드포인트와 동일).

### 요청

```json
{ "role": "seller" }
```

- `role`: `"buyer" | "seller"` (필수)

### 응답 (200)

```json
{
  "success": true,
  "data": {
    "id": "userId",
    "role": "seller",
    "updatedAt": "2026-07-21T10:00:00Z"
  },
  "message": "역할이 변경되었습니다."
}
```

## 관련 엔드포인트

- `PATCH /api/v2/admin/users/{userId}/status` — 계정 상태(active/suspended/withdrawn) 변경. 별개 엔드포인트, 이번 스펙과 body/응답 형태만 대응.
