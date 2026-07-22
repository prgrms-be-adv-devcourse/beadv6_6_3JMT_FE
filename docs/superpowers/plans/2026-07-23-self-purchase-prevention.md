# Self Purchase Prevention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent sellers from purchasing their own products in the frontend while preserving backend error handling as the final defense.

**Architecture:** Add a small pure policy module that compares the authenticated user ID with line-item seller IDs. Preserve `sellerId` through direct-buy and cart models, then apply the policy in the detail and checkout client components.

**Tech Stack:** Next.js 16.2.9 App Router, React 19, TypeScript, Zustand, Node test runner

## Global Constraints

- Keep the existing `CheckoutContent` and `Suspense` structure.
- Do not block legacy items whose `sellerId` is missing; the backend remains authoritative.
- Use the copy `본인 상품은 구매할 수 없어요` consistently.
- Do not change the order request contract.

---

### Task 1: Self-purchase policy and seller data preservation

**Files:**

- Create: `lib/purchasePolicy.ts`
- Create: `lib/purchasePolicy.test.ts`
- Modify: `lib/cartAdapters.ts`
- Modify: `lib/cart.test.ts`
- Modify: `store/useCartStore.ts`
- Modify: `store/useDirectBuyStore.ts`

**Interfaces:**

- Consumes: `userId: string | null | undefined`, items containing `sellerId?: string`
- Produces: `isSelfPurchase(userId, sellerId)` and `hasSelfPurchaseItem(userId, items)`

- [x] Write failing policy and cart mapping tests for matching, non-matching, missing, and multi-item seller IDs.
- [x] Run `node --test lib/purchasePolicy.test.ts lib/cart.test.ts` and confirm the missing API/data causes failure.
- [x] Add the pure policy functions and preserve optional `sellerId` in cart/direct-buy types and adapters.
- [x] Run the focused tests and confirm they pass.

### Task 2: Detail and checkout guards

**Files:**

- Modify: `app/detail/[id]/page.tsx`
- Modify: `app/checkout/page.tsx`
- Verify: `lib/checkoutContracts.test.ts`

**Interfaces:**

- Consumes: policy functions from Task 1 and existing backend error normalization
- Produces: disabled self-purchase actions and visible explanatory copy

- [x] Confirm the existing checkout contract test preserves backend error messages.
- [x] Add detail click/disabled guards and propagate `sellerId` into the direct-buy store.
- [x] Add checkout item detection, error banner, click guard, and button disabled state.
- [x] Run the focused tests and confirm they pass.

### Task 3: Regression verification

**Files:**

- Verify: all modified files

**Interfaces:**

- Consumes: completed Tasks 1-2
- Produces: verified frontend behavior without an order API contract change

- [x] Run all Node tests with `node --test lib/*.test.ts`.
- [x] Run changed-file lint; record the repository-wide pre-existing lint failures separately.
- [x] Run `npm run build`.
- [x] Run `git diff --check` and inspect the final diff for scope and sensitive data.
