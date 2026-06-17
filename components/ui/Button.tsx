'use client';

import { useState } from 'react';

export default function Button({
  variant = 'solid',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  style,
}: {
  variant?: 'solid' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);

  const sizes: Record<string, React.CSSProperties> = {
    sm: { fontSize: 14, padding: '7px 12px',  minHeight: 34, minWidth: 64  },
    md: { fontSize: 15, padding: '11px 16px', minHeight: 40, minWidth: 84  },
    lg: { fontSize: 17, padding: '15px 24px', minHeight: 52, minWidth: 120 },
  };

  const variantStyle: React.CSSProperties =
    variant === 'solid'
      ? { background: hovered && !disabled ? 'var(--ph-blue-hover)' : 'var(--ph-primary)', color: '#fff',           border: '1px solid transparent',     borderRadius: 'var(--ph-radius-md)' }
      : { background: hovered && !disabled ? 'var(--ph-gray-100)'   : 'transparent',       color: 'var(--ph-text)', border: '1px solid var(--ph-text)', borderRadius: 'var(--ph-radius-sm)' };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: 'var(--ph-font-family)',
        fontWeight: 600,
        letterSpacing: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : undefined,
        opacity: disabled ? 0.4 : 1,
        boxSizing: 'border-box',
        transition: 'background-color .15s ease, opacity .15s ease',
        ...sizes[size],
        ...variantStyle,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
