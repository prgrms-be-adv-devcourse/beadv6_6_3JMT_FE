import api from '@/lib/auth'

export interface AdminRawStats {
  totalUsers?: number
  totalUsersDelta?: number
  newToday?: number
  newTodayDelta?: number
  monthRevenue?: number
  monthRevenueDelta?: number
  pendingPayout?: number
  pendingPayoutCount?: number
  sales7d?: any[]
}

export interface AdminMonthlyOrdersData {
  monthlyTransactionAmount: number
}

export interface DailyTransaction {
  date: string
  transactionCount: number
  transactionAmount: number
}

export interface AdminWeeklyOrdersData {
  dailyTransactions: DailyTransaction[]
}

export async function getAdminDashboardStats(): Promise<AdminRawStats> {
  const res = await api.get<{ success: boolean; data: AdminRawStats; message: string }>(
    '/api/v1/admin/stats',
  )
  return res.data.data
}

export async function getAdminMonthlyOrders(): Promise<AdminMonthlyOrdersData> {
  const res = await api.get<{ success: boolean; data: AdminMonthlyOrdersData; message: string }>(
    '/api/v1/admin/orders/month',
  )
  return res.data.data
}

export async function getAdminWeeklyOrders(): Promise<AdminWeeklyOrdersData> {
  const res = await api.get<{ success: boolean; data: AdminWeeklyOrdersData; message: string }>(
    '/api/v1/admin/orders/weekend',
  )
  return res.data.data
}
