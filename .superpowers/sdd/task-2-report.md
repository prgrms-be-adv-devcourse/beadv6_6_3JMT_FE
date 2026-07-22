# Task 2 Report — Checkout Outcome and Failure Contracts

## Status

DONE

## Files changed

- `lib/checkoutContracts.test.ts`
- `lib/checkoutContracts.ts`

## TDD execution

### RED

Added the specified failing tests first in `lib/checkoutContracts.test.ts`, then ran:

```bash
node --experimental-strip-types --test lib/checkoutContracts.test.ts
```

Observed failure:

```text
TAP version 13
# file:///Users/chan/Desktop/gongbu/programmers/beadv6_6_3JMT_FE/lib/checkoutContracts.test.ts:5
#   CheckoutStageError,
#   ^^^^^^^^^^^^^^^^^^
# SyntaxError: The requested module './checkoutContracts.ts' does not provide an export named 'CheckoutStageError'
...
not ok 1 - lib/checkoutContracts.test.ts
...
# fail 1
```

This is the expected RED: the new contract exports did not exist yet.

### GREEN

Implemented the minimal contract additions in `lib/checkoutContracts.ts`:

- exported `CheckoutStage`, `CheckoutFailure`, `CheckoutStageError`
- exported `shouldRequestPayment(totalAmount)`
- exported `normalizeCheckoutFailure(error, fallbackStage)`
- preserved `preparePaidOrder<TPayment, TOrder>(options)` and its ordering / missing-client-key behavior while tagging failures with checkout stages
- avoided any Axios runtime dependency by using structural object inspection only

The first GREEN attempt exposed a Node strip-types runtime limitation:

```text
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property is not supported in strip-only mode
```

Root cause: the `CheckoutStageError` constructor used TypeScript parameter properties, which Node's `--experimental-strip-types` runner does not execute.

Minimal fix: rewrote the class to explicit fields plus constructor assignments, keeping the same API and behavior.

Re-ran:

```bash
node --experimental-strip-types --test lib/checkoutContracts.test.ts
```

Observed passing output:

```text
TAP version 13
ok 1 - shouldRequestPayment skips zero and requests Toss for a positive amount
ok 2 - preparePaidOrder rejects a missing client key before creating an order
ok 3 - preparePaidOrder rejects SDK load failure before creating an order
ok 4 - preparePaidOrder loads the SDK before creating an order
ok 5 - preparePaidOrder reuses an existing payment instance
ok 6 - preparePaidOrder identifies order API failures as order_creation
ok 7 - normalizeCheckoutFailure preserves a payment request stage and server details
ok 8 - normalizeCheckoutFailure keeps a readable fallback for network errors
ok 9 - normalizeCheckoutFailure maps a message-less 503 to a service message
1..9
# pass 9
# fail 0
```

## Verification

- Ran `node --experimental-strip-types --test lib/checkoutContracts.test.ts`
- Ran `git diff --check -- lib/checkoutContracts.ts lib/checkoutContracts.test.ts .superpowers/sdd/task-2-report.md`

## Self-review

- Confirmed `preparePaidOrder` still keeps the generic `<TPayment, TOrder>` API.
- Confirmed missing `clientKey` still rejects before SDK load and before order creation.
- Confirmed SDK load still happens before order creation when `paymentInstance` is absent.
- Confirmed existing payment instances are reused without calling `loadPayments`.
- Confirmed structured failure normalization preserves stage, HTTP status, server code, and preferred message precedence.
- Confirmed no Axios import or runtime dependency was added.

## Commit

- Attempted commit message: `fix: frontend 체크아웃 결과 및 실패 계약 추가`

## Concerns

- The focused test passes, but Node still emits the pre-existing `MODULE_TYPELESS_PACKAGE_JSON` warning for this test file because the package does not declare `"type": "module"`. This warning did not affect the task outcome, and I left package metadata unchanged because it is outside the requested scope.
