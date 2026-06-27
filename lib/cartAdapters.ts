export type CartItem = {
  id: string
  productId: string
  cartProductId: string
  title: string
  amount: number
  thumbnailUrl: string | null
}

type CartProductResponse = {
  id?: unknown
  productId?: unknown
  cartProductId?: unknown
  cartItemId?: unknown
  title?: unknown
  productTitle?: unknown
  amount?: unknown
  productAmount?: unknown
  thumbnail_url?: unknown
  thumbnailUrl?: unknown
}

type CartResponseItem = CartProductResponse & {
  product?: CartProductResponse | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function mapOneCartItem(value: unknown): CartItem | null {
  if (!isRecord(value)) return null

  const item = value as CartResponseItem
  const hasProduct = isRecord(item.product)
  const source = hasProduct ? item.product! : item
  const title = source.title ?? source.productTitle
  const amount = source.amount ?? source.productAmount
  const cartProductId = asString(item.cartProductId) ?? asString(item.cartItemId) ?? asString(item.id)
  const productId =
    (hasProduct ? asString(source.id) : null) ??
    asString(item.productId) ??
    (!asString(item.cartProductId) && !asString(item.cartItemId) ? asString(source.id) : null)

  if (!productId || !cartProductId || typeof title !== 'string' || typeof amount !== 'number') {
    return null
  }

  const thumbnail = source.thumbnailUrl ?? source.thumbnail_url ?? null

  return {
    id: productId,
    productId,
    cartProductId,
    title,
    amount,
    thumbnailUrl: typeof thumbnail === 'string' ? thumbnail : null,
  }
}

export function mapCartResponseToItems(data: unknown): CartItem[] {
  if (Array.isArray(data)) {
    return data.flatMap((item) => {
      const mapped = mapOneCartItem(item)
      return mapped ? [mapped] : []
    })
  }

  if (isRecord(data)) {
    return mapCartResponseToItems(data.items ?? data.cartItems ?? data.cartProducts ?? data.products)
  }

  return []
}
