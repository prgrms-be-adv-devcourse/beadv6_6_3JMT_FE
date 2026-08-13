export type ProductActivity = {
  productId: string
  occurredAt?: string | null
}

export function productIdsByLatestActivity(activities: ProductActivity[]): string[] {
  const productIds = new Set<string>()
  const latestFirst = [...activities].sort(
    (left, right) => activityTime(right.occurredAt) - activityTime(left.occurredAt),
  )

  latestFirst.forEach((activity) => productIds.add(activity.productId))
  return [...productIds]
}

function activityTime(value?: string | null): number {
  const timestamp = Date.parse(value ?? '')
  return Number.isNaN(timestamp) ? 0 : timestamp
}
