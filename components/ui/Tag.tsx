export default function Tag({
  selected = false,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className="min-h-11 md:min-h-0"
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--ph-font-family)',
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1,
        padding: '9px 14px',
        borderRadius: 'var(--ph-radius-full)',
        cursor: 'pointer',
        transition: 'background-color .15s ease, border-color .15s ease, color .15s ease',
        background: selected ? 'var(--ph-secondary)' : 'var(--ph-white)',
        color: selected ? 'var(--ph-primary)' : 'var(--ph-text-secondary)',
        border: `1px solid ${selected ? 'transparent' : 'var(--ph-border)'}`,
        boxShadow: 'none',
      }}
    >
      {children}
    </button>
  );
}
