'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';
import {
  ArrowLeft, Pencil, History,
  Eye, Images, X, Store, Search,
} from 'lucide-react';
import FormField from '@/components/ui/FormField';
import PromptCard, { type PromptItem } from '@/components/ui/PromptCard';
import ImageUpload from '@/components/ui/ImageUpload';
import FileUpload from '@/components/ui/FileUpload';
import { isTempObjectKey, type UploadedObject } from '@/lib/upload';
import { useToast } from '@/store/useToastStore';
import { apiErrorMessage, isValidProductPrice } from '@/lib/utils';
import Label from '@/components/ui/Label';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import {
  PRODUCT_TYPE_LABEL, PRODUCT_TYPE_TITLE_PLACEHOLDER, PRODUCT_TYPE_DESC_PLACEHOLDER,
  PRODUCT_TYPE_CHANGE_PLACEHOLDER, PRODUCT_TYPE_TAG_PLACEHOLDER, PRODUCT_TYPE_TAG_HINT,
  PRODUCT_TYPE_PATCH_DESC, PRODUCT_TYPE_MAJOR_DESC,
  type ProductType,
} from '@/lib/productTypes';

/* ── Types ─────────────────────────────────────────────────────────── */

type Version = { ver: string; date: string; note: string };

type Prompt = {
  id: string;
  title: string;
  productType: string;
  model: string;
  amount: number;
  desc: string;
  content: string;
  fileUrl?: string | null;
  fileObjectKey?: string | null;
  externalUrl?: string | null;
  status?: string;
  thumbnailUrl?: string | null;
  thumbnailObjectKey?: string | null;
  imageUrls?: string[];
  imageObjectKeys?: string[];
  tags?: string[];
  versions?: Version[];
  liveVersion?: string | null;
};

/* ── Badge ───────────────────────────────────────────────────────────── */

function Badge({
  tone = 'blue',
  soft = true,
  children,
  style,
}: {
  tone?: 'blue' | 'neutral';
  soft?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const bg =
    tone === 'blue' && !soft ? 'var(--ph-primary)'
    : tone === 'blue' ? 'var(--ph-secondary)'
    : 'var(--ph-gray-100)';
  const fg =
    tone === 'blue' && !soft ? '#fff'
    : tone === 'blue' ? 'var(--ph-primary)'
    : 'var(--ph-gray-600)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', background: bg, color: fg, fontFamily: 'var(--ph-font-family)', fontSize: 13, fontWeight: 600, lineHeight: 1, padding: '5px 9px', borderRadius: 'var(--ph-radius-full)', whiteSpace: 'nowrap', ...style }}>
      {children}
    </span>
  );
}

/* ── Input ───────────────────────────────────────────────────────────── */

function Input({ value, onChange, placeholder, leading }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  leading?: React.ReactNode;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${focus ? 'var(--ph-primary)' : 'var(--ph-border)'}`, borderRadius: 'var(--ph-radius-md)', padding: '0 14px', background: 'var(--ph-surface)', transition: 'border-color .15s ease' }}>
      {leading && <span style={{ display: 'flex', color: 'var(--ph-text-muted)' }}>{leading}</span>}
      <input
        value={value}
        onChange={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--ph-font-family)', fontSize: 15, color: 'var(--ph-text)', padding: '11px 0', minWidth: 0 }}
      />
    </div>
  );
}

/** 순서까지 같아야 같은 값이다 — BE의 변경 판정도 순서를 포함한 exact list로 비교한다. */
function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** 버전 유형 카드에 "v1.1 → v2.0" 미리보기를 보여주기 위한 표시용 계산이다 — 실제 다음 버전은 BE가 정한다. */
function previewNextVersion(current: string, isMajor: boolean): string {
  const [major, patch] = current.split('.').map(Number);
  return isMajor ? `${major + 1}.0` : `${major}.${patch + 1}`;
}

/** 저장 응답의 version·status로 안내 문구를 정한다. */
function successMessage(data: { version: string; status: string }): string {
  if (data.status === 'REJECTED') return '반려된 상품을 수정했어요 · 내 상점에서 다시 검수를 요청해 주세요';
  if (data.status === 'DRAFT') return `v${data.version} 임시저장 내용이 저장됐어요.`;
  if (data.status === 'PENDING_REVIEW') return `v${data.version}으로 저장됐어요 · 검수 후 판매에 반영됩니다.`;
  return `v${data.version} 수정사항이 바로 반영됐어요.`;
}

/* ── EditScreen ──────────────────────────────────────────────────────── */

function EditScreen({ id, prompt, versions }: { id: string; prompt: Prompt; versions: Version[] }) {
  const router = useRouter();
  const isDraft = prompt.status === 'DRAFT';
  // 판매 후 반려된 row는 같은 version만 보정한다 — 새 버전 선택·변경 사유 입력은 여기서 숨긴다.
  const isRejected = prompt.status === 'REJECTED';

  const [title, setTitle] = useState(prompt.title);
  // 상품 유형은 등록 시 한 번 정하고 수정 화면에서는 바꾸지 않는다. state가 아니라 상수로
  // 두어 setter 자체가 없게 한다.
  const productType = prompt.productType as ProductType;
  const [model, setModel] = useState(prompt.model);
  const [price, setPrice] = useState(prompt.amount === 0 ? '0' : String(prompt.amount));
  const [desc, setDesc] = useState(prompt.desc);
  const [body, setBody] = useState(prompt.content);
  const [uploadedFile, setUploadedFile] = useState<UploadedObject | null>(
    prompt.fileObjectKey ? { objectKey: prompt.fileObjectKey, previewUrl: prompt.fileUrl ?? '' } : null
  );
  const [externalUrl, setExternalUrl] = useState(prompt.externalUrl ?? '');
  const [tags, setTags] = useState<string[]>(prompt.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [uploadedThumbnail, setUploadedThumbnail] = useState<UploadedObject | null>(
    prompt.thumbnailObjectKey ? { objectKey: prompt.thumbnailObjectKey, previewUrl: prompt.thumbnailUrl ?? '' } : null
  );
  // 미리보기 URL(previewUrl)과 수정 요청용 key(objectKey)는 같은 인덱스로 정렬돼 내려온다.
  const initGallery = (urls?: string[], keys?: string[]): (UploadedObject | null)[] => {
    const base: (UploadedObject | null)[] = Array(5).fill(null);
    keys?.forEach((objectKey, i) => {
      if (i < 5 && objectKey) base[i] = { objectKey, previewUrl: urls?.[i] ?? '' };
    });
    return base;
  };
  const [uploadedImages, setUploadedImages] = useState<(UploadedObject | null)[]>(
    () => initGallery(prompt.imageUrls, prompt.imageObjectKeys)
  );
  const [changeReason, setChangeReason] = useState('');
  const [noteErr, setNoteErr] = useState(false);
  const [saving, setSaving] = useState(false);
  // saving(useState)은 리렌더 후에야 반영되므로 같은 tick 안의 두 번째 클릭을 막지 못한다.
  // 같은 수정이 두 번 나가면 버전이 두 개 생기므로 ref로 차단한다(BE#681).
  const submitting = useRef(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const showToast = useToast();
  const typeLabel = PRODUCT_TYPE_LABEL[productType];

  const curVer = (versions[0]?.ver ?? '1.0').replace(/^v/, '');

  // BE의 determineVersionType과 같은 기준이다 — 사용자가 MAJOR/PATCH를 고르지는 않지만,
  // 이 수정이 검수를 타는지 저장 전에 미리 보여주기 위해 FE에서도 같은 판정을 계산해둔다.
  const isMajorChange = (productType === 'PROMPT' && body !== prompt.content)
    || (productType === 'NOTION' && externalUrl !== (prompt.externalUrl ?? ''))
    || ((productType === 'PPT' || productType === 'EXCEL')
      && (uploadedFile?.objectKey ?? null) !== (prompt.fileObjectKey ?? null))
    || (Number(price) === 0) !== (prompt.amount === 0);

  // BE도 no-op이면 저장·이벤트를 만들지 않는다 — 저장 버튼 비활성화와 changeReason 필수 여부를 이 값으로 정한다.
  const isDirty = title !== prompt.title
    || desc !== prompt.desc
    || Number(price) !== prompt.amount
    || (productType === 'PROMPT' && (model !== prompt.model || body !== prompt.content))
    || (productType === 'NOTION' && externalUrl !== (prompt.externalUrl ?? ''))
    || ((productType === 'PPT' || productType === 'EXCEL')
      && (uploadedFile?.objectKey ?? null) !== (prompt.fileObjectKey ?? null))
    || (uploadedThumbnail?.objectKey ?? null) !== (prompt.thumbnailObjectKey ?? null)
    || !sameList(uploadedImages.filter((i): i is UploadedObject => i !== null).map((i) => i.objectKey), prompt.imageObjectKeys ?? [])
    || !sameList(tags, prompt.tags ?? []);

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    const v = tagInput.trim().replace(/^#/, '');
    if (v && !tags.includes(v) && tags.length < 8) setTags([...tags, v]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const save = async () => {
    if (!title.trim()) { showToast(`${typeLabel} 제목을 입력해 주세요`); return; }
    if (!desc.trim()) { showToast('상품 소개를 입력해 주세요'); return; }
    if (!isValidProductPrice(Number(price))) { showToast('가격은 무료(0원) 또는 100원 이상으로 입력해 주세요'); return; }
    // 산출물 필수는 판매 중인 상품에만 적용한다. DRAFT 저장은 등록 화면의 임시저장과
    // 같은 성격이라 미완성 상태로도 저장할 수 있어야 한다.
    if (!isDraft) {
      if (productType === 'PROMPT' && !body.trim()) { showToast('판매할 프롬프트 본문을 입력해 주세요'); return; }
      if (productType === 'NOTION' && !externalUrl.trim()) { showToast('공유할 노션 링크를 입력해 주세요'); return; }
      if ((productType === 'PPT' || productType === 'EXCEL') && !uploadedFile) { showToast('산출물 파일 업로드가 완료된 뒤 저장해 주세요'); return; }
    }
    // no-op 저장은 애초에 저장 버튼이 비활성화돼 있어 이 분기까지 오지 않는다.
    if (!isDraft && !isRejected && isDirty && !changeReason.trim()) {
      setNoteErr(true);
      showToast('변경 내용을 입력해 주세요');
      return;
    }
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      const res = await api.patch(`${API_BASE}/products/${id}`, {
        title, productType,
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
        ...(isDraft || isRejected ? {} : { changeReason }),
      });
      showToast(successMessage(res.data.data));
      setTimeout(() => router.push('/shop'), 1200);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      // 메시지 소유권은 BE에 둔다 — 실패 사유(P009 충돌·검수 중 등)는 BE 응답 문구를 그대로 보여준다.
      if (status === 403) {
        showToast('본인의 상품만 수정할 수 있어요');
      } else {
        showToast(msg ?? '저장에 실패했어요. 다시 시도해 주세요');
      }
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const cleanupAndCancel = async () => {
    const tempObjectKeys = [uploadedThumbnail, uploadedFile, ...uploadedImages]
      .filter((u): u is UploadedObject => !!u && isTempObjectKey(u.objectKey))
      .map((u) => u.objectKey);
    if (tempObjectKeys.length > 0) {
      await api.delete(`${API_BASE}/products/images`, { data: tempObjectKeys }).catch(() => {});
    }
    router.push('/shop');
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
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
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 32px 0' }}>
      {/* 뒤로가기 */}
      <button
        onClick={handleCancel}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-secondary)', fontFamily: 'var(--ph-font-family)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: 0 }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} /> 내 상점으로
      </button>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', borderRadius: 'var(--ph-radius-full)', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            <Pencil style={{ width: 14, height: 14 }} /> {typeLabel} 수정
          </div>
          <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.015em', margin: 0 }}>{typeLabel} 수정</h1>
          {!isDraft && (
            isRejected ? (
              <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Badge tone="blue" soft={false}>v{curVer}</Badge>을 수정합니다. 저장 후 내 상점에서 다시 검수를 요청해 주세요.
                {prompt.liveVersion && (
                  <>
                    현재 <Badge tone="neutral">v{prompt.liveVersion}</Badge>이 판매 중이에요.
                  </>
                )}
              </p>
            ) : (
              <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                현재 <Badge tone="neutral">v{curVer}</Badge>에서 저장합니다. 무엇이 바뀌었는지에 따라 바로
                적용되거나 검수 후 반영돼요.
              </p>
            )
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' }}>

        {/* ── 폼 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* 기본 정보 카드 */}
          <Card padding="28px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <FormField label={`${typeLabel} 제목`} hint={`${title.length}/60`} value={title} maxLength={60} onChange={(v) => setTitle(v)} placeholder={PRODUCT_TYPE_TITLE_PLACEHOLDER[productType]} />
              {/* 유형에 따라 입력 필드(본문/파일/링크)와 전송 페이로드가 달라지므로 수정 화면에서는
                  선택하지 않고 현재 유형만 읽기 전용으로 보여준다. */}
              <div>
                <Label hint="등록 후 변경할 수 없어요">상품 유형</Label>
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 14, fontWeight: 600, lineHeight: 1, padding: '9px 14px', borderRadius: 'var(--ph-radius-full)', background: 'var(--ph-secondary)', color: 'var(--ph-primary)' }}>
                  {typeLabel}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: productType === 'PROMPT' ? '1fr 1fr' : '1fr', gap: 16 }}>
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
                  placeholder={'실제 판매할 프롬프트 본문을 입력하세요.\n\n예) 당신은 전문 카피라이터입니다...'}
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
                <ImageUpload value={uploadedThumbnail} onChange={setUploadedThumbnail} aspectRatio="16 / 9" placeholder="썸네일을 클릭하거나 드래그해 업로드" purpose="thumbnail" />
              </div>

              {/* 소개 이미지 */}
              <div>
                <Label hint="최대 5장">소개 이미지</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
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
                  <Images style={{ width: 14, height: 14 }} /> 예시 결과·사용법 이미지를 추가하면 구매자가 상세 페이지에서 확인할 수 있어요.
                </p>
              </div>
            </div>
          </Card>

          {/* 변경 내용 — DRAFT·REJECTED는 같은 row·version을 그대로 쓰므로 제외한다. */}
          {!isDraft && !isRejected && (
            <Card padding="28px" style={{ border: `1px solid ${noteErr ? 'var(--ph-error)' : 'var(--ph-border)'}` }}>
              {/* 사용자가 고르진 않지만, 이 수정이 결과적으로 PATCH인지 MAJOR인지는 처음부터
                  보여준다 — MAJOR인 줄 모르고 저장했다가 갑자기 검수 대기로 빠지면 당황하므로. */}
              <div style={{ marginBottom: 20 }}>
                <Label>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <History style={{ width: 16, height: 16, color: 'var(--ph-primary)' }} /> 버전 유형
                  </span>
                </Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {(['PATCH', 'MAJOR'] as const).map((type) => {
                    const sel = isMajorChange === (type === 'MAJOR');
                    const isPatch = type === 'PATCH';
                    return (
                      <div
                        key={type}
                        style={{ textAlign: 'left', padding: '14px 16px', border: `1.5px solid ${sel ? 'var(--ph-primary)' : 'var(--ph-border)'}`, borderRadius: 'var(--ph-radius-md)', background: sel ? 'var(--ph-secondary)' : 'var(--ph-surface)', opacity: sel ? 1 : 0.5 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${sel ? 'var(--ph-primary)' : 'var(--ph-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ph-primary)' }} />}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ph-text)' }}>{type}</span>
                          <span style={{ fontSize: 12, color: 'var(--ph-text-muted)' }}>v{curVer} → v{previewNextVersion(curVer, type === 'MAJOR')}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ph-text-secondary)', lineHeight: 1.4, paddingLeft: 24 }}>
                          {isPatch ? PRODUCT_TYPE_PATCH_DESC[productType] : PRODUCT_TYPE_MAJOR_DESC[productType]}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, paddingLeft: 24, marginTop: 5, color: isPatch ? 'var(--ph-primary)' : '#f59e0b' }}>
                          {isPatch ? '✓ 바로 적용돼요' : '⏱ 검수 후 적용돼요'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Label hint={`${changeReason.length}/500${isDirty ? ' · 필수' : ''}`}>변경 내용</Label>
              <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '0 0 12px' }}>
                이번 수정에서 무엇이 바뀌었는지 적어 주세요. 실제로 내용이 달라지면 구매자에게 버전
                기록으로 표시돼요.
              </p>
              <textarea
                value={changeReason}
                onChange={(e) => { setChangeReason(e.target.value); setNoteErr(false); }}
                maxLength={500}
                rows={3}
                placeholder={PRODUCT_TYPE_CHANGE_PLACEHOLDER[productType]}
                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${noteErr ? 'var(--ph-error)' : 'var(--ph-border)'}`, borderRadius: 'var(--ph-radius-md)', padding: '12px 14px', fontFamily: 'var(--ph-font-family)', fontSize: 15, lineHeight: 1.6, resize: 'vertical', outline: 'none', color: 'var(--ph-text)' }}
              />
              {noteErr && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--ph-error)' }}>
                  변경 내용은 필수예요
                </div>
              )}
            </Card>
          )}

          {/* 버튼 영역 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <Button variant="secondary" size="lg" onClick={handleCancel}>취소</Button>
              <Button
                variant="solid"
                size="lg"
                disabled={saving || !title.trim() || !desc.trim() || (!isDraft && !isRejected && !isDirty)}
                onClick={save}
              >
                {saving ? '저장 중...' : isDraft ? '저장' : isRejected ? '수정 내용 저장' : !isDirty ? '변경 없음' : '저장'}
              </Button>
            </div>
          </div>
        </div>

        {/* ── 라이브 미리보기 ── */}
        <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ph-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye style={{ width: 15, height: 15 }} /> 미리보기
          </div>
          <PromptCard p={previewItem} />
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
        open={cancelDialogOpen}
        title="수정 중인 내용이 사라집니다"
        description="저장하지 않은 변경 내용과 이미지가 삭제됩니다."
        confirmLabel="나가기"
        cancelLabel="계속 수정"
        confirmVariant="danger"
        titleAlign="center"
        onConfirm={cleanupAndCancel}
        onCancel={() => setCancelDialogOpen(false)}
      />
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function EditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? '';

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`${API_BASE}/products/${id}/sellers/me`)
      .then((res) => {
        const d = res.data.data;
        setPrompt({
          id: d.productId,
          title: d.title,
          productType: d.productType ?? 'PROMPT',
          model: d.model ?? '',
          amount: d.amount,
          desc: d.desc ?? '',
          content: d.content ?? '',
          fileUrl: d.fileUrl ?? null,
          fileObjectKey: d.fileObjectKey ?? null,
          externalUrl: d.externalUrl ?? null,
          status: d.status,
          thumbnailUrl: d.thumbnailUrl ?? null,
          thumbnailObjectKey: d.thumbnailObjectKey ?? null,
          imageUrls: d.imageUrls ?? [],
          imageObjectKeys: d.imageObjectKeys ?? [],
          tags: d.tags ?? [],
          liveVersion: d.liveVersion ?? null,
        });
        setVersions(d.version ? [{ ver: d.version, date: '', note: '' }] : []);
      })
      .catch((err: unknown) => setError(apiErrorMessage(err, '프롬프트를 찾을 수 없어요.')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: 'var(--ph-text-muted)' }}>불러오는 중...</p>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 17, color: 'var(--ph-text-secondary)', marginBottom: 24 }}>{error ?? '프롬프트를 찾을 수 없어요.'}</p>
        <button
          onClick={() => router.push('/shop')}
          style={{ background: 'var(--ph-primary)', color: '#fff', border: 'none', borderRadius: 'var(--ph-radius-md)', padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--ph-font-family)' }}
        >
          내 상점으로 돌아가기
        </button>
      </div>
    );
  }

  return <EditScreen id={id} prompt={prompt} versions={versions} />;
}
