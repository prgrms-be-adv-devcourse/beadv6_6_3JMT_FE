import {
  mapAdminProducts,
  type AdminProduct,
  type AdminProductResponse,
} from './adminProductAdapters.ts'

export interface AdminHomeResponseData {
  generatedAt: string
  users: {
    totalUsers: number
    todayNewUsers: number
  }
  transactions: {
    monthlyTransactionAmount: number
    recent7Days: {
      totalTransactionCount: number
      totalTransactionAmount: number
      period: {
        startDate: string
        endDate: string
      }
      dailyTransactions: Array<{
        date: string
        transactionCount: number
        transactionAmount: number
      }>
    }
  }
  settlements: {
    pendingApprovalAmount: number
    pendingApprovalCount: number
  }
  pendingProducts: {
    totalCount: number
    items: Array<
      AdminProductResponse & {
        amount: number
        createdAt: string
      }
    >
  }
}

export interface AdminHomeStats {
  totalUsers: number
  newToday: number
  monthRevenue: number
  pendingApprovalAmount: number
  pendingApprovalCount: number
  weekTotal: number
  weekRevenue: number
  sales7d: Array<{
    day: string
    date: string
    count: number
    revenue: number
  }>
}

export interface AdminHomeViewModel {
  generatedAt: string
  stats: AdminHomeStats
  reviewCount: number
  products: AdminProduct[]
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

export function formatAdminHomeDate(date: string): { day: string; displayDate: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return { day: '', displayDate: date }

  const year = Number(match[1])
  const month = Number(match[2])
  const dayOfMonth = Number(match[3])
  const weekday = new Date(Date.UTC(year, month - 1, dayOfMonth)).getUTCDay()

  return {
    day: DAY_LABELS[weekday],
    displayDate: `${month}/${dayOfMonth}`,
  }
}

export function mapAdminHome(data: AdminHomeResponseData): AdminHomeViewModel {
  return {
    generatedAt: data.generatedAt,
    stats: {
      totalUsers: data.users.totalUsers,
      newToday: data.users.todayNewUsers,
      monthRevenue: data.transactions.monthlyTransactionAmount,
      pendingApprovalAmount: data.settlements.pendingApprovalAmount,
      pendingApprovalCount: data.settlements.pendingApprovalCount,
      weekTotal: data.transactions.recent7Days.totalTransactionCount,
      weekRevenue: data.transactions.recent7Days.totalTransactionAmount,
      sales7d: data.transactions.recent7Days.dailyTransactions.map((item) => {
        const formatted = formatAdminHomeDate(item.date)
        return {
          day: formatted.day,
          date: formatted.displayDate,
          count: item.transactionCount,
          revenue: item.transactionAmount,
        }
      }),
    },
    reviewCount: data.pendingProducts.totalCount,
    products: mapAdminProducts(data.pendingProducts.items),
  }
}
