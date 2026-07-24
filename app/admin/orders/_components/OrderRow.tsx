'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { Tr, Td, Identity } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/Badge'
import { AdminOrderV2, ORDER_PRODUCT_STATUS_LABEL } from '@/types/api/orders'

function formatDateTime(iso?: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatCurrency(amount: number): string {
  if (amount === 0) return '0원'
  return `${amount.toLocaleString()}원`
}

interface OrderRowProps {
  order: AdminOrderV2
  index: number
}

export function OrderRow({ order, index }: OrderRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const detailId = `order-detail-${order.orderNumber || index}`
  const products = order.orderProducts ?? []
  const firstProductTitle = products[0]?.productTitle ?? '상품 없음'
  const summaryTitle =
    products.length > 1 ? `${firstProductTitle} 외 ${products.length - 1}건` : firstProductTitle

  const buyerName = order.buyer?.name || order.buyer?.buyerName || '구매자 정보 없음'
  const buyerSub = order.buyer?.userId || order.buyer?.email || order.buyer?.buyerId
  const buyerAvatar = order.buyer?.profileImageUrl ?? null

  const handleCopyOrderNumber = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (order.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <>
      <Tr active={expanded} onClick={() => setExpanded(!expanded)}>
        <Td>
          <span className="text-[13px] text-ph-text-secondary">
            {formatDateTime(order.orderedAt || order.createdAt)}
          </span>
        </Td>
        <Td>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[12.5px] font-medium text-ph-text">
              {order.orderNumber}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              title="주문번호 복사"
              className="rounded p-1 text-ph-text-muted hover:bg-ph-gray-100 hover:text-ph-text transition-colors"
            >
              {copied ? <Check size={14} className="text-ph-primary" /> : <Copy size={14} />}
            </button>
          </div>
        </Td>
        <Td>
          <Identity name={buyerName} sub={buyerSub} imageUrl={buyerAvatar} />
        </Td>
        <Td>
          <span className="block max-w-[220px] truncate font-medium text-ph-text" title={summaryTitle}>
            {summaryTitle}
          </span>
        </Td>
        <Td align="right" style={{ fontWeight: 600 }}>
          {formatCurrency(order.totalOrderAmount)}
        </Td>
        <Td align="center">
          <StatusBadge status={order.orderStatus} />
        </Td>
        <Td align="center">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="inline-flex items-center gap-1 rounded-ph-sm border border-ph-border px-2.5 py-1 text-[12px] font-semibold text-ph-text-secondary hover:bg-ph-gray-50 transition-colors"
          >
            {expanded ? (
              <>
                닫기 <ChevronUp size={14} />
              </>
            ) : (
              <>
                상품 보기 <ChevronDown size={14} />
              </>
            )}
          </button>
        </Td>
      </Tr>

      {expanded && (
        <tr id={detailId} className="bg-ph-gray-50/70 border-b border-ph-border">
          <td colSpan={7} className="px-6 py-4">
            <div className="rounded-ph-md border border-ph-border bg-ph-bg p-4 shadow-sm">
              <div className="mb-3 text-[13px] font-bold text-ph-text">
                주문 상품 상세 ({products.length}건)
              </div>
              {products.length === 0 ? (
                <div className="py-4 text-center text-[13px] text-ph-text-muted">
                  주문 상품 정보가 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-ph-border text-ph-text-muted">
                        <th className="pb-2 font-semibold">판매자</th>
                        <th className="pb-2 font-semibold">상품명</th>
                        <th className="pb-2 text-right font-semibold">상품금액</th>
                        <th className="pb-2 text-center font-semibold">상품상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ph-border/50">
                      {products.map((prod, pIdx) => {
                        const sellerName =
                          prod.seller?.sellerNickname ||
                          prod.seller?.name ||
                          '판매자 정보 없음'
                        const sellerAvatar = prod.seller?.profileImageUrl ?? null
                        const statusLabel =
                          ORDER_PRODUCT_STATUS_LABEL[prod.orderProductStatus] ??
                          prod.orderProductStatus

                        return (
                          <tr key={pIdx} className="hover:bg-ph-gray-50/50">
                            <td className="py-2.5 pr-4 align-middle">
                              <Identity name={sellerName} size={30} imageUrl={sellerAvatar} />
                            </td>
                            <td className="py-2.5 pr-4 align-middle">
                              <span
                                className="block max-w-[300px] truncate font-medium text-ph-text"
                                title={prod.productTitle}
                              >
                                {prod.productTitle}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-right align-middle font-semibold text-ph-text">
                              {formatCurrency(prod.productAmount)}
                            </td>
                            <td className="py-2.5 text-center align-middle">
                              <StatusBadge
                                status={prod.orderProductStatus}
                                label={statusLabel}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
