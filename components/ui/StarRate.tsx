'use client';

import { useState } from 'react';

interface StarRateProps {
  value: number;
  onRate: (n: number) => void;
  size?: number;
  disabled?: boolean;
}

export default function StarRate({ value, onRate, size = 34, disabled = false }: StarRateProps) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div
      style={{ display: 'flex', gap: 4 }}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= active;
        return (
          <button
            key={n}
            onClick={() => { if (!disabled) onRate(n); }}
            onMouseEnter={() => { if (!disabled) setHover(n); }}
            aria-label={`${n}점`}
            style={{
              background: 'none',
              border: 'none',
              cursor: disabled ? 'default' : 'pointer',
              padding: 2,
              lineHeight: 0,
            }}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={on ? 'var(--ph-primary)' : 'none'}
              stroke={on ? 'var(--ph-primary)' : 'var(--ph-gray-line)'}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ transition: 'fill .12s ease, stroke .12s ease' }}
            >
              <path d="M12 2.6l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 18.6l-5.91 3.11 1.13-6.57L2.45 9.54l6.6-.96z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
