'use client';

import { Sparkles } from 'lucide-react';

export default function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--ph-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Sparkles style={{ width: 17, height: 17 }} />
      </span>
      <span style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ph-text)' }}>
        Prompt<span style={{ color: 'var(--ph-primary)' }}>Hub</span>
      </span>
    </button>
  );
}
