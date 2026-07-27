'use client';

import { useRef, useState } from 'react';
import { Upload, FileCheck2, X } from 'lucide-react';
import { useToast } from '@/store/useToastStore';
import { uploadViaPresign } from '@/lib/upload';
import { apiErrorMessage } from '@/lib/utils';

interface Props {
  value?: string | null; // 업로드된 fileUrl
  onChange: (url: string | null) => void;
  productType: 'PPT' | 'EXCEL';
}

const ACCEPT: Record<Props['productType'], string> = {
  PPT: '.pptx,.ppt',
  EXCEL: '.xlsx,.xls',
};

const HINT: Record<Props['productType'], string> = {
  PPT: 'PPTX · PPT',
  EXCEL: 'XLSX · XLS',
};

export default function FileUpload({ value, onChange, productType }: Props) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const showToast = useToast();

  const process = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadViaPresign(file, 'file', productType);
      setFileName(file.name);
      onChange(url);
    } catch (err: unknown) {
      showToast(apiErrorMessage(err, '파일 업로드에 실패했어요. 허용된 형식인지 확인해 주세요'));
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setFileName(null);
    onChange(null);
  };

  if (uploading) {
    return (
      <div style={boxStyle('var(--ph-border)')}>
        <span style={{ fontSize: 13, color: 'var(--ph-text-muted)' }}>업로드 중...</span>
      </div>
    );
  }

  if (value) {
    return (
      <div style={{ ...boxStyle('var(--ph-primary)'), justifyContent: 'space-between', padding: '0 16px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--ph-text)', fontSize: 14, fontWeight: 600, minWidth: 0 }}>
          <FileCheck2 style={{ width: 18, height: 18, color: 'var(--ph-primary)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fileName ?? '업로드된 파일'}
          </span>
        </span>
        <button
          type="button"
          onClick={clear}
          aria-label="파일 삭제"
          style={{ display: 'inline-flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-muted)', padding: 4 }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div onClick={() => inputRef.current?.click()} style={{ ...boxStyle('var(--ph-border)'), cursor: 'pointer', gap: 8, flexDirection: 'column' }}>
        <Upload style={{ width: 20, height: 20, color: 'var(--ph-text-muted)', opacity: 0.6 } as React.CSSProperties} />
        <span style={{ fontSize: 13, color: 'var(--ph-text-muted)' }}>산출물 파일을 클릭해 업로드</span>
        <span style={{ fontSize: 11, color: 'var(--ph-text-muted)', opacity: 0.65 }}>{HINT[productType]}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[productType]}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) process(f);
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />
    </>
  );
}

function boxStyle(borderColor: string): React.CSSProperties {
  return {
    width: '100%',
    height: 120,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1.5px dashed ${borderColor}`,
    borderRadius: 12,
    background: 'var(--ph-gray-50)',
    userSelect: 'none',
  };
}
