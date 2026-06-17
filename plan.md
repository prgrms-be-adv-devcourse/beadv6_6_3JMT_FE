# PromptHub 구현 플랜

각 단계를 순서대로 AI에게 지시하면 됨.
MSW Mock API(`NEXT_PUBLIC_API_MOCKING=enabled`)로 동작 확인 후 다음 단계로 진행.

API 명세: `docs/api-spec.md`
전환 방법: `.env.local`에서 `NEXT_PUBLIC_API_MOCKING=disabled`로 변경 → 실제 백엔드로 전환

---

## Phase 1. 이메일 로그인/회원가입/로그아웃 API 연결 ✅ 완료

**현재 상황**: `LoginModal.tsx`가 이메일로 역할만 추측하고 있음. 실제 API 호출 없음.

```
components/modals/LoginModal.tsx 의 이메일 로그인/회원가입을 실제 API로 연결해줘.

- 로그인: POST /api/v1/auth/login { email, password }
- 회원가입: POST /api/v1/auth/signup { name, email, password }
- 응답에서 { user, token } 꺼내서 useAuthStore.login(user, token) 호출
- NEXT_PUBLIC_API_MOCKING=enabled 일 때만 하단 데모 계정 안내 배너 표시

components/layout/Header.tsx 의 로그아웃도 연결해줘.
- POST /api/v1/auth/logout 호출 후 logout() 실행
- API 실패해도 로컬 로그아웃은 반드시 실행
```

---

## Phase 2. 판매자 신청 API 연결 ✅ 완료

**현재 상황**: `apply/page.tsx`가 `setDone(true)`만 하고 API 안 씀. 새로고침 시 신청 상태 초기화됨.

```
app/apply/page.tsx 를 실제 API로 연결해줘.

- 페이지 마운트 시 GET /api/v1/sellers/apply-status 호출
  → status가 pending/approved/rejected 면 바로 완료 화면 표시
- submit 버튼 클릭 시 POST /api/v1/seller 호출
  body: { selectedCategories, introduction, portfolioLink, agreedToTerms }
- 성공 시 setDone(true)
```

---

## Phase 3. 찜 API 연결 (서버 동기화) ✅ 완료

**현재 상황**: `useWishStore`가 localStorage만 씀. 로그인해도 서버 찜 목록과 불일치.

```
찜 기능을 서버와 동기화해줘.

1. 로그인 성공 직후 GET /api/v1/wishlists 호출하여 useWishStore 초기화
   - useAuthStore 의 login() 직후 또는 app/layout.tsx 에서 처리

2. app/detail/[id]/page.tsx 의 찜 버튼 핸들러에 낙관적 업데이트 패턴 적용
   - 찜 추가: 즉시 UI 업데이트 → POST /api/v1/wishlists { productId } → wishlistId 저장 → 실패 시 롤백
   - 찜 제거: 즉시 UI 업데이트 → DELETE /api/v1/wishlists/{wishlistId} → 실패 시 롤백
   - 상세 진입 시 GET /api/v1/wishlists/exists?productId={id} 호출 → 하트 초기 상태
```

---

## Phase 4. 알림 API 연결 ✅ 완료

**현재 상황**: `Header.tsx` 알림 드롭다운이 하드코딩 배열 사용 중.

```
components/layout/Header.tsx 의 알림 드롭다운을 실제 API로 연결해줘.

- 로그인 상태일 때 GET /api/v1/notifications 호출하여 목록 표시
- 알림 아이템 클릭 시 POST /api/v1/notifications/{id}/read 호출
- 읽지 않은 알림 수 뱃지 표시 (read: false 개수)
```

---

## Phase 5. 상품 등록 API 연결 ✅ 완료

**현재 상황**: `sell/page.tsx`의 등록 버튼이 `/shop`으로 리다이렉트만 하고 API 미호출.

```
app/sell/page.tsx 를 실제 API로 연결해줘.

- 등록 버튼 → POST /api/v1/product 호출
  body: { title, category, model, price: Number(price), desc, content }
  (현재 body textarea 값을 desc와 content 양쪽에 매핑)
- 성공 시 /shop 으로 이동
- 실패 시 에러 토스트 표시

이미지 업로드는 이번 단계에서 제외 (백엔드 업로드 API 없음)
```

---

## Phase 6. 상품 수정/삭제 API 연결 ✅ 완료 (재수정: 판매중단 UI 유지 & 검수중 상태 반영)

**현재 상황**: `edit/[id]/page.tsx`가 하드코딩 PROMPTS 배열에서 데이터 로드. 저장 시 API 미호출.

```
app/edit/[id]/page.tsx 를 실제 API로 연결해줘.

- 페이지 마운트 시 GET /api/v1/product/{id} 호출하여 폼 초기값 세팅
  (현재 하드코딩 PROMPTS 배열 제거)
- 저장 버튼 → PUT /api/v1/product/{id} 호출
  body: { title, category, model, price, desc, content }

app/shop/page.tsx 의 삭제 버튼도 연결해줘.
- DELETE /api/v1/product/{id} 호출
- 성공 시 목록에서 해당 상품 제거
```

---

## Phase 7. 주문/결제 페이지 구현 ✅ 완료 (PG 미포함 — Toss 연동은 Phase 11)

> 보완: POST /api/v1/payments/confirm MSW 핸들러 추가 (결제+주문 단일 호출). checkout 페이지는 이 엔드포인트를 호출하며 productIds를 number[]로 변환하여 전송.

**현재 상황**: Header 장바구니 "결제하기" 버튼이 드롭다운만 닫음. 결제 페이지 없음.

```
장바구니 결제 흐름을 구현해줘.

1. app/checkout/page.tsx 신규 생성
   - useCartStore.items 목록과 총 금액 표시
   - "주문하기" 버튼 → POST /api/v1/payments/confirm { productIds: cart.map(i => i.id) }
   - 성공 시 clearCart() 호출 후 /mypage 로 이동

2. components/layout/Header.tsx 의 장바구니 "결제하기" 버튼에 router.push('/checkout') 연결

3. middleware.ts 의 AUTH_REQUIRED 배열에 '/checkout' 추가
```

---

## Phase 8. 마이페이지 완성 ✅ 완료

**현재 상황**: 프로필 수정 저장 버튼이 API 미호출. reader 페이지가 하드코딩 데이터 사용.

```
app/mypage/page.tsx 설정 탭의 프로필 수정을 API로 연결해줘.
- 저장 버튼 → PUT /api/v1/users/me { name, email }
- 성공 시 useAuthStore.login(updatedUser, currentToken) 재호출로 스토어 갱신
- 구매 내역: GET /api/v1/order
- 찜 목록: GET /api/v1/wishlists

app/reader/[id]/page.tsx 의 하드코딩 MOCK_PURCHASED 데이터를 실제 API로 교체해줘.
- GET /api/v1/order 호출 후 현재 id에 해당하는 주문 찾기
- 해당 주문이 없으면 /mypage 로 리다이렉트

app/shop/page.tsx 에 판매자 결제 내역 탭 구현해줘.
- GET /api/v1/sellers/me/payments 호출
- status 필터 (paid / requested / refunded) UI 추가
```

---

## Phase 9. 어드민 대시보드 UI 구현

**전제**: 메인 서비스 구현 완료 후 진행. `PromptHub admin dashboard.html` 파일 참고.

```
PromptHub admin dashboard.html 을 보고 Next.js로 이식해줘.

라우트 구조:
- /admin           → 대시보드 홈 (KPI 카드, 차트)
- /admin/users     → 전체 유저 목록
- /admin/products  → 상품 목록 (승인/거절)
- /admin/sellers   → 판매자 신청 목록 (승인/거절)
- /admin/orders    → 주문 목록 (환불 처리)
- /admin/payments  → 정산 내역

규칙:
- 원본 HTML의 디자인을 픽셀 단위로 보존 (색상/간격/레이아웃)
- MSW Mock API로 먼저 구현 (데이터는 임시 하드코딩 허용)
- middleware.ts 에 /admin 경로 보호 추가 (role === 'admin' 체크)
- User 타입과 useAuthStore에 'admin' 역할 추가
```

---

## Phase 10. 어드민 대시보드 API 연결

**전제**: Phase 9 완료 후 진행. 아래 API는 백엔드 개발자에게 추가 요청 필요.

```
어드민 대시보드 각 페이지를 실제 API로 연결해줘.
docs/api-spec.md 에 어드민 API 명세가 추가되면 그 기준으로 연결할 것.

현재 필요한 엔드포인트 목록 (백엔드 팀에 요청):
GET  /api/v1/admin/stats
GET  /api/v1/admin/users
PUT  /api/v1/admin/users/:id
GET  /api/v1/admin/products
PUT  /api/v1/admin/products/:id/approve
PUT  /api/v1/admin/products/:id/reject
GET  /api/v1/admin/sellers/applies
PUT  /api/v1/admin/sellers/:id/approve
PUT  /api/v1/admin/sellers/:id/reject
GET  /api/v1/admin/orders
PUT  /api/v1/admin/orders/:id/refund
GET  /api/v1/admin/payments
```

---

## Phase 11. Toss Payments PG 연동

**전제**: Phase 7 완료 후 진행. 현재는 POST /api/v1/payments/confirm 직접 호출로 즉시 결제 처리 중.

```
app/checkout/page.tsx 에 Toss Payments 결제 위젯을 연동해줘.

실제 PG 연동 흐름:
1. @tosspayments/tosspayments-sdk 설치
2. app/checkout/page.tsx 에서 loadTossPayments()로 결제 위젯 렌더링
3. 결제 완료 후 /checkout/success?orderId=...&paymentKey=...&amount=... 콜백
4. app/checkout/success/page.tsx 에서 POST /api/v1/payments/confirm 호출
   body: { orderId, paymentKey, amount }
5. 성공 시 clearCart() → /mypage 이동
6. app/checkout/fail/page.tsx — 실패 처리

백엔드 개발자에게 요청:
- POST /api/v1/payments/confirm (Toss 서버 결제 승인 처리)
- TOSS_CLIENT_KEY (프론트용 클라이언트 키)
```

---

## 백엔드 개발자에게 요청할 정보

| 항목 | 내용 |
|------|------|
| `NEXT_PUBLIC_API_URL` | 실제 백엔드 서버 URL |
| `NEXT_PUBLIC_KAKAO_CLIENT_ID` | 카카오 앱 **JavaScript 키** |
| 카카오 Redirect URI 등록 | `https://{도메인}/auth/kakao/callback` |
| JWT 만료 시간 | 현재 프론트 쿠키 max-age 24시간 (맞춰야 함) |
| Refresh Token 사용 여부 | 사용 시 lib/api.ts 인터셉터 추가 필요 |
| 파일 업로드 API | sell 페이지 썸네일 업로드용 |
| CORS 허용 출처 | `http://localhost:3000` (개발) + 배포 도메인 |

---

## 알아야 할 것

- **MSW → 실제 API 전환**: `.env.local`에서 `NEXT_PUBLIC_API_MOCKING=disabled`로 변경만으로 완료
- **API 응답 형식 계약**: 모든 응답은 `{ success, data, message }` 형식 필요 (백엔드와 맞춰야 함)
- **페이지네이션 meta 필드명**: `page`, `size`, `total`, `hasNext` 일치 필요
