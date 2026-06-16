'use client';

import { Sparkles } from 'lucide-react';

export interface FooterProps {
  go?: (page: string) => void;
}

/* ── Logo ─────────────────────────────────────────────── */

function Logo({ onClick }: { onClick: () => void }) {
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

/* ── 소셜 아이콘 인라인 SVG (lucide 원본 패스) ─────────── */

function TwitterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.7 5.3 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8z"/>
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
    </svg>
  );
}

/* ── Footer ─────────────────────────────────────────────── */

const SOCIAL_ICONS = [
  { key: 'twitter', Icon: TwitterIcon },
  { key: 'instagram', Icon: InstagramIcon },
  { key: 'youtube', Icon: YoutubeIcon },
];

const cols = [
  { h: 'PromptHub', links: ['소개', '채용', '블로그', '고객센터'] },
  { h: '마켓플레이스', links: ['인기 프롬프트', '신규 등록', '카테고리', '크리에이터'] },
  { h: '판매자', links: ['판매 시작하기', '수익 정산', '가이드라인', 'FAQ'] },
];

export default function Footer({ go }: FooterProps) {
  return (
    <footer style={{ borderTop: '1px solid var(--ph-border)', background: 'var(--ph-gray-50)', marginTop: 100 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px', display: 'flex', gap: 64, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 240 }}>
          <Logo onClick={() => go && go('home')} />
          <p style={{ color: 'var(--ph-text-muted)', fontSize: 14, lineHeight: 1.6, marginTop: 16, maxWidth: 250 }}>검증된 AI 프롬프트를 사고파는 가장 쉬운 방법.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {SOCIAL_ICONS.map(({ key, Icon }) => (
              <span key={key} style={{ width: 36, height: 36, borderRadius: 'var(--ph-radius-full)', border: '1px solid var(--ph-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ph-text-muted)' }}>
                <Icon />
              </span>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{c.h}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--ph-text-secondary)', textDecoration: 'none', fontSize: 14 }}>{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--ph-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 32px', color: 'var(--ph-text-muted)', fontSize: 13 }}>© 2026 PromptHub. All rights reserved.</div>
      </div>
    </footer>
  );
}
