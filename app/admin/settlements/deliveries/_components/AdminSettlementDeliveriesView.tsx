'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'

import SettlementDeliverySummaryCards from '@/app/admin/settlements/deliveries/_components/SettlementDeliverySummaryCards'
import SettlementDeliveryTable from '@/app/admin/settlements/deliveries/_components/SettlementDeliveryTable'
import {
  SettlementDeliveryRefreshAction,
  SettlementDeliveryToolbar,
} from '@/app/admin/settlements/deliveries/_components/SettlementDeliveryToolbar'
import { SectionCard } from '@/components/admin/SectionCard'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { notifyAdminSettlementDeliveriesChanged } from '@/lib/adminSettlementDeliveryEvents'
import {
  canRetrySettlementDelivery,
  type SettlementDeliveryFilter,
} from '@/lib/settlementDeliveryContracts'
import {
  getAdminSettlementDeliveries,
  getAdminSettlementDeliverySummary,
  retryAdminSettlementDelivery,
  type AdminSettlementDelivery,
  type AdminSettlementDeliverySummary,
} from '@/lib/settlementDeliveries'
import { apiErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/store/useToastStore'

const PAGE_SIZE = 20

export default function AdminSettlementDeliveriesView() {
  const { token } = useAuthStore()
  const showToast = useToast()
  const [items, setItems] = useState<AdminSettlementDelivery[]>([])
  const [summary, setSummary] = useState<AdminSettlementDeliverySummary | null>(null)
  const [summaryError, setSummaryError] = useState(false)
  const [filter, setFilter] = useState<SettlementDeliveryFilter>('problem')
  const [identifierInput, setIdentifierInput] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [retryTarget, setRetryTarget] = useState<AdminSettlementDelivery | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const loadSummary = useCallback(async () => {
    try {
      const nextSummary = await getAdminSettlementDeliverySummary()
      setSummary(nextSummary)
      setSummaryError(false)
    } catch {
      setSummary(null)
      setSummaryError(true)
    }
  }, [])

  const loadList = useCallback(
    async (
      nextFilter: SettlementDeliveryFilter,
      nextIdentifier: string,
      nextPage: number,
      silent = false,
    ) => {
      const requestId = ++requestIdRef.current
      if (!silent) setLoading(true)
      setError(null)

      try {
        const result = await getAdminSettlementDeliveries(
          nextFilter,
          nextIdentifier,
          nextPage,
          PAGE_SIZE,
        )
        if (requestId !== requestIdRef.current) return
        setItems(result.items)
        setPage(result.page)
        setTotal(result.totalElements)
      } catch (loadError) {
        if (requestId !== requestIdRef.current) return
        setItems([])
        setTotal(0)
        setError(apiErrorMessage(loadError, '정산 전달 목록을 불러오지 못했어요.'))
      } finally {
        if (requestId === requestIdRef.current && !silent) setLoading(false)
      }
    },
    [],
  )

  const refresh = useCallback(
    async (silent = false) => {
      await Promise.all([loadList(filter, identifier, page, silent), loadSummary()])
    },
    [filter, identifier, loadList, loadSummary, page],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadList('problem', '', 0)
      void loadSummary()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadList, loadSummary, token])

  const visibleRetryCount = items.filter((item) => item.retryInProgress).length
  const retryInProgressCount = Math.max(summary?.retryInProgressCount ?? 0, visibleRetryCount)

  useEffect(() => {
    if (retryInProgressCount === 0) return
    const interval = window.setInterval(() => void refresh(true), 3000)
    return () => window.clearInterval(interval)
  }, [refresh, retryInProgressCount])

  const changeFilter = (nextFilter: SettlementDeliveryFilter) => {
    setFilter(nextFilter)
    setPage(0)
    setExpandedId(null)
    void loadList(nextFilter, identifier, 0)
  }

  const search = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextIdentifier = identifierInput.trim()
    setIdentifier(nextIdentifier)
    setPage(0)
    setExpandedId(null)
    void loadList(filter, nextIdentifier, 0)
  }

  const changePage = (nextPage: number) => {
    setPage(nextPage)
    setExpandedId(null)
    void loadList(filter, identifier, nextPage)
  }

  const toggleExpanded = (id: string) => {
    setExpandedId((currentId) => (currentId === id ? null : id))
  }

  const retryDelivery = async () => {
    if (!retryTarget || !canRetrySettlementDelivery(retryTarget)) return

    const targetId = retryTarget.settlementDeliveryId
    setActionError(null)
    setRetryingId(targetId)

    try {
      await retryAdminSettlementDelivery(targetId)
      setRetryTarget(null)
      showToast('정산 전달 재전송 요청을 접수했어요.')
      notifyAdminSettlementDeliveriesChanged()
      await Promise.all([loadList(filter, identifier, page), loadSummary()])
    } catch (retryError) {
      setRetryTarget(null)
      setActionError(
        apiErrorMessage(
          retryError,
          '정산 전달 재시도를 요청하지 못했어요. 최신 상태를 확인해 주세요.',
        ),
      )
      await Promise.all([loadList(filter, identifier, page), loadSummary()])
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-ph-16">
      <SettlementDeliverySummaryCards summary={summary} error={summaryError} />

      <SectionCard
        title="정산 전달 현황"
        sub="Settlement Service가 User Service로 전달한 결과와 대사 상태를 확인합니다."
        action={
          <SettlementDeliveryRefreshAction
            loading={loading}
            retryInProgressCount={retryInProgressCount}
            onRefresh={() => void refresh()}
          />
        }
        headerExtra={
          <SettlementDeliveryToolbar
            filter={filter}
            summary={summary}
            identifierInput={identifierInput}
            onFilterChange={changeFilter}
            onIdentifierChange={setIdentifierInput}
            onSearch={search}
          />
        }
      >
        <SettlementDeliveryTable
          items={items}
          loading={loading}
          error={error}
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          expandedId={expandedId}
          retryingId={retryingId}
          onToggle={toggleExpanded}
          onRetry={setRetryTarget}
          onPageChange={changePage}
          onReload={() => void refresh()}
        />
      </SectionCard>

      <ConfirmDialog
        open={!!retryTarget}
        title="정산 전달을 재시도하시겠어요?"
        description={
          retryTarget ? (
            <>
              정산 ID <b className="break-all text-ph-text">{retryTarget.settlementId}</b>
              <br />
              전달 요청 ID <b className="break-all text-ph-text">{retryTarget.deliveryRequestId}</b>
              <br />
              기존 전달 요청 ID를 유지해 User Service 전달을 다시 요청합니다.
            </>
          ) : (
            ''
          )
        }
        icon={RotateCcw}
        iconBg="var(--ph-secondary)"
        iconColor="var(--ph-primary)"
        confirmLabel="재시도"
        loading={!!retryTarget && retryingId === retryTarget.settlementDeliveryId}
        onConfirm={retryDelivery}
        onCancel={() => setRetryTarget(null)}
      />

      <ConfirmDialog
        open={!!actionError}
        title="재시도를 처리하지 못했어요"
        description={actionError ?? ''}
        confirmLabel="확인"
        showCancel={false}
        onConfirm={() => setActionError(null)}
        onCancel={() => setActionError(null)}
      />
    </div>
  )
}
