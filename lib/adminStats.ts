import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

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

export async function getAdminMonthlyOrders(): Promise<AdminMonthlyOrdersData> {
  const res = await api.get<{ success: boolean; data: AdminMonthlyOrdersData; message: string }>(
    `${API_BASE}/admin/orders/month`,
  )
  return res.data.data
}

export async function getAdminWeeklyOrders(): Promise<AdminWeeklyOrdersData> {
  const res = await api.get<{ success: boolean; data: AdminWeeklyOrdersData; message: string }>(
    `${API_BASE}/admin/orders/weekend`,
  )
  return res.data.data
}
