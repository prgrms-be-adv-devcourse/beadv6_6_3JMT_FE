// 원본 design-system.js Badge + shared-admin-ui.js StatusBadge 이식
import type { CSSProperties, ReactNode } from 'react'

type Tone = 'blue' | 'neutral' | 'error'

interface BadgeProps {
  tone?: Tone
  soft?: boolean
  children: ReactNode
  style?: CSSProperties
  className?: string
}

// tone × soft 팔레트 (design-system.js:69). error soft 배경은 원본 인라인 리터럴 #fdeceb
const PALETTE: Record<Tone, { soft: CSSProperties; filled: CSSProperties }> = {
  blue: {
    soft: { backgroundColor: 'var(--ph-secondary)', color: 'var(--ph-primary)' },
    filled: { backgroundColor: 'var(--ph-primary)', color: 'var(--ph-on-accent)' },
  },
  neutral: {
    soft: { backgroundColor: 'var(--ph-gray-100)', color: 'var(--ph-gray-600)' },
    filled: { backgroundColor: 'var(--ph-black)', color: 'var(--ph-white)' },
  },
  error: {
    soft: { backgroundColor: '#fdeceb', color: 'var(--ph-error)' },
    filled: { backgroundColor: 'var(--ph-error)', color: 'var(--ph-white)' },
  },
}

export function Badge({ tone = 'blue', soft = true, children, style, className }: BadgeProps) {
  const p = soft ? PALETTE[tone].soft : PALETTE[tone].filled
  return (
    <span
      className={`inline-flex items-center rounded-ph-full text-[13px] font-semibold leading-none ${className ?? ''}`}
      style={{ padding: '5px 9px', ...p, ...style }}
    >
      {children}
    </span>
  )
}

// 도메인 상태 → 뱃지 매핑 (shared-admin-ui.js:127)
const STATUS: Record<string, { label: string; tone: Tone; soft: boolean; dot: string }> = {
  active: { label: '활성', tone: 'blue', soft: true, dot: '#1b64da' },
  suspended: { label: '정지', tone: 'error', soft: true, dot: '#d92d20' },
  withdrawn: { label: '탈퇴', tone: 'neutral', soft: true, dot: '#8b95a1' },
  pending: { label: '대기', tone: 'neutral', soft: true, dot: '#8b95a1' },
  review: { label: '검토중', tone: 'neutral', soft: true, dot: '#8b95a1' },
  approved: { label: '승인', tone: 'blue', soft: true, dot: '#1b64da' },
  active_product: { label: '게시중', tone: 'blue', soft: true, dot: '#1b64da' },
  rejected: { label: '반려', tone: 'error', soft: true, dot: '#d92d20' },
  paid: { label: '지급 완료', tone: 'blue', soft: false, dot: '#fff' },
  settled: { label: '지급 완료', tone: 'blue', soft: false, dot: '#fff' },
  refunded: { label: '환불됨', tone: 'error', soft: true, dot: '#d92d20' },
  held: { label: '보류', tone: 'error', soft: true, dot: '#d92d20' },
  PENDING: { label: '대기', tone: 'neutral', soft: true, dot: '#8b95a1' },
  PAID: { label: '완료', tone: 'blue', soft: false, dot: '#fff' },
  FAILED: { label: '실패', tone: 'error', soft: true, dot: '#d92d20' },
  CANCELED: { label: '취소', tone: 'neutral', soft: true, dot: '#8b95a1' },
  REFUNDED: { label: '환불', tone: 'error', soft: true, dot: '#d92d20' },
  // 정산 표시 상태 (SettlementDisplayStatus)
  WAITING: { label: '대기', tone: 'neutral', soft: true, dot: '#8b95a1' },
  APPROVAL_ON_HOLD: { label: '승인 보류', tone: 'error', soft: true, dot: '#d92d20' },
  APPROVED: { label: '승인', tone: 'blue', soft: true, dot: '#1b64da' },
  PAYOUT_REQUESTED: { label: '지급 신청', tone: 'blue', soft: true, dot: '#1b64da' },
  PAYOUT_ON_HOLD: { label: '지급 보류', tone: 'error', soft: true, dot: '#d92d20' },
  // 레거시 정산 상태 코드 (호환용)
  PENDING_APPROVAL: { label: '대기', tone: 'neutral', soft: true, dot: '#8b95a1' },
  SETTLEMENT_ON_HOLD: { label: '승인 보류', tone: 'error', soft: true, dot: '#d92d20' },
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const s = STATUS[status] ?? STATUS.pending
  return (
    <Badge tone={s.tone} soft={s.soft} style={{ gap: 6, padding: '5px 10px', whiteSpace: 'nowrap' }}>
      <span className="inline-block h-[6px] w-[6px] rounded-full" style={{ background: s.dot }} />
      {label ?? s.label}
    </Badge>
  )
}
