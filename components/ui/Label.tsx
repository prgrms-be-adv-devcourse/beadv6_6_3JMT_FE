export default function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text)' }}>{children}</span>
      {hint && <span style={{ fontSize: 12, color: 'var(--ph-text-muted)' }}>{hint}</span>}
    </div>
  );
}
