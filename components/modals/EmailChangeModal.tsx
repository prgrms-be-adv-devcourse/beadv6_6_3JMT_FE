'use client';

import { useState, type FormEvent } from 'react';
import { AlertCircle, Mail, X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/utils';

interface Props {
  currentEmail: string;
  onClose: () => void;
  // Type signature parameter; the implementation is provided by the parent page.
  // eslint-disable-next-line no-unused-vars
  onSubmit(newEmail: string): Promise<void>;
}

const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default function EmailChangeModal({ currentEmail, onClose, onSubmit }: Props) {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const changeEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const v = email.trim();
    if (!validEmail(v)) { setErr('올바른 이메일 형식이 아니에요'); return; }
    if (v.toLowerCase() === currentEmail.toLowerCase()) { setErr('현재 사용 중인 이메일과 같아요'); return; }

    setErr('');
    setSubmitting(true);
    try {
      await onSubmit(v);
      onClose();
    } catch (error: unknown) {
      setErr(apiErrorMessage(error, '이메일 변경에 실패했어요. 다시 시도해 주세요.'));
    } finally {
      setSubmitting(false);
    }
  };

  const errStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--ph-error)',
  };

  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    fontFamily: 'var(--ph-font-family)', color: 'var(--ph-text)', outline: 'none',
    borderRadius: 'var(--ph-radius-md)',
  };

  return (
    <div
      onClick={() => {
        if (!submitting) onClose();
      }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
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
          maxWidth: 440, width: '100%', padding: 28,
        }}
      >
        {/* ── 헤더 아이콘 + 닫기 ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--ph-radius-full)',
            background: 'var(--ph-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail style={{ width: 22, height: 22, color: 'var(--ph-primary)' }} />
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="닫기"
            style={{
              background: 'none', border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              color: 'var(--ph-text-muted)', padding: 4, lineHeight: 0,
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <form onSubmit={changeEmail}>
          <div style={{ fontSize: 19, fontWeight: 700, margin: '14px 0 6px' }}>이메일 변경</div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ph-text-secondary)', margin: '0 0 20px' }}>
            변경할 이메일 주소를 입력해 주세요.
          </p>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ph-text-muted)', marginBottom: 6 }}>현재 이메일</div>
            <div style={{
              fontSize: 14, fontWeight: 600, color: 'var(--ph-text-secondary)',
              padding: '11px 14px',
              background: 'var(--ph-gray-50)', border: '1px solid var(--ph-border)',
              borderRadius: 'var(--ph-radius-md)',
            }}>
              {currentEmail}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label
              htmlFor="new-email"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ph-text-muted)', marginBottom: 6 }}
            >
              새 이메일
            </label>
            <input
              id="new-email"
              type="email"
              value={email}
              placeholder="you@example.com"
              autoFocus
              disabled={submitting}
              onChange={(e) => { setEmail(e.target.value); setErr(''); }}
              aria-invalid={!!err}
              aria-describedby={err ? 'new-email-error' : undefined}
              style={{
                ...inputBase,
                padding: '11px 14px', fontSize: 14,
                border: `1px solid ${err ? 'var(--ph-error)' : 'var(--ph-border)'}`,
              }}
            />
            {err && (
              <div id="new-email-error" role="alert" style={errStyle}>
                <AlertCircle style={{ width: 15, height: 15 }} />{err}
              </div>
            )}
          </div>

          <div style={{ marginTop: 24 }}>
            <button
              type="submit"
              disabled={!email.trim() || submitting}
              style={{
                width: '100%', padding: '15px 24px',
                background: (!email.trim() || submitting) ? 'var(--ph-text-muted)' : 'var(--ph-primary)',
                color: '#fff', border: 'none', borderRadius: 'var(--ph-radius-md)',
                fontFamily: 'var(--ph-font-family)', fontSize: 17, fontWeight: 700,
                cursor: (!email.trim() || submitting) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {submitting ? '변경 중...' : '이메일 변경'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
