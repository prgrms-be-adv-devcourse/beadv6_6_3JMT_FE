'use client';

import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  icon?: React.ComponentType<{ style?: React.CSSProperties }>;
  iconBg?: string;
  iconColor?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  confirmVariant?: 'danger' | 'primary';
  titleAlign?: 'left' | 'center';
  maxWidth?: number;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  icon: Icon = AlertTriangle,
  iconBg = 'rgba(217,45,32,0.10)',
  iconColor = 'var(--ph-error)',
  confirmLabel,
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  loading = false,
  confirmVariant = 'primary',
  titleAlign = 'left',
  maxWidth = 420,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isCentered = titleAlign === 'center';
  const dangerStyle: React.CSSProperties | undefined =
    confirmVariant === 'danger' ? { background: 'var(--ph-error)' } : undefined;

  return (
    <div
      onClick={() => { if (!loading) onCancel(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: '#fff', borderRadius: 'var(--ph-radius-xl)',
          maxWidth, width: '100%', padding: 28,
        }}
      >
        {/* 아이콘 */}
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--ph-radius-full)',
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: isCentered ? '0 auto 16px' : '0 0 16px',
        }}>
          <Icon style={{ width: 22, height: 22, color: iconColor }} />
        </div>

        {/* 제목 */}
        <div style={{
          fontSize: 18, fontWeight: 700,
          textAlign: titleAlign, marginBottom: isCentered ? 10 : 8,
        }}>
          {title}
        </div>

        {/* 설명 */}
        <p style={{
          fontSize: isCentered ? 14 : 15,
          color: 'var(--ph-text-secondary)',
          textAlign: isCentered ? 'center' : undefined,
          lineHeight: 1.6,
          margin: '0 0 24px',
        }}>
          {description}
        </p>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              disabled={loading}
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          </div>
          <div style={{ flex: 1 }}>
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
  );
}
