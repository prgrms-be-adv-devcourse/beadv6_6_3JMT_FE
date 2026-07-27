'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload } from 'lucide-react';
import { useToast } from '@/store/useToastStore';
import { uploadViaPresign, type UploadPurpose } from '@/lib/upload';
import { apiErrorMessage } from '@/lib/utils';

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  height?: number;
  placeholder?: string;
  purpose?: UploadPurpose;
}

export default function ImageUpload({
  value,
  onChange,
  height = 220,
  placeholder = '이미지를 클릭하거나 드래그해 업로드',
  purpose = 'image',
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const showToast = useToast();

  const compact = height < 140;

  const process = async (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showToast('JPG 또는 PNG 이미지만 업로드할 수 있어요');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('파일 크기가 5MB를 초과해요');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadViaPresign(file, purpose);
      onChange(url);
    } catch (err: unknown) {
      showToast(apiErrorMessage(err, '이미지 업로드에 실패했어요. 다시 시도해 주세요'));
    } finally {
      setUploading(false);
    }
  };

  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (f) process(f);
  };

  if (uploading) {
    return (
      <div style={{ width: '100%', height, borderRadius: 12, border: '1.5px dashed var(--ph-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ph-gray-50)' }}>
        <span style={{ fontSize: compact ? 11 : 13, color: 'var(--ph-text-muted)' }}>업로드 중...</span>
      </div>
    );
  }

  const borderColor = dragging || hovered ? 'var(--ph-primary)' : 'var(--ph-border)';

  if (value) {
    return (
      <div style={{ position: 'relative', width: '100%', height, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--ph-border)' }}>
        <Image src={value} alt="업로드 이미지" fill style={{ objectFit: 'cover' }} unoptimized />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="이미지 삭제"
          style={{
            position: 'absolute', top: 6, right: 6,
            width: compact ? 22 : 28, height: compact ? 22 : 28,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff',
          }}
        >
          <X style={{ width: compact ? 11 : 14, height: compact ? 11 : 14 }} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => inputRef.current?.click()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setDragging(false); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
        style={{
          width: '100%', height, boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: compact ? 4 : 8,
          border: `1.5px dashed ${borderColor}`,
          borderRadius: 12, cursor: 'pointer',
          background: dragging ? 'var(--ph-secondary)' : 'var(--ph-gray-50)',
          transition: 'border-color .15s ease, background-color .15s ease',
          userSelect: 'none',
        }}
      >
        <Upload style={{ width: compact ? 16 : 22, height: compact ? 16 : 22, color: 'var(--ph-text-muted)', opacity: 0.6 } as React.CSSProperties} />
        <span style={{ fontSize: compact ? 11 : 13, color: 'var(--ph-text-muted)', textAlign: 'center', padding: '0 8px', lineHeight: 1.4 }}>
          {placeholder}
        </span>
        {!compact && (
          <span style={{ fontSize: 11, color: 'var(--ph-text-muted)', opacity: 0.65 }}>
            JPG · PNG · 최대 5MB
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }}
        style={{ display: 'none' }}
      />
    </>
  );
}
