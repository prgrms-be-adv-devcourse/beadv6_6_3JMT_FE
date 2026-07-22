'use client'

import { useEffect, useId } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: React.ReactNode
  icon?: React.ComponentType<{ style?: React.CSSProperties }>
  iconBg?: string
  iconColor?: string
  confirmLabel: string
  cancelLabel?: string
  showCancel?: boolean
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  confirmVariant?: 'danger' | 'primary'
  titleAlign?: 'left' | 'center'
  maxWidth?: number
}

export default function ConfirmDialog({
  open,
  title,
  description,
  icon: Icon = AlertTriangle,
  iconBg = '#fdeceb',
  iconColor = 'var(--ph-error)',
  confirmLabel,
  cancelLabel = '취소',
  showCancel = true,
  onConfirm,
  onCancel,
  loading = false,
  confirmVariant = 'primary',
  titleAlign = 'left',
  maxWidth = 420,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const isCentered = titleAlign === 'center'

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [loading, onCancel, open])

  if (!open) return null

  const dangerStyle: React.CSSProperties | undefined =
    confirmVariant === 'danger' ? { background: 'var(--ph-error)' } : undefined

  return (
    <div
      onClick={() => {
        if (!loading) onCancel()
      }}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-5"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full rounded-ph-xl bg-ph-surface p-7"
        style={{ maxWidth }}
      >
        <div
          className={`flex size-11 items-center justify-center rounded-ph-full ${isCentered ? 'mx-auto mb-ph-16' : 'mb-ph-16'}`}
          style={{ background: iconBg }}
        >
          <Icon style={{ width: 22, height: 22, color: iconColor }} />
        </div>

        <div
          id={titleId}
          className={`text-ph-body-lg font-bold ${isCentered ? 'mb-2.5 text-center' : 'mb-ph-8'}`}
        >
          {title}
        </div>

        <p
          id={descriptionId}
          className={`mb-ph-24 text-ph-text-secondary ${isCentered ? 'text-center text-ph-body-sm' : 'text-ph-body-md'} leading-relaxed`}
        >
          {description}
        </p>

        <div className="flex gap-ph-xs">
          {showCancel && (
            <div className="flex-1">
              <Button variant="secondary" size="lg" fullWidth disabled={loading} onClick={onCancel}>
                {cancelLabel}
              </Button>
            </div>
          )}
          <div className="flex-1">
            <Button
              variant="solid"
              size="lg"
              fullWidth
              disabled={loading}
              onClick={onConfirm}
              style={dangerStyle}
            >
              {loading ? '처리 중...' : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
