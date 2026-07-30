export default function DetailLoading() {
  const shimmer: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--ph-gray-100) 25%, var(--ph-gray-50) 50%, var(--ph-gray-100) 75%)',
    backgroundSize: '200% 100%',
    animation: 'ph-shimmer 1.4s ease infinite',
    borderRadius: 'var(--ph-radius-lg)',
  };

  return (
    <>
      <style>{`
        @keyframes ph-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 0' }}>
        {/* 뒤로 버튼 스켈레톤 */}
        <div style={{ ...shimmer, width: 140, height: 20, marginBottom: 24 }} />

        <div className="ph-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48, alignItems: 'start' }}>
          {/* 왼쪽: 이미지 + 메타 */}
          <div>
            <div style={{ ...shimmer, height: 360, borderRadius: 'var(--ph-radius-xl)' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
              <div style={{ ...shimmer, width: 80, height: 22 }} />
              <div style={{ ...shimmer, width: 60, height: 22 }} />
            </div>
            <div style={{ ...shimmer, width: '70%', height: 36, marginTop: 16 }} />
            <div style={{ ...shimmer, width: '40%', height: 36, marginTop: 8 }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 20, marginBottom: 32 }}>
              <div style={{ ...shimmer, width: 40, height: 20 }} />
              <div style={{ ...shimmer, width: 80, height: 20 }} />
            </div>
            <div style={{ ...shimmer, width: 100, height: 24, marginBottom: 12 }} />
            <div style={{ ...shimmer, width: '100%', height: 18, marginBottom: 8 }} />
            <div style={{ ...shimmer, width: '90%', height: 18, marginBottom: 8 }} />
            <div style={{ ...shimmer, width: '80%', height: 18 }} />
          </div>

          {/* 오른쪽: 구매 카드 스켈레톤 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-lg)', padding: 24 }}>
              <div style={{ ...shimmer, width: 120, height: 36, marginBottom: 8 }} />
              <div style={{ ...shimmer, width: '80%', height: 16, marginBottom: 20 }} />
              <div style={{ ...shimmer, width: '100%', height: 48, marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ ...shimmer, flex: 1, height: 48 }} />
                <div style={{ ...shimmer, flex: 1, height: 48 }} />
              </div>
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ ...shimmer, width: '70%', height: 16 }} />
                ))}
              </div>
            </div>
            <div style={{ border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-lg)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ ...shimmer, width: 18, height: 18, borderRadius: '50%' }} />
                <div style={{ ...shimmer, width: 80, height: 18 }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </>
  );
}
