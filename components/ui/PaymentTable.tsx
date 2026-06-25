'use client';

import { useState } from 'react';
import { won } from '@/lib/utils';

export interface Payment {
  paymentId: string;
  title: string;
  amount: number;
  paymentStatus: 'PAID' | 'REFUNDING' | 'REFUNDED';
  isRefund: boolean;
  paidAt: string;
}

interface PaymentTableProps {
  payments: Payment[];
  showRefundColumn?: boolean;
  onRefund?: (paymentId: string) => void;
}

const STATUS_MAP: Record<Payment['paymentStatus'], { label: string; color: string; bg: string }> = {
  PAID:      { label: '결제완료',      color: 'var(--ph-primary)',  bg: 'var(--ph-secondary)' },
  REFUNDING: { label: '환불 신청 중', color: 'var(--ph-red)',      bg: 'rgba(217,45,32,0.10)' },
  REFUNDED:  { label: '환불 완료',    color: 'var(--ph-gray-600)', bg: 'var(--ph-gray-100)' },
};

function RefundButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: 'var(--ph-font-family)', fontSize: 14, fontWeight: 600,
        padding: '7px 12px', minHeight: 34, minWidth: 64,
        borderRadius: 'var(--ph-radius-sm)',
        border: '1px solid var(--ph-text)',
        background: hovered ? 'var(--ph-gray-100)' : 'transparent',
        color: 'var(--ph-text)', cursor: 'pointer',
      }}
    >
      환불 신청
    </button>
  );
}

export default function PaymentTable({ payments, showRefundColumn, onRefund }: PaymentTableProps) {
  const cols = showRefundColumn
    ? 'minmax(0,1fr) 116px 110px 116px 108px'
    : 'minmax(0,1fr) 130px 110px 130px';

  return (
    <div style={{ background: 'var(--ph-surface)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-lg)', overflow: 'hidden' }}>
      {/* 테이블 헤더 */}
      <div style={{
        display: 'grid', gridTemplateColumns: cols,
        gap: 12, padding: '14px 22px',
        borderBottom: '1px solid var(--ph-border)',
        fontSize: 13, fontWeight: 600, color: 'var(--ph-text-muted)',
        background: 'var(--ph-gray-50)',
      }}>
        <div>상품명</div>
        <div>결제일</div>
        <div>금액</div>
        <div>상태</div>
        {showRefundColumn && <div style={{ textAlign: 'right' }}>환불</div>}
      </div>
      {/* 행 */}
      {payments.map((pay, i) => {
        const meta     = STATUS_MAP[pay.paymentStatus] ?? STATUS_MAP.PAID;
        const isFree   = pay.amount === 0;
        const canRefund = pay.paymentStatus === 'PAID' && pay.isRefund;
        return (
          <div
            key={pay.paymentId}
            style={{
              display: 'grid', gridTemplateColumns: cols,
              gap: 12, padding: '16px 22px',
              borderTop: i ? '1px solid var(--ph-border)' : 'none',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pay.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ph-text-secondary)' }}>
              {new Date(pay.paidAt).toLocaleDateString('ko-KR')}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ph-text)' }}>
              {isFree ? '무료' : won(pay.amount)}
            </div>
            <div>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '4px 10px', borderRadius: 'var(--ph-radius-full)',
                fontSize: 12, fontWeight: 600,
                color: meta.color, background: meta.bg, whiteSpace: 'nowrap',
              }}>
                {meta.label}
              </span>
            </div>
            {showRefundColumn && (
              <div style={{ textAlign: 'right' }}>
                {canRefund ? (
                  <RefundButton onClick={() => onRefund?.(pay.paymentId)} />
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--ph-text-muted)' }}>—</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
