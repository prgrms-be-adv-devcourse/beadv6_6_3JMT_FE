'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, ShieldCheck, X, AlertCircle, Info, ArrowLeft } from 'lucide-react';

interface Props {
  currentEmail: string;
  onClose: () => void;
  onVerified: (newEmail: string) => void;
}

const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function EmailChangeModal({ currentEmail, onClose, onVerified }: Props) {
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [codeErr, setCodeErr] = useState('');
  const [secsLeft, setSecsLeft] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (secsLeft <= 0) return;
    const t = setTimeout(() => setSecsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secsLeft]);

  useEffect(() => {
    if (step === 'verify') codeRef.current?.focus();
  }, [step]);

  const sendCode = () => {
    const v = email.trim();
    if (!validEmail(v)) { setErr('올바른 이메일 형식이 아니에요'); return; }
    if (v.toLowerCase() === currentEmail.toLowerCase()) { setErr('현재 사용 중인 이메일과 같아요'); return; }
    const c = genCode();
    setSentCode(c); setErr(''); setCode(''); setCodeErr(''); setSecsLeft(180); setStep('verify');
  };

  const resend = () => {
    if (secsLeft > 0) return;
    setSentCode(genCode()); setCode(''); setCodeErr(''); setSecsLeft(180);
  };

  const verify = () => {
    if (code.length !== 6) return;
    if (code !== sentCode) { setCodeErr('인증번호가 일치하지 않아요'); return; }
    onVerified(email.trim());
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
      onClick={onClose}
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
            {step === 'input'
              ? <Mail style={{ width: 22, height: 22, color: 'var(--ph-primary)' }} />
              : <ShieldCheck style={{ width: 22, height: 22, color: 'var(--ph-primary)' }} />}
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-muted)', padding: 4, lineHeight: 0 }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* ── Step 1: 이메일 입력 ── */}
        {step === 'input' && (
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, margin: '14px 0 6px' }}>이메일 변경</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ph-text-secondary)', margin: '0 0 20px' }}>
              새 이메일 주소를 입력하면 인증번호를 보내드려요. 인증을 완료해야 변경돼요.
            </p>

            {/* 현재 이메일 (읽기 전용) */}
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

            {/* 새 이메일 입력 */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ph-text-muted)', marginBottom: 6 }}>새 이메일</div>
              <input
                type="email"
                value={email}
                placeholder="you@example.com"
                autoFocus
                onChange={(e) => { setEmail(e.target.value); setErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') sendCode(); }}
                style={{
                  ...inputBase,
                  padding: '11px 14px', fontSize: 14,
                  border: `1px solid ${err ? 'var(--ph-error)' : 'var(--ph-border)'}`,
                }}
              />
              {err && <div style={errStyle}><AlertCircle style={{ width: 15, height: 15 }} />{err}</div>}
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                onClick={sendCode}
                disabled={!email.trim()}
                style={{
                  width: '100%', padding: '15px 24px',
                  background: !email.trim() ? 'var(--ph-text-muted)' : 'var(--ph-primary)',
                  color: '#fff', border: 'none', borderRadius: 'var(--ph-radius-md)',
                  fontFamily: 'var(--ph-font-family)', fontSize: 17, fontWeight: 700,
                  cursor: !email.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                인증번호 받기
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: 인증번호 확인 ── */}
        {step === 'verify' && (
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, margin: '14px 0 6px' }}>인증번호 입력</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ph-text-secondary)', margin: '0 0 16px' }}>
              <strong style={{ color: 'var(--ph-text)', fontWeight: 700 }}>{email.trim()}</strong>으로 보낸 6자리 인증번호를 입력하세요.
            </p>

            {/* 데모 힌트 박스 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', background: 'var(--ph-secondary)',
              borderRadius: 'var(--ph-radius-md)', marginBottom: 18,
              fontSize: 13, color: 'var(--ph-primary)', fontWeight: 600,
            }}>
              <Info style={{ width: 15, height: 15, flexShrink: 0 }} />
              <span>
                데모용 인증번호:{' '}
                <span style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em' }}>{sentCode}</span>
              </span>
            </div>

            {/* 인증번호 입력 + 타이머 */}
            <div style={{ position: 'relative' }}>
              <input
                ref={codeRef}
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setCodeErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') verify(); }}
                placeholder="000000"
                style={{
                  ...inputBase,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  fontSize: 24, fontWeight: 700, letterSpacing: '0.34em',
                  textAlign: 'center', padding: '14px 16px',
                  border: `1px solid ${codeErr ? 'var(--ph-error)' : 'var(--ph-border)'}`,
                }}
              />
              <span style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, fontWeight: 600,
                color: secsLeft > 0 ? 'var(--ph-text-muted)' : 'var(--ph-error)',
                fontFamily: 'ui-monospace, monospace',
                pointerEvents: 'none',
              }}>
                {secsLeft > 0 ? mmss(secsLeft) : '만료'}
              </span>
            </div>
            {codeErr && <div style={errStyle}><AlertCircle style={{ width: 15, height: 15 }} />{codeErr}</div>}

            {/* 뒤로 / 재발송 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <button
                onClick={() => { setStep('input'); setCodeErr(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--ph-text-secondary)',
                  fontFamily: 'var(--ph-font-family)', fontSize: 13, fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0,
                }}
              >
                <ArrowLeft style={{ width: 14, height: 14 }} />이메일 다시 입력
              </button>
              <button
                onClick={resend}
                disabled={secsLeft > 0}
                style={{
                  background: 'none', border: 'none',
                  cursor: secsLeft > 0 ? 'default' : 'pointer',
                  color: secsLeft > 0 ? 'var(--ph-text-muted)' : 'var(--ph-primary)',
                  fontFamily: 'var(--ph-font-family)', fontSize: 13, fontWeight: 600, padding: 0,
                }}
              >
                인증번호 재발송
              </button>
            </div>

            {/* 인증하고 변경하기 */}
            <div style={{ marginTop: 22 }}>
              <button
                onClick={verify}
                disabled={code.length !== 6 || secsLeft <= 0}
                style={{
                  width: '100%', padding: '15px 24px',
                  background: (code.length !== 6 || secsLeft <= 0) ? 'var(--ph-text-muted)' : 'var(--ph-primary)',
                  color: '#fff', border: 'none', borderRadius: 'var(--ph-radius-md)',
                  fontFamily: 'var(--ph-font-family)', fontSize: 17, fontWeight: 700,
                  cursor: (code.length !== 6 || secsLeft <= 0) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                인증하고 변경하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
