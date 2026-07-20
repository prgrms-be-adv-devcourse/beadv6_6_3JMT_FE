'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ICON_MAP } from '@/lib/iconMap';

export type CarouselSlide = { caption: string; icon: string; tint: string; imageUrl?: string };

function SlideIcon({ name, style }: { name: string; style?: React.CSSProperties }) {
  const C = ICON_MAP[name];
  return C ? <C style={style} /> : <Sparkles style={style} />;
}

interface Props {
  slides: CarouselSlide[];
  thumbnailUrl?: string | null;
}

export default function ImageCarousel({ slides, thumbnailUrl }: Props) {
  const [idx, setIdx] = useState(0);
  const n = slides.length;
  const s = slides[idx];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setIdx((x) => (x - 1 + n) % n);
      if (e.key === 'ArrowRight') setIdx((x) => (x + 1) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n]);

  const arrowStyle = (dir: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    left:  dir === 'left'  ? 14    : 'auto',
    right: dir === 'right' ? 14    : 'auto',
    width: 42,
    height: 42,
    borderRadius: 'var(--ph-radius-full)',
    border: '1px solid var(--ph-border)',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--ph-text)',
    padding: 0,
  });

  /* 메인 슬라이드 콘텐츠 */
  const renderMain = () => {
    if (idx === 0 && thumbnailUrl) {
      return <Image src={thumbnailUrl} alt={s.caption} fill style={{ objectFit: 'cover' }} />;
    }
    if (idx === 0 && thumbnailUrl === null) {
      return (
        <div style={{ height: '100%', background: s.tint, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <Image src="/images/promy-character.png" alt="대표 이미지" width={140} height={140} style={{ objectFit: 'contain', opacity: 0.85 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text-secondary)' }}>{s.caption}</span>
        </div>
      );
    }
    if (s.imageUrl) {
      return <Image src={s.imageUrl} alt={s.caption} fill style={{ objectFit: 'cover' }} />;
    }
    return (
      <div style={{ height: '100%', background: s.tint, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, transition: 'background .2s ease' }}>
        <SlideIcon name={s.icon} style={{ width: 84, height: 84, color: 'var(--ph-primary)', opacity: 0.85 }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text-secondary)' }}>{s.caption}</span>
      </div>
    );
  };

  /* 썸네일 스트립 한 칸 콘텐츠 */
  const renderThumb = (sl: CarouselSlide, k: number) => {
    if (k === 0 && thumbnailUrl) {
      return <Image src={thumbnailUrl} alt={sl.caption} fill style={{ objectFit: 'cover' }} />;
    }
    if (k === 0 && thumbnailUrl === null) {
      return <Image src="/images/promy-character.png" alt={sl.caption} width={28} height={28} style={{ objectFit: 'contain', opacity: 0.8 }} />;
    }
    if (sl.imageUrl) {
      return <Image src={sl.imageUrl} alt={sl.caption} fill style={{ objectFit: 'cover' }} />;
    }
    return <SlideIcon name={sl.icon} style={{ width: 22, height: 22, color: 'var(--ph-primary)', opacity: 0.8 }} />;
  };

  return (
    <div>
      {/* ── 메인 뷰어 ── */}
      <div style={{ position: 'relative', height: 360, borderRadius: 'var(--ph-radius-xl)', overflow: 'hidden', border: '1px solid var(--ph-border)' }}>
        {renderMain()}

        {n > 1 && (
          <button onClick={() => setIdx((x) => (x - 1 + n) % n)} aria-label="이전 이미지" style={arrowStyle('left')}>
            <ChevronLeft style={{ width: 20, height: 20 }} />
          </button>
        )}
        {n > 1 && (
          <button onClick={() => setIdx((x) => (x + 1) % n)} aria-label="다음 이미지" style={arrowStyle('right')}>
            <ChevronRight style={{ width: 20, height: 20 }} />
          </button>
        )}

        {/* N / N 인디케이터 */}
        <div style={{ position: 'absolute', top: 14, right: 16, fontSize: 12, fontWeight: 600, color: 'var(--ph-text-secondary)', background: 'rgba(255,255,255,0.85)', borderRadius: 'var(--ph-radius-full)', padding: '4px 10px' }}>
          {idx + 1} / {n}
        </div>

        {/* 하단 점 */}
        {n > 1 && (
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {slides.map((_, k) => (
              <span
                key={k}
                onClick={() => setIdx(k)}
                style={{ width: k === idx ? 22 : 7, height: 7, borderRadius: 9999, background: k === idx ? 'var(--ph-primary)' : 'rgba(0,0,0,0.22)', cursor: 'pointer', transition: 'all .15s' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 썸네일 스트립 ── */}
      {n > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {slides.map((sl, k) => (
            <button
              key={k}
              onClick={() => setIdx(k)}
              aria-label={`${k + 1}번 이미지`}
              style={{
                flex: 1,
                height: 66,
                borderRadius: 'var(--ph-radius-md)',
                border: `1px solid ${k === idx ? 'var(--ph-primary)' : 'var(--ph-border)'}`,
                background: sl.tint,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {renderThumb(sl, k)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
