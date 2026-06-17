'use client';

import { useState } from 'react';

interface FormFieldProps {
  label?: string;
  hint?: string;
  type?: 'input' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  leading?: React.ReactNode;
}

export default function FormField({
  label,
  hint,
  type = 'input',
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 6,
  inputMode,
  leading,
}: FormFieldProps) {
  const [focus, setFocus] = useState(false);

  return (
    <div>
      {label && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text)' }}>{label}</span>
          {hint && <span style={{ fontSize: 12, color: 'var(--ph-text-muted)' }}>{hint}</span>}
        </div>
      )}
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          maxLength={maxLength}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: '1px solid var(--ph-border)',
            borderRadius: 'var(--ph-radius-md)',
            padding: '12px 14px',
            fontFamily: 'var(--ph-font-family)',
            fontSize: 15,
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            color: 'var(--ph-text)',
          }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: `1px solid ${focus ? 'var(--ph-primary)' : 'var(--ph-border)'}`,
            borderRadius: 'var(--ph-radius-md)',
            padding: '0 14px',
            background: 'var(--ph-surface)',
            transition: 'border-color .15s ease',
          }}
        >
          {leading && <span style={{ display: 'flex', color: 'var(--ph-text-muted)' }}>{leading}</span>}
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            placeholder={placeholder}
            maxLength={maxLength}
            inputMode={inputMode}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--ph-font-family)',
              fontSize: 15,
              color: 'var(--ph-text)',
              padding: '11px 0',
              minWidth: 0,
            }}
          />
        </div>
      )}
    </div>
  );
}
