'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';
import {
  ArrowLeft, Pencil, ArrowRight, History,
  AlertCircle, Eye, Images, X, Store,
} from 'lucide-react';
import FormField from '@/components/ui/FormField';
import PromptCard, { type PromptItem } from '@/components/ui/PromptCard';
import ImageUpload from '@/components/ui/ImageUpload';
import { useToast } from '@/store/useToastStore';
import Label from '@/components/ui/Label';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Tag from '@/components/ui/Tag';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { PRODUCT_TYPES, type ProductType } from '@/lib/productTypes';

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
  status?: string;
  thumbnailUrl?: string | null;
  imageUrls?: string[];
  tags?: string[];
  versions?: Version[];
};

function nextVer(latest: string, type: 'MAJOR' | 'PATCH'): string {
  const clean = String(latest || '1.0').replace(/^v/, '');
  const [majStr, patStr = '0'] = clean.split('.');
  const maj = parseInt(majStr, 10) || 1;
  const pat = parseInt(patStr, 10) || 0;
  return type === 'MAJOR' ? `${maj + 1}.0` : `${maj}.${pat + 1}`;
}

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

/* ── EditScreen ──────────────────────────────────────────────────────── */

function EditScreen({ id, prompt, versions }: { id: string; prompt: Prompt; versions: Version[] }) {
  const router = useRouter();
  const isDraft = prompt.status === 'DRAFT';

  const [title, setTitle] = useState(prompt.title);
  const [productType, setProductType] = useState<ProductType>(prompt.productType as ProductType);
  const [model, setModel] = useState(prompt.model);
  const [price, setPrice] = useState(prompt.amount === 0 ? '0' : String(prompt.amount));
  const [desc, setDesc] = useState(prompt.desc);
  const [body, setBody] = useState(prompt.content);
  const [tags, setTags] = useState<string[]>(prompt.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [thumbUrl, setThumbUrl] = useState<string | null>(prompt.thumbnailUrl ?? null);
  const initGallery = (urls?: string[]) => {
    const base: (string | null)[] = Array(5).fill(null);
    urls?.forEach((u, i) => { if (i < 5) base[i] = u; });
    return base;
  };
  const [galleryUrls, setGalleryUrls] = useState<(string | null)[]>(() => initGallery(prompt.imageUrls));
  const [versionType, setVersionType] = useState<'PATCH' | 'MAJOR'>('PATCH');
  const [changeReason, setChangeReason] = useState('');
  const [noteErr, setNoteErr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const showToast = useToast();

  const curVer = (versions[0]?.ver ?? '1.0').replace(/^v/, '');
  const nxtVer = nextVer(curVer, versionType);

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    const v = tagInput.trim().replace(/^#/, '');
    if (v && !tags.includes(v) && tags.length < 8) setTags([...tags, v]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const save = async () => {
    if (!isDraft && !changeReason.trim()) {
      setNoteErr(true);
      showToast('변경 내용을 입력해 주세요');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await api.put(`${API_BASE}/products/${id}`, {
        title, productType, model,
        amount: Number(price),
        desc, content: body,
        thumbnailUrl: thumbUrl,
        imageUrls: galleryUrls.filter((u): u is string => u !== null),
        tags,
        ...(isDraft ? {} : { versionType, changeReason }),
      });
      const successMsg = isDraft
        ? '저장됐어요'
        : versionType === 'MAJOR'
          ? '검수 대기 상태로 전환됐어요'
          : '수정사항이 바로 적용됐어요';
      showToast(successMsg);
      setTimeout(() => router.push('/shop'), 1200);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 403) {
        showToast('본인의 상품만 수정할 수 있어요');
      } else if (status === 409) {
        showToast('검수 중인 상품은 현재 수정할 수 없어요');
      } else {
        showToast(msg ?? '저장에 실패했어요. 다시 시도해 주세요');
      }
    } finally {
      setSaving(false);
    }
  };

  const cleanupAndCancel = async () => {
    const tempUrls = [thumbUrl, ...galleryUrls].filter((u): u is string => !!u && u.includes('/temp/'));
    if (tempUrls.length > 0) {
      await api.delete(`${API_BASE}/sellers/me/products/images`, { data: tempUrls }).catch(() => {});
    }
    router.push('/shop');
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
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
        onClick={handleCancel}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-secondary)', fontFamily: 'var(--ph-font-family)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: 0 }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} /> 내 상점으로
      </button>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', borderRadius: 'var(--ph-radius-full)', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            <Pencil style={{ width: 14, height: 14 }} /> 상품 수정
          </div>
          <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.015em', margin: 0 }}>프롬프트 수정</h1>
          {!isDraft && (
            <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              저장하면{' '}
              <Badge tone="neutral">현재 v{curVer}</Badge>
              <ArrowRight style={{ width: 15, height: 15, color: 'var(--ph-text-muted)' }} />
              <Badge tone="blue" soft={false}>v{nxtVer}</Badge>
              {' '}로 업데이트돼요.{' '}
              <span style={{ color: versionType === 'PATCH' ? 'var(--ph-primary)' : '#f59e0b', fontWeight: 600 }}>
                {versionType === 'PATCH' ? '✓ 바로 적용됩니다.' : '⏱ 검수 후 적용됩니다.'}
              </span>
            </p>
          )}
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
              placeholder="상품 목록에 표시되는 짧은 소개 문구를 입력하세요."
            />
          </Card>

          {/* 프롬프트 내용 카드 */}
          <Card padding="28px">
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
                <ImageUpload value={thumbUrl} onChange={setThumbUrl} height={220} placeholder="썸네일을 클릭하거나 드래그해 업로드" />
              </div>

              {/* 소개 이미지 */}
              <div>
                <Label hint="최대 5장">소개 이미지</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  {galleryUrls.map((url, i) => (
                    <ImageUpload
                      key={i}
                      value={url}
                      onChange={(v) => setGalleryUrls((prev) => { const next = [...prev]; next[i] = v; return next; })}
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

          {/* 버전 유형 + 변경 내용 — DRAFT 제외 */}
          {!isDraft && (
            <Card padding="28px" style={{ border: `1px solid ${noteErr ? 'var(--ph-error)' : 'var(--ph-border)'}` }}>
              <div style={{ marginBottom: 20 }}>
                <Label>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <History style={{ width: 16, height: 16, color: 'var(--ph-primary)' }} /> 버전 유형
                  </span>
                </Label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {(['PATCH', 'MAJOR'] as const).map((type) => {
                    const sel = versionType === type;
                    const isPatch = type === 'PATCH';
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setVersionType(type)}
                        style={{ textAlign: 'left', padding: '14px 16px', border: `1.5px solid ${sel ? 'var(--ph-primary)' : 'var(--ph-border)'}`, borderRadius: 'var(--ph-radius-md)', background: sel ? 'var(--ph-secondary)' : 'var(--ph-surface)', cursor: 'pointer', transition: 'border-color .15s, background .15s', fontFamily: 'var(--ph-font-family)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${sel ? 'var(--ph-primary)' : 'var(--ph-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ph-primary)' }} />}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ph-text)' }}>{type}</span>
                          <span style={{ fontSize: 12, color: 'var(--ph-text-muted)' }}>v{curVer} → v{nextVer(curVer, type)}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ph-text-secondary)', lineHeight: 1.4, paddingLeft: 24 }}>
                          {isPatch ? '교정·오타·내용 보강 등 작은 변경' : '프롬프트 구조·목적이 크게 바뀔 때'}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, paddingLeft: 24, marginTop: 5, color: isPatch ? 'var(--ph-primary)' : '#f59e0b' }}>
                          {isPatch ? '✓ 바로 적용돼요' : '⏱ 검수 후 적용돼요'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Label hint={`${changeReason.length}/500 · 필수`}>변경 내용</Label>
              <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '0 0 12px' }}>
                이번 수정에서 무엇이 바뀌었는지 적어 주세요. 구매자에게 버전 기록으로 표시돼요.
              </p>
              <textarea
                value={changeReason}
                onChange={(e) => { setChangeReason(e.target.value); setNoteErr(false); }}
                maxLength={500}
                rows={3}
                placeholder="예: 프롬프트 지시문 개선, 예시 3개 추가"
                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${noteErr ? 'var(--ph-error)' : 'var(--ph-border)'}`, borderRadius: 'var(--ph-radius-md)', padding: '12px 14px', fontFamily: 'var(--ph-font-family)', fontSize: 15, lineHeight: 1.6, resize: 'vertical', outline: 'none', color: 'var(--ph-text)' }}
              />
              {noteErr && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--ph-error)' }}>
                  <AlertCircle style={{ width: 15, height: 15 }} /> 변경 내용은 필수예요
                </div>
              )}
            </Card>
          )}

          {/* 버튼 영역 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <Button variant="secondary" size="lg" onClick={handleCancel}>취소</Button>
              <Button variant="solid" size="lg" disabled={saving || !title.trim()} onClick={save}>
                {saving ? '저장 중...' : isDraft ? '저장' : '새 버전으로 저장'}
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
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`${API_BASE}/sellers/me/products/${id}`)
      .then((res) => {
        const d = res.data.data;
        setPrompt({
          id: d.productId,
          title: d.title,
          productType: d.productType ?? 'PROMPT',
          model: d.model,
          amount: d.amount,
          desc: d.desc ?? '',
          content: d.content ?? '',
          status: d.status,
          thumbnailUrl: d.thumbnailUrl ?? null,
          imageUrls: d.imageUrls ?? [],
          tags: d.tags ?? [],
        });
        setVersions(d.version ? [{ ver: d.version, date: '', note: '' }] : []);
      })
      .catch(() => setError(true))
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
        <p style={{ fontSize: 17, color: 'var(--ph-text-secondary)', marginBottom: 24 }}>프롬프트를 찾을 수 없어요.</p>
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
