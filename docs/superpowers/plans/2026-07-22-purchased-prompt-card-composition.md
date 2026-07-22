# Purchased Prompt Card Composition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 구매 주문에 상품 배치 정보와 판매자 이름을 조합해 마이페이지 구매 카드의 제목·썸네일·모델·가격·평점·판매 수·유형·판매자명을 완성한다.

**Architecture:** `app/mypage/page.tsx`는 주문 → 상품 → 판매자 API 호출 순서와 상태 갱신만 담당한다. 데이터 결합 규칙은 `lib/orderAdapters.ts`의 순수 함수로 분리해 단위 테스트하며, 각 연동 실패 시 확보한 데이터까지 사용해 기존 카드를 유지한다.

**Tech Stack:** Next.js 16.2.9 App Router, React 19.2.4, TypeScript, axios, `node:test`, `node:assert/strict`

## Global Constraints

- 상품 배치 요청과 판매자 배치 요청은 기존 `splitUniqueIds`를 사용해 요청당 최대 30개로 나눈다.
- 주문 식별자, 주문 상품 식별자, 구매일, 다운로드 여부, 환불 가능 여부는 주문 응답 값을 유지한다.
- 상품 조회 실패 시 기존 주문 카드, 판매자 조회 실패 시 상품 정보와 기존 판매자 fallback을 표시한다.
- 카드 UI와 마이페이지의 다른 탭은 변경하지 않는다.
- 기존 어드민 관련 미커밋 파일은 수정하거나 stage하지 않는다.

---

### Task 1: 구매 카드 조합 함수

**Files:**
- Modify: `lib/orderAdapters.ts`
- Test: `lib/orderAdapters.test.ts`

**Interfaces:**
- Consumes: `ProductByIdsItem[]`, `Record<string, string | null>`
- Produces: `composePurchasedPrompts(prompts, products, sellerNames): PurchasedPrompt[]`

- [ ] **Step 1: 조합 규칙의 실패 테스트 작성**

`lib/orderAdapters.test.ts`의 import에 `composePurchasedPrompts`를 추가하고 다음 테스트를 덧붙인다.

```ts
test('composePurchasedPrompts enriches cards with product and seller data', () => {
  const prompt = mapOrderToPrompt({
    orderId: 'order-1',
    orderProductId: 'order-product-1',
    productId: 'product-1',
    orderStatus: 'COMPLETED',
    orderProductStatus: 'PAID',
    downloaded: true,
    isRefundable: false,
    productType: 'PROMPT',
    title: '주문 시점 제목',
    model: null,
    rating: null,
    paidAt: '2026-07-22T10:00:00',
    createdAt: '2026-07-22T09:50:00',
    product: null,
  })

  assert.ok(prompt)

  const [card] = composePurchasedPrompts(
    [prompt],
    [{
      productId: 'product-1',
      sellerId: 'seller-1',
      title: '최신 상품 제목',
      amount: 12000,
      thumbnailUrl: '/prompt.png',
      productType: 'IMAGE',
      model: 'GPT-5',
      salesCount: 31,
      averageRating: 4.8,
      status: 'ON_SALE',
    }],
    { 'seller-1': '판매자 이름' },
  )

  assert.deepEqual(card, {
    ...prompt,
    title: '최신 상품 제목',
    amount: 12000,
    thumbnail_url: '/prompt.png',
    productType: 'IMAGE',
    model: 'GPT-5',
    rating: 4.8,
    salesCount: 31,
    sellerId: 'seller-1',
    seller: '판매자 이름',
  })
  assert.equal(card.orderId, 'order-1')
  assert.equal(card.orderProductId, 'order-product-1')
  assert.equal(card.downloaded, true)
  assert.equal(card.isRefundable, false)
})

test('composePurchasedPrompts keeps order fallback for missing product and seller', () => {
  const prompt = mapOrderToPrompt({
    orderId: 'order-1',
    productId: 'product-1',
    downloaded: false,
    isRefundable: true,
    orderStatus: 'COMPLETED',
    orderProductStatus: 'PAID',
    productType: 'PROMPT',
    title: '기존 제목',
    model: null,
    rating: null,
    paidAt: '2026-07-22T10:00:00',
    createdAt: '2026-07-22T09:50:00',
    product: null,
  })

  assert.ok(prompt)
  assert.deepEqual(composePurchasedPrompts([prompt], [], {}), [prompt])

  const [card] = composePurchasedPrompts(
    [prompt],
    [{
      productId: 'product-1',
      sellerId: 'missing-seller',
      title: '최신 제목',
      amount: 1000,
      thumbnailUrl: null,
      productType: 'PROMPT',
      model: 'Claude',
      salesCount: 1,
      averageRating: 5,
      status: 'ON_SALE',
    }],
    { 'missing-seller': null },
  )

  assert.equal(card.seller, 'PromptHub')
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --experimental-strip-types --test lib/orderAdapters.test.ts`

Expected: FAIL because `composePurchasedPrompts` is not exported.

- [ ] **Step 3: 최소 조합 함수 구현**

`lib/orderAdapters.ts`에 상품 타입 import와 조합 타입·함수를 추가한다.

```ts
import type { ProductByIdsItem } from './products.ts'

export type PurchasedPrompt = PromptLike & {
  sellerId?: string
}

export function composePurchasedPrompts(
  prompts: PurchasedPrompt[],
  products: ProductByIdsItem[],
  sellerNames: Record<string, string | null>,
): PurchasedPrompt[] {
  const productById = new Map(products.map((product) => [product.productId, product]))

  return prompts.map((prompt) => {
    const product = productById.get(prompt.id)
    if (!product) return prompt

    return {
      ...prompt,
      title: product.title,
      productType: product.productType,
      model: normalizeModel(product.model),
      amount: product.amount,
      rating: product.averageRating,
      salesCount: product.salesCount,
      seller: sellerNames[product.sellerId] ?? prompt.seller,
      sellerId: product.sellerId,
      thumbnail_url: product.thumbnailUrl,
    }
  })
}
```

- [ ] **Step 4: 조합 테스트 통과 확인**

Run: `node --experimental-strip-types --test lib/orderAdapters.test.ts`

Expected: all tests PASS.

- [ ] **Step 5: 조합 함수 변경 커밋**

```bash
git add lib/orderAdapters.ts lib/orderAdapters.test.ts
git commit -m "feat: 구매 카드 상품 데이터 조합 추가"
```

### Task 2: 구매 상품 판매자 API와 페이지 연결

**Files:**
- Modify: `lib/sellers.ts`
- Modify: `app/mypage/page.tsx`

**Interfaces:**
- Consumes: `getProductsForOrders(productIds): Promise<ProductByIdsItem[]>`, `composePurchasedPrompts(...)`
- Produces: `getOrderProductSellerNames(sellerIds): Promise<Record<string, string | null>>`

- [ ] **Step 1: 판매자 배치 helper를 경로 기반으로 일반화**

`lib/sellers.ts`의 내부 helper를 다음 형태로 바꾸고 기존 공개 함수의 계약은 유지한다.

```ts
type SellerNamesPath = 'sellers/products' | 'sellers/wishlists' | 'users/order-products'

async function getSellerNamesByPath(
  sellerIds: string[],
  path: SellerNamesPath,
): Promise<Record<string, string | null>> {
  const chunks = splitUniqueIds(sellerIds)
  if (chunks.length === 0) return {}

  const responses = await Promise.all(
    chunks.map((sellerIdsChunk) =>
      api.post<{ success: boolean; data: { sellers: SellerBatchItem[] }; message: string }>(
        `${API_BASE}/${path}`,
        { sellerIds: sellerIdsChunk },
      ),
    ),
  )

  const names: Record<string, string | null> = {}
  responses.forEach((res) => {
    res.data.data.sellers.forEach((seller) => {
      names[seller.sellerId] = seller.sellerName
    })
  })
  return names
}

export function getSellerNames(sellerIds: string[]): Promise<Record<string, string | null>> {
  return getSellerNamesByPath(sellerIds, 'sellers/products')
}

export function getWishlistSellerNames(
  sellerIds: string[],
): Promise<Record<string, string | null>> {
  return getSellerNamesByPath(sellerIds, 'sellers/wishlists')
}

export function getOrderProductSellerNames(
  sellerIds: string[],
): Promise<Record<string, string | null>> {
  return getSellerNamesByPath(sellerIds, 'users/order-products')
}
```

- [ ] **Step 2: 구매 탭 호출 흐름 연결**

`app/mypage/page.tsx`에서 import를 다음처럼 변경한다.

```ts
import type { ProductByIdsItem } from '@/lib/products'
import { getOrderProductSellerNames, getWishlistSellerNames } from '@/lib/sellers'
import { composePurchasedPrompts, mapOrderToPrompt } from '@/lib/orderAdapters'
```

구매 목록 로딩 블록을 다음 흐름으로 교체한다.

```ts
getOrders()
  .then(async (orders) => {
    const prompts = orders.map(mapOrderToPrompt).filter((item): item is Prompt => item !== null)

    let products: ProductByIdsItem[] = []
    try {
      products = await getProductsForOrders(prompts.map((prompt) => prompt.id))
    } catch {
      setPurchased(prompts)
      return
    }

    let sellerNames: Record<string, string | null> = {}
    try {
      sellerNames = await getOrderProductSellerNames(products.map((product) => product.sellerId))
    } catch {
      // 판매자 조회 실패는 상품 정보 반영을 막지 않는다.
    }

    setPurchased(composePurchasedPrompts(prompts, products, sellerNames))
  })
  .catch(() => {})
  .finally(() => {
    setLoadingPurchased(false)
    setLoadingPayments(false)
  })
```

- [ ] **Step 3: 관련 단위 테스트 실행**

Run: `node --experimental-strip-types --test lib/orderAdapters.test.ts lib/batchIds.test.ts`

Expected: all tests PASS.

- [ ] **Step 4: 정적 검사 실행**

Run: `npm run lint -- --quiet`

Expected: exit code 0.

- [ ] **Step 5: production build 실행**

Run: `npm run build`

Expected: Next.js build succeeds with exit code 0.

- [ ] **Step 6: 구현 변경 커밋**

```bash
git add app/mypage/page.tsx lib/sellers.ts
git commit -m "feat: 구매 카드 판매자 정보 연동"
```

### Task 3: 최종 변경 범위 검증

**Files:**
- Verify: `app/mypage/page.tsx`
- Verify: `lib/sellers.ts`
- Verify: `lib/orderAdapters.ts`
- Verify: `lib/orderAdapters.test.ts`

**Interfaces:**
- Consumes: Task 1과 Task 2의 완료된 구현
- Produces: 구매 탭 관련 파일만 포함한 검증 결과

- [ ] **Step 1: 전체 구매 카드 관련 테스트 재실행**

Run: `node --experimental-strip-types --test lib/orderAdapters.test.ts lib/batchIds.test.ts lib/wishlistComposition.test.ts`

Expected: all tests PASS.

- [ ] **Step 2: diff 오류와 변경 범위 확인**

Run: `git diff --check HEAD~2..HEAD`

Expected: no output.

Run: `git show --stat --oneline HEAD~2..HEAD`

Expected: 설계 문서를 제외한 구현 변경은 `app/mypage/page.tsx`, `lib/sellers.ts`, `lib/orderAdapters.ts`, `lib/orderAdapters.test.ts`에만 존재한다.

- [ ] **Step 3: 기존 사용자 변경 보존 확인**

Run: `git status --short`

Expected: 기존 어드민 관련 미커밋 파일은 그대로 남아 있고 구매 탭 구현 파일에는 미커밋 변경이 없다.
