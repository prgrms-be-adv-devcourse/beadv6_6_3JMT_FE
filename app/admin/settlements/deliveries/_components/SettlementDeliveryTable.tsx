'use client'

import { Fragment, useState, type Dispatch } from 'react'
import { Check, ChevronDown, Copy, Inbox, LoaderCircle, RefreshCw, RotateCcw } from 'lucide-react'

import { StatusBadge } from '@/components/admin/Badge'
import { DataPagination, Table, Td, Th, Tr } from '@/components/admin/DataTable'
import {
  canRetrySettlementDelivery,
  type AdminSettlementDelivery,
} from '@/lib/settlementDeliveryContracts'
import { useToast } from '@/store/useToastStore'

import {
  formatSettlementDeliveryDateTime,
  shortenSettlementDeliveryId,
} from './settlementDeliveryPresentation'

interface CopyableIdProps {
  label: string
  value: string
  full?: boolean
}

function CopyableId({ label, value, full = false }: CopyableIdProps) {
  const [copied, setCopied] = useState(false)
  const showToast = useToast()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      showToast(`${label}를 복사했어요.`)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      showToast(`${label}를 복사하지 못했어요.`)
    }
  }

  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-ph-4">
      <code
        className={`${full ? 'break-all' : 'whitespace-nowrap'} text-[12.5px] text-ph-text`}
        title={value}
      >
        {full ? value : shortenSettlementDeliveryId(value)}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        title={`${label} 복사`}
        aria-label={`${label} 복사`}
        className="inline-flex size-7 flex-shrink-0 items-center justify-center rounded-ph-sm text-ph-text-muted transition-colors hover:bg-ph-gray-100 hover:text-ph-text"
      >
        {copied ? <Check size={14} className="text-ph-primary" /> : <Copy size={14} />}
      </button>
    </span>
  )
}

interface SettlementDeliveryTableProps {
  items: AdminSettlementDelivery[]
  loading: boolean
  error: string | null
  page: number
  total: number
  pageSize: number
  expandedId: string | null
  retryingId: string | null
  onToggle: Dispatch<string>
  onRetry: Dispatch<AdminSettlementDelivery>
  onPageChange: Dispatch<number>
  onReload: () => void
}

export default function SettlementDeliveryTable({
  items,
  loading,
  error,
  page,
  total,
  pageSize,
  expandedId,
  retryingId,
  onToggle,
  onRetry,
  onPageChange,
  onReload,
}: SettlementDeliveryTableProps) {
  if (error) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center gap-ph-12 px-ph-24 py-ph-40 text-center">
        <div className="flex size-10 items-center justify-center rounded-ph-full bg-[#fdeceb] text-ph-error">
          <RefreshCw size={18} />
        </div>
        <div>
          <p className="text-ph-body-sm font-semibold text-ph-text">{error}</p>
          <p className="mt-ph-4 text-ph-caption text-ph-text-muted">
            잠시 후 다시 시도하거나 검색 조건을 확인해 주세요.
          </p>
        </div>
        <button
          type="button"
          onClick={onReload}
          className="inline-flex h-9 items-center gap-ph-2xs rounded-ph-md bg-ph-secondary px-ph-16 text-ph-caption font-semibold text-ph-primary"
        >
          <RefreshCw size={14} /> 다시 시도
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div
        className="flex min-h-[260px] flex-col items-center justify-center gap-ph-12 text-ph-text-muted"
        role="status"
      >
        <LoaderCircle size={24} className="animate-spin text-ph-primary" />
        <span className="text-ph-body-sm">정산 전달 목록을 불러오는 중…</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center gap-ph-8 px-ph-24 py-ph-40 text-center">
        <span className="flex size-11 items-center justify-center rounded-ph-full bg-ph-gray-100 text-ph-text-muted">
          <Inbox size={21} />
        </span>
        <p className="mt-ph-4 text-ph-body-sm font-bold text-ph-text-secondary">
          조건에 맞는 전달 내역이 없어요
        </p>
        <p className="text-ph-caption text-ph-text-muted">
          다른 상태를 선택하거나 식별자 검색 조건을 확인해 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1180px]">
        <Table>
          <thead>
            <tr>
              <Th>상태</Th>
              <Th>정산 ID</Th>
              <Th>전달 요청 ID</Th>
              <Th align="right">시도 횟수</Th>
              <Th>최초 시도</Th>
              <Th>최근 시도</Th>
              <Th>사유</Th>
              <Th align="right">관리</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const expanded = expandedId === item.settlementDeliveryId
              const detailId = `settlement-delivery-${item.settlementDeliveryId}`
              const retrying = retryingId === item.settlementDeliveryId

              return (
                <Fragment key={item.settlementDeliveryId}>
                  <Tr>
                    <Td>
                      <button
                        type="button"
                        onClick={() => onToggle(item.settlementDeliveryId)}
                        aria-expanded={expanded}
                        aria-controls={detailId}
                        className="inline-flex items-center gap-ph-8"
                      >
                        <ChevronDown
                          size={16}
                          className={`flex-shrink-0 transition-transform ${
                            expanded ? 'rotate-180' : ''
                          }`}
                        />
                        <StatusBadge status={item.status} />
                      </button>
                      {item.retryInProgress && (
                        <span className="mt-ph-4 flex items-center gap-ph-4 pl-ph-24 text-[12px] font-semibold text-ph-primary">
                          <LoaderCircle size={12} className="animate-spin" />
                          재전송 중
                        </span>
                      )}
                    </Td>
                    <Td>
                      <CopyableId label="정산 ID" value={item.settlementId} />
                    </Td>
                    <Td>
                      <CopyableId label="전달 요청 ID" value={item.deliveryRequestId} />
                    </Td>
                    <Td align="right">
                      <span className="whitespace-nowrap font-semibold">
                        {item.attemptCount.toLocaleString('ko-KR')}회
                      </span>
                    </Td>
                    <Td>
                      <time className="whitespace-nowrap text-ph-caption text-ph-text-secondary">
                        {formatSettlementDeliveryDateTime(item.firstAttemptAt)}
                      </time>
                    </Td>
                    <Td>
                      <time className="whitespace-nowrap text-ph-caption text-ph-text-secondary">
                        {formatSettlementDeliveryDateTime(item.lastAttemptAt)}
                      </time>
                    </Td>
                    <Td>
                      <span
                        className="block max-w-[240px] truncate text-ph-caption text-ph-text-secondary"
                        title={item.statusReason ?? undefined}
                      >
                        {item.statusReason ?? '-'}
                      </span>
                    </Td>
                    <Td align="right">
                      {canRetrySettlementDelivery(item) ? (
                        <button
                          type="button"
                          disabled={retrying}
                          onClick={() => onRetry(item)}
                          className="inline-flex h-8 items-center gap-ph-4 rounded-ph-sm border border-ph-border bg-ph-white px-ph-12 text-[12.5px] font-semibold text-ph-primary transition-colors hover:bg-ph-gray-50 disabled:cursor-wait disabled:opacity-50"
                        >
                          {retrying ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <RotateCcw size={14} />
                          )}
                          {retrying ? '요청 중' : '재시도'}
                        </button>
                      ) : (
                        <span className="text-[12.5px] text-ph-text-muted">-</span>
                      )}
                    </Td>
                  </Tr>
                  {expanded && (
                    <tr id={detailId}>
                      <td
                        colSpan={8}
                        className="border-b border-ph-border bg-ph-gray-50/70 px-ph-24 py-ph-16"
                      >
                        <dl className="grid gap-x-ph-24 gap-y-ph-16 text-ph-caption md:grid-cols-2 xl:grid-cols-3">
                          <div>
                            <dt className="font-semibold text-ph-text-muted">전달 레코드 ID</dt>
                            <dd className="mt-ph-4">
                              <CopyableId
                                label="전달 레코드 ID"
                                value={item.settlementDeliveryId}
                                full
                              />
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-ph-text-muted">정산 ID</dt>
                            <dd className="mt-ph-4">
                              <CopyableId label="정산 ID" value={item.settlementId} full />
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-ph-text-muted">전달 요청 ID</dt>
                            <dd className="mt-ph-4">
                              <CopyableId
                                label="전달 요청 ID"
                                value={item.deliveryRequestId}
                                full
                              />
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-ph-text-muted">최초 시도</dt>
                            <dd className="mt-ph-4">
                              {formatSettlementDeliveryDateTime(item.firstAttemptAt)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-ph-text-muted">최근 시도</dt>
                            <dd className="mt-ph-4">
                              {formatSettlementDeliveryDateTime(item.lastAttemptAt)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-ph-text-muted">대사 완료 시각</dt>
                            <dd className="mt-ph-4">
                              {formatSettlementDeliveryDateTime(item.reconciledAt)}
                            </dd>
                          </div>
                          <div className="md:col-span-2 xl:col-span-3">
                            <dt className="font-semibold text-ph-text-muted">상태 사유</dt>
                            <dd className="mt-ph-4 whitespace-pre-wrap break-words leading-relaxed text-ph-text-secondary">
                              {item.statusReason ?? '-'}
                            </dd>
                          </div>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </Table>
        <DataPagination page={page} size={pageSize} total={total} onPageChange={onPageChange} />
      </div>
    </div>
  )
}
