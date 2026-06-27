import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'

import { useCartStore } from './useCartStore.ts'

const localItem = {
  id: 'product-1',
  productId: 'product-1',
  cartProductId: 'product-1',
  title: 'Prompt',
  amount: 1000,
  thumbnailUrl: null,
}

const serverItem = {
  ...localItem,
  cartProductId: 'cart-1',
}

beforeEach(() => {
  useCartStore.setState({ items: [] })
})

test('upsertItem replaces a local cart item with the server cart item for the same product', () => {
  const { addItem, upsertItem } = useCartStore.getState()

  addItem(localItem)
  upsertItem(serverItem)

  assert.deepEqual(useCartStore.getState().items, [serverItem])
})

test('addItem does not duplicate the same product', () => {
  const { addItem } = useCartStore.getState()

  addItem(localItem)
  addItem({ ...localItem, cartProductId: 'cart-duplicate' })

  assert.deepEqual(useCartStore.getState().items, [localItem])
})

test('removeItem removes by the current cartProductId after server reconciliation', () => {
  const { addItem, removeItem, upsertItem } = useCartStore.getState()

  addItem(localItem)
  upsertItem(serverItem)
  removeItem('cart-1')

  assert.deepEqual(useCartStore.getState().items, [])
})
