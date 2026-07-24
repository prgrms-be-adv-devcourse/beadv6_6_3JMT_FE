'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, RefreshCw, Lock } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { SectionCard } from '@/components/admin/SectionCard'
import { Table, Th, Tr, Td } from '@/components/admin/DataTable'
import { AdminOrderV2, PageResponse } from '@/types/api/orders'
import { OrderRow } from './_components/OrderRow'
import { Pagination } from './_components/Pagination'

interface ErrorState {
  code?: string
  message: string
  isPermissionError?: boolean
}

function AdminOrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const logout = useAuthStore((s) => s.logout)
  const token = useAuthStore((s) => s.token)

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const size = Math.max(1, Number(searchParams.get('size')) || 20)

  const [orders, setOrders] = useState<AdminOrderV2[]>([])
  const [meta, setMeta] = useState({
    page: 1,
    size: 20,
    total: 0,
    hasNext: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ErrorState | null>(null)

  const updateQueryParams = useCallback(
    (newPage: number, newSize: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(newPage))
      params.set('size', String(newSize))
      router.push(`/admin/orders?${params.toString()}`)
    },
    [router, searchParams],
  )

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await api.get<PageResponse<AdminOrderV2>>(`/api/v2/admin/orders`, {
        params: { page, size },
      })

      const pageData = res.data
      if (pageData && pageData.data) {
        setOrders(pageData.data)
        if (pageData.meta) {
          setMeta(pageData.meta)
        }
      } else {
        setOrders([])
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number
          data?: {
            code?: string
            message?: string
          }
        }
      }
      const statusCode = axiosErr.response?.status
      const errorCode = axiosErr.response?.data?.code
      const errorMessage = axiosErr.response?.data?.message

      if (errorCode === 'A003' || statusCode === 401) {
        logout()
        router.replace('/admin/login')
        return
      }

      if (errorCode === 'A004' || statusCode === 403) {
        setError({
          code: 'A004',
          message: '관리자 권한이 없습니다. 접근할 수 없는 페이지입니다.',
          isPermissionError: true,
        })
        return
      }

      if (errorCode === 'V001') {
        setError({
          code: 'V001',
          message: errorMessage || '잘못된 페이지 또는 조회 조건입니다.',
        })
        return
      }

      setError({
        code: errorCode || (statusCode ? String(statusCode) : '500'),
        message: errorMessage || '주문 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      })
    } finally {
      setLoading(false)
    }
  }, [page, size, logout, router])

  useEffect(() => {
    if (!token) return
    fetchOrders()
  }, [token, fetchOrders])

  const handlePageChange = (newPage: number) => {
    updateQueryParams(newPage, size)
  }

  const handleSizeChange = (newSize: number) => {
    updateQueryParams(1, newSize)
  }

  if (error?.isPermissionError) {
    return (
      <SectionCard title="주문 관리">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ph-error/10 text-ph-error">
            <Lock size={28} />
          </div>
          <h3 className="mb-1 text-[16px] font-bold text-ph-text">권한 없음 (A004)</h3>
          <p className="max-w-md text-[14px] text-ph-text-muted">{error.message}</p>
        </div>
      </SectionCard>
    )
  }

  return (
    <SectionCard title="주문 관리" sub={`총 ${meta.total.toLocaleString()}건`} bodyStyle={{ padding: 0 }}>
      {error && !error.isPermissionError && (
        <div className="m-4 flex items-center justify-between rounded-ph-md border border-ph-error/30 bg-ph-error/5 p-4 text-[13.5px] text-ph-error">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>
              {error.code ? `[${error.code}] ` : ''}
              {error.message}
            </span>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex items-center gap-1 rounded-ph-sm border border-ph-error/30 bg-ph-bg px-3 py-1.5 font-semibold hover:bg-ph-error/10 transition-colors"
          >
            <RefreshCw size={14} /> 다시 시도
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Th width="140px">주문일시</Th>
              <Th width="180px">주문번호</Th>
              <Th>구매자</Th>
              <Th>상품 요약</Th>
              <Th align="right" width="130px">
                총 주문금액
              </Th>
              <Th align="center" width="110px">
                상태
              </Th>
              <Th align="center" width="100px">
                상세
              </Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Td key={j}>
                      <div className="h-[18px] animate-pulse rounded-ph-sm bg-ph-gray-100" />
                    </Td>
                  ))}
                </Tr>
              ))
            ) : orders.length > 0 ? (
              orders.map((order, idx) => (
                <OrderRow key={order.orderNumber || idx} order={order} index={idx} />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[14px] text-ph-text-muted">
                  주문 내역이 존재하지 않습니다.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {!loading && orders.length > 0 && (
        <Pagination
          page={meta.page}
          size={meta.size}
          total={meta.total}
          hasNext={meta.hasNext}
          onPageChange={handlePageChange}
          onSizeChange={handleSizeChange}
        />
      )}
    </SectionCard>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <SectionCard title="주문 관리" bodyStyle={{ padding: 0 }}>
          <div className="p-8 text-center text-[14px] text-ph-text-muted">
            로딩 중...
          </div>
        </SectionCard>
      }
    >
      <AdminOrdersContent />
    </Suspense>
  )
}
