'use client';

import { CheckCircle2 } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';

export default function Toast() {
  const message = useToastStore((s) => s.message);

  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 32,
        transform: 'translateX(-50%)',
        zIndex: 90,
        background: 'var(--ph-text)',
        color: '#fff',
        padding: '13px 22px',
        borderRadius: 'var(--ph-radius-full)',
        fontSize: 14,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
      }}
    >
      <CheckCircle2 style={{ width: 17, height: 17, flexShrink: 0 }} />
      {message}
    </div>
  );
}
