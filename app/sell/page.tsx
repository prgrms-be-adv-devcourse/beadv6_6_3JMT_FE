'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';
import { ArrowLeft, Store, Eye, Images, Check, CheckCircle2, X } from 'lucide-react';
import FormField from '@/components/ui/FormField';
import PromptCard, { type PromptItem } from '@/components/ui/PromptCard';
import ImageUpload from '@/components/ui/ImageUpload';
import FileUpload from '@/components/ui/FileUpload';
import { useToast } from '@/store/useToastStore';
import Label from '@/components/ui/Label';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Tag from '@/components/ui/Tag';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { PRODUCT_TYPES, type ProductType } from '@/lib/productTypes';

/* ── Input ───────────────────────────────────────────────────────────── */

function Input({
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode,
  leading,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  leading?: React.ReactNode;
}) {
  const [focus, setFocus] = useState(false);
  return (
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
        onChange={onChange}
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
  );
}

/* ── SellScreen ──────────────────────────────────────────────────────── */

export default function SellPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [productType, setProductType] = useState<ProductType>('PROMPT');
  const [model, setModel] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [body, setBody] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<null | 'saved' | 'submitted'>(null);
  const [loading, setLoading] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<(string | null)[]>(Array(5).fill(null));
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const showToast = useToast();

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    const v = tagInput.trim().replace(/^#/, '');
    if (v && !tags.includes(v) && tags.length < 8) setTags([...tags, v]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const saveProduct = async (navigate: boolean) => {
    if (!title.trim()) { showToast('프롬프트 제목을 입력해 주세요'); return; }
    if (loading) return;
    setLoading(true);
    try {
      await api.post(`${API_BASE}/sellers/me/products`, {
        title,
        productType,
        model,
        amount: Number(price),
        desc,
        content: productType === 'PROMPT' ? body : null,
        fileUrl: productType === 'PPT' || productType === 'EXCEL' ? fileUrl : null,
        externalUrl: productType === 'NOTION' ? externalUrl : null,
        thumbnailUrl: thumbUrl,
        imageUrls: galleryUrls.filter((u): u is string => u !== null),
        tags,
      });
      if (navigate) {
        showToast('등록됐어요 · 내 상점에서 검수 요청을 해주세요');
        router.push('/shop');
      } else {
        setStatus('saved');
        showToast('임시저장됐어요');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg ?? '저장에 실패했어요. 다시 시도해 주세요');
    } finally {
      setLoading(false);
    }
  };

  const submit = () => saveProduct(true);

  const cleanupAndLeave = async () => {
    const uploadedUrls = [thumbUrl, fileUrl, ...galleryUrls].filter((u): u is string => u !== null);
    if (uploadedUrls.length > 0) {
      await api.delete(`${API_BASE}/sellers/me/products/images`, { data: uploadedUrls }).catch(() => {});
    }
    router.push('/shop');
  };

  const handleBack = () => {
    const uploadedUrls = [thumbUrl, fileUrl, ...galleryUrls].filter((u): u is string => u !== null);
    const hasContent = title.trim() || uploadedUrls.length > 0;
    if (hasContent) {
      setLeaveDialogOpen(true);
      return;
    }
    router.push('/shop');
  };

  const previewItem: PromptItem = {
    id: 'preview',
    title: title.trim() || '프롬프트 제목이 여기에 표시돼요',
    icon: 'sparkles',
    productType,
    model: model.trim() || '모델 미정',
    amount: price ? Number(price) : 0,
    rating: '신규',
    salesCount: 0,
    seller: '내 상점',
    desc: desc || '',
    thumbnail_url: thumbUrl ?? undefined,
  };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 32px 0' }}>
      {/* 뒤로가기 */}
      <button
        onClick={handleBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-secondary)', fontFamily: 'var(--ph-font-family)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: 0 }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} /> 내 상점으로
      </button>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', borderRadius: 'var(--ph-radius-full)', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            <Store style={{ width: 14, height: 14 }} /> 판매자 · 프롬프트 등록
          </div>
          <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.015em', margin: 0 }}>새 프롬프트 등록</h1>
          <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: '8px 0 0' }}>판매 수수료는 단 15%. 나머지는 모두 판매자의 몫이에요.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' }}>

        {/* ── 폼 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* 기본 정보 카드 */}
          <Card padding="28px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <FormField label="프롬프트 제목" hint={`${title.length}/60`} value={title} maxLength={60} onChange={(v) => setTitle(v)} placeholder="예: 전환율 높이는 랜딩 카피 작성" />
              <div>
                <Label>상품 유형</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PRODUCT_TYPES.map((t) => (
                    <Tag key={t.id} selected={productType === t.id} onClick={() => setProductType(t.id)}>{t.label}</Tag>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="대상 모델" value={model} onChange={(v) => setModel(v)} placeholder="예: GPT-4o" />
                <FormField label="가격" value={price} onChange={(v) => setPrice(v.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="4900" leading={<span style={{ fontWeight: 700 }}>₩</span>} />
              </div>
            </div>
          </Card>

          {/* 상품 소개 카드 */}
          <Card padding="28px">
            <FormField
              label="상품 소개"
              hint={`${desc.length}/200`}
              type="textarea"
              value={desc}
              onChange={(v) => setDesc(v.slice(0, 200))}
              rows={3}
              placeholder="상품 목록에 표시되는 짧은 소개 문구를 입력하세요. 예: 전환율 높이는 랜딩 카피를 단계별로 만들어 드립니다."
            />
          </Card>

          {/* 유형별 산출물 카드 */}
          <Card padding="28px">
            {productType === 'PROMPT' && (
              <>
                <FormField
                  label="프롬프트 내용"
                  hint={`${body.length}자`}
                  type="textarea"
                  value={body}
                  onChange={(v) => setBody(v)}
                  rows={9}
                  placeholder={'실제 판매할 프롬프트 본문을 입력하세요.\n\n예) 당신은 전문 카피라이터입니다. 아래 제품 정보를 바탕으로...\n- 타깃:\n- 톤앤매너:\n- 출력 형식:'}
                />
                <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye style={{ width: 14, height: 14 }} /> 구매 후 공개되는 실제 프롬프트 원문이에요.
                </p>
              </>
            )}

            {(productType === 'PPT' || productType === 'EXCEL') && (
              <div>
                <Label>산출물 파일</Label>
                <FileUpload value={fileUrl} onChange={setFileUrl} productType={productType} />
                <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye style={{ width: 14, height: 14 }} /> 구매 후 구매자가 다운로드하는 실제 파일이에요.
                </p>
              </div>
            )}

            {productType === 'NOTION' && (
              <div>
                <Label>노션 템플릿 링크</Label>
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://www.notion.so/..."
                />
                <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye style={{ width: 14, height: 14 }} /> 구매 후 구매자에게 공유되는 노션 템플릿 링크예요.
                </p>
              </div>
            )}
          </Card>

          {/* 태그 & 이미지 카드 */}
          <Card padding="28px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* 태그 */}
              <div>
                <Label hint={`${tags.length}/8`}>태그</Label>
                <form onSubmit={addTag} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="태그를 입력하고 Enter (예: 카피라이팅)"
                      leading={<span style={{ fontWeight: 700, color: 'var(--ph-text-muted)' }}>#</span>}
                    />
                  </div>
                  <Button variant="secondary" size="sm" type="submit">추가</Button>
                </form>
                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {tags.map((t) => (
                      <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px 6px 12px', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', borderRadius: 'var(--ph-radius-full)', fontSize: 13, fontWeight: 600 }}>
                        #{t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          aria-label="태그 삭제"
                          style={{ display: 'inline-flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-primary)', padding: 0 }}
                        >
                          <X style={{ width: 14, height: 14 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 대표 썸네일 */}
              <div>
                <Label hint="권장 4:3 · 최대 5MB">대표 썸네일</Label>
                <ImageUpload
                  value={thumbUrl}
                  onChange={setThumbUrl}
                  height={220}
                  placeholder="썸네일을 클릭하거나 드래그해 업로드"
                  purpose="thumbnail"
                />
              </div>

              {/* 소개 이미지 */}
              <div>
                <Label hint="최대 5장">소개 이미지</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  {galleryUrls.map((url, i) => (
                    <ImageUpload
                      key={i}
                      value={url}
                      onChange={(v) => setGalleryUrls((prev) => {
                        const next = [...prev];
                        next[i] = v;
                        return next;
                      })}
                      height={96}
                      placeholder="+ 추가"
                    />
                  ))}
                </div>
                <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Images style={{ width: 14, height: 14 }} /> 예시 결과·사용법 이미지를 추가하면, 구매자가 상세 페이지에서 넘겨보며 확인할 수 있어요.
                </p>
              </div>
            </div>
          </Card>

          {/* 제출 버튼 영역 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
            {status === 'saved' && (
              <span style={{ color: 'var(--ph-text-secondary)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check style={{ width: 16, height: 16 }} /> 임시저장됐어요
              </span>
            )}
            {status === 'submitted' && (
              <span style={{ color: 'var(--ph-primary)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 style={{ width: 16, height: 16 }} /> 등록 검토 요청이 접수됐어요
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <Button variant="secondary" size="lg" disabled={loading} onClick={() => saveProduct(false)}>임시저장</Button>
              <Button variant="solid" size="lg" disabled={loading} onClick={submit}>{loading ? '등록 중...' : '등록하기'}</Button>
            </div>
          </div>
        </div>

        {/* ── 라이브 미리보기 ── */}
        <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ph-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye style={{ width: 15, height: 15 }} /> 미리보기
          </div>

          {/* 프롬프트 카드 미리보기 — PromptCard 컴포넌트 재사용 */}
          <PromptCard p={previewItem} />

          {/* 내용 미리보기 */}
          <Card padding="16px">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>프롬프트 내용</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: body ? 'var(--ph-text-secondary)' : 'var(--ph-text-muted)', whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto', fontFamily: 'var(--ph-font-family)' }}>
              {body || '내용을 입력하면 이곳에서 실제 표시 형태를 확인할 수 있어요.'}
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                {tags.map((t) => <span key={t} style={{ fontSize: 12, color: 'var(--ph-text-muted)' }}>#{t}</span>)}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div style={{ height: 80 }} />

      <ConfirmDialog
        open={leaveDialogOpen}
        title="작성 중인 내용이 사라집니다"
        description="저장하지 않은 변경 내용과 이미지가 삭제됩니다."
        confirmLabel="나가기"
        cancelLabel="계속 작성"
        confirmVariant="danger"
        titleAlign="center"
        onConfirm={cleanupAndLeave}
        onCancel={() => setLeaveDialogOpen(false)}
      />

    </div>
  );
}
