export default function Card({
  children,
  padding = '24px',
  style,
  onClick,
}: {
  children: React.ReactNode;
  padding?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--ph-surface)',
        border: '1px solid var(--ph-border)',
        borderRadius: 'var(--ph-radius-lg)',
        padding,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
