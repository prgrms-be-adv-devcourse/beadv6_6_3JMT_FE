'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';
import { ArrowLeft, Store, Eye, Images, Check, CheckCircle2, X, Search } from 'lucide-react';
import FormField from '@/components/ui/FormField';
import PromptCard, { type PromptItem } from '@/components/ui/PromptCard';
import ImageUpload from '@/components/ui/ImageUpload';
import FileUpload from '@/components/ui/FileUpload';
import type { UploadedObject } from '@/lib/upload';
import { useToast } from '@/store/useToastStore';
import { isValidProductPrice } from '@/lib/utils';
import Label from '@/components/ui/Label';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Tag from '@/components/ui/Tag';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import {
  PRODUCT_TYPES, PRODUCT_TYPE_LABEL, PRODUCT_TYPE_TITLE_PLACEHOLDER, PRODUCT_TYPE_DESC_PLACEHOLDER,
  PRODUCT_TYPE_TAG_PLACEHOLDER, PRODUCT_TYPE_TAG_HINT,
  type ProductType,
} from '@/lib/productTypes';

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
  const [uploadedFile, setUploadedFile] = useState<UploadedObject | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<null | 'saved' | 'submitted'>(null);
  const [loading, setLoading] = useState(false);
  // loading(useState)은 리렌더 후에야 반영되므로 같은 tick 안의 두 번째 클릭을 막지 못한다.
  // ref는 즉시 반영되므로 중복 제출 차단은 이걸로 한다(BE#681).
  const submitting = useRef(false);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<UploadedObject | null>(null);
  const [uploadedImages, setUploadedImages] = useState<(UploadedObject | null)[]>(Array(5).fill(null));
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const showToast = useToast();
  const typeLabel = PRODUCT_TYPE_LABEL[productType];

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    const v = tagInput.trim().replace(/^#/, '');
    if (v && !tags.includes(v) && tags.length < 8) setTags([...tags, v]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const saveProduct = async (navigate: boolean) => {
    if (!title.trim()) { showToast(`${typeLabel} 제목을 입력해 주세요`); return; }
    if (!desc.trim()) { showToast('상품 소개를 입력해 주세요'); return; }
    if (!isValidProductPrice(Number(price))) { showToast('가격은 무료(0원) 또는 100원 이상으로 입력해 주세요'); return; }
    // 산출물은 등록할 때만 필수다. 임시저장은 미완성 상태를 담아두는 기능이라
    // 파일 업로드 전에도 저장할 수 있어야 한다.
    if (navigate) {
      if (productType === 'PROMPT' && !body.trim()) { showToast('판매할 프롬프트 본문을 입력해 주세요'); return; }
      if (productType === 'NOTION' && !externalUrl.trim()) { showToast('공유할 노션 링크를 입력해 주세요'); return; }
      if ((productType === 'PPT' || productType === 'EXCEL') && !uploadedFile) { showToast('산출물 파일 업로드가 완료된 뒤 저장해 주세요'); return; }
    }
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    try {
      const res = await api.post(`${API_BASE}/products`, {
        title,
        productType,
        model: productType === 'PROMPT' ? (model.trim() || null) : null,
        amount: Number(price),
        desc,
        content: productType === 'PROMPT' ? body : null,
        fileObjectKey: productType === 'PPT' || productType === 'EXCEL' ? (uploadedFile?.objectKey ?? null) : null,
        externalUrl: productType === 'NOTION' ? externalUrl : null,
        thumbnailObjectKey: uploadedThumbnail?.objectKey ?? null,
        imageObjectKeys: uploadedImages.filter((image): image is UploadedObject => image !== null)
          .map((image) => image.objectKey),
        tags,
      });
      if (navigate) {
        showToast('등록됐어요 · 내 상점에서 검수 요청을 해주세요');
        router.push('/shop');
      } else {
        setStatus('saved');
        showToast('임시저장됐어요');
        // 저장된 초안의 수정 화면으로 넘긴다. 이 화면에 머물면 다음 저장이 또 POST가 되어
        // 상품이 중복 생성되고, 낡은 temp 키를 다시 보내 S3 복사가 실패한다(BE#681).
        const productId = res.data?.data?.productId;
        if (productId) router.push(`/edit/${productId}`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg ?? '저장에 실패했어요. 다시 시도해 주세요');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const submit = () => saveProduct(true);

  const cleanupAndLeave = async () => {
    const objectKeys = [uploadedThumbnail, uploadedFile, ...uploadedImages]
      .filter((u): u is UploadedObject => u !== null)
      .map((u) => u.objectKey);
    if (objectKeys.length > 0) {
      await api.delete(`${API_BASE}/products/images`, { data: objectKeys }).catch(() => {});
    }
    router.push('/shop');
  };

  const handleBack = () => {
    const hasUploads = [uploadedThumbnail, uploadedFile, ...uploadedImages].some((upload) => upload !== null);
    const hasContent = title.trim() || hasUploads;
    if (hasContent) {
      setLeaveDialogOpen(true);
      return;
    }
    router.push('/shop');
  };

  const previewItem: PromptItem = {
    id: 'preview',
    title: title.trim() || `${typeLabel} 제목이 여기에 표시돼요`,
    icon: 'sparkles',
    productType,
    model: model.trim() || '모델 미정',
    amount: price ? Number(price) : 0,
    rating: '신규',
    salesCount: 0,
    seller: '내 상점',
    desc: desc || '',
    thumbnail_url: uploadedThumbnail?.previewUrl ?? undefined,
  };

  const outputLabel = productType === 'PROMPT' ? `${typeLabel} 내용` : productType === 'NOTION' ? `${typeLabel} 링크` : `${typeLabel} 파일`;
  const outputText = productType === 'PROMPT' ? body : productType === 'NOTION' ? externalUrl : (uploadedFile ? '파일이 업로드됐어요' : '');
  const outputPlaceholder = productType === 'PROMPT'
    ? '내용을 입력하면 이곳에서 실제 표시 형태를 확인할 수 있어요.'
    : productType === 'NOTION'
    ? '노션 템플릿 링크를 입력하면 이곳에서 확인할 수 있어요.'
    : '파일을 업로드하면 이곳에서 확인할 수 있어요.';

  return (
    <div className="!px-4 md:!px-8" style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 32px 0' }}>
      {/* 뒤로가기 */}
      <button
        className="min-h-11 md:min-h-0"
        onClick={handleBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-secondary)', fontFamily: 'var(--ph-font-family)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: 0 }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} /> 내 상점으로
      </button>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', borderRadius: 'var(--ph-radius-full)', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            <Store style={{ width: 14, height: 14 }} /> 판매자 · {typeLabel} 등록
          </div>
          <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.015em', margin: 0 }}>새 {typeLabel} 등록</h1>
          <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: '8px 0 0' }}>판매 수수료는 단 15%. 나머지는 모두 판매자의 몫이에요.</p>
        </div>
      </div>

      <div className="!grid-cols-1 md:!grid-cols-[1fr_380px]" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' }}>

        {/* ── 폼 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* 기본 정보 카드 */}
          <Card padding="28px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <FormField label={`${typeLabel} 제목`} hint={`${title.length}/60`} value={title} maxLength={60} onChange={(v) => setTitle(v)} placeholder={PRODUCT_TYPE_TITLE_PLACEHOLDER[productType]} />
              <div>
                <Label>상품 유형</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PRODUCT_TYPES.map((t) => (
                    <Tag key={t.id} selected={productType === t.id} onClick={() => setProductType(t.id)}>{t.label}</Tag>
                  ))}
                </div>
              </div>
              <div className={productType === 'PROMPT' ? '!grid-cols-1 md:!grid-cols-2' : '!grid-cols-1'} style={{ display: 'grid', gridTemplateColumns: productType === 'PROMPT' ? '1fr 1fr' : '1fr', gap: 16 }}>
                {productType === 'PROMPT' && (
                  <FormField label="대상 모델" value={model} onChange={(v) => setModel(v)} placeholder="예: GPT-4o" />
                )}
                <FormField label="가격" value={price} onChange={(v) => setPrice(v.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="4900" leading={<span style={{ fontWeight: 700 }}>₩</span>} />
              </div>
            </div>
          </Card>

          {/* 상품 소개 카드 */}
          <Card padding="28px">
            <FormField
              label="상품 소개"
              hint={`${desc.length}/1000`}
              type="textarea"
              value={desc}
              onChange={(v) => setDesc(v.slice(0, 1000))}
              rows={3}
              placeholder={PRODUCT_TYPE_DESC_PLACEHOLDER[productType]}
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
                <FileUpload value={uploadedFile} onChange={setUploadedFile} productType={productType} />
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
                      placeholder={PRODUCT_TYPE_TAG_PLACEHOLDER[productType]}
                      leading={<span style={{ fontWeight: 700, color: 'var(--ph-text-muted)' }}>#</span>}
                    />
                  </div>
                  <Button variant="secondary" size="sm" type="submit">추가</Button>
                </form>
                <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '10px 0 0', display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.55 }}>
                  <Search style={{ width: 14, height: 14, flexShrink: 0, marginTop: 2 }} />
                  <span>{PRODUCT_TYPE_TAG_HINT[productType]}</span>
                </p>
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
                <Label hint="상품리스트 기준 16:9 · 최대 5MB">대표 썸네일</Label>
                <ImageUpload
                  value={uploadedThumbnail}
                  onChange={setUploadedThumbnail}
                  aspectRatio="16 / 9"
                  placeholder="썸네일을 클릭하거나 드래그해 업로드"
                  purpose="thumbnail"
                />
              </div>

              {/* 소개 이미지 */}
              <div>
                <Label hint="최대 5장">소개 이미지</Label>
                <div className="!grid-cols-2 sm:!grid-cols-3 md:!grid-cols-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  {uploadedImages.map((image, i) => (
                    <ImageUpload
                      key={i}
                      value={image}
                      onChange={(uploaded) => setUploadedImages((previousImages) => {
                        const next = [...previousImages];
                        next[i] = uploaded;
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
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{typeLabel} 소개</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: desc ? 'var(--ph-text-secondary)' : 'var(--ph-text-muted)', whiteSpace: 'pre-wrap', fontFamily: 'var(--ph-font-family)' }}>
              {desc || '상품 소개를 입력하면 이곳에서 확인할 수 있어요.'}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, margin: '18px 0 8px' }}>{outputLabel}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: outputText ? 'var(--ph-text-secondary)' : 'var(--ph-text-muted)', whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto', fontFamily: 'var(--ph-font-family)' }}>
              {outputText || outputPlaceholder}
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
