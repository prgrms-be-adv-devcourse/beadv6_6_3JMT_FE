import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';

export type UploadPurpose = 'thumbnail' | 'image' | 'file';

/**
 * 업로드 완료 후 화면 상태가 함께 들고 있어야 하는 두 의미.
 * objectKey는 상품 생성/수정 요청과 temp 취소 요청에 그대로 보내는 값이고,
 * previewUrl은 화면 표시(썸네일 미리보기 등)에만 쓰는 만료 있는 presigned GET URL이다.
 */
export type UploadedObject = {
  objectKey: string;
  previewUrl: string;
};

// 확장자 → content-type. 백엔드가 presign 서명 시 확장자로 정하는 값과 동일해야
// S3 PUT이 통과한다(브라우저 file.type 은 빈 값일 수 있어 신뢰하지 않는다).
const CONTENT_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
};

function contentTypeOf(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPE[ext] ?? 'application/octet-stream';
}

/** BE의 products/temp/{sellerId}/{purpose}/{uuid}.{ext} 계약과 맞춘 접두어 검사. */
export function isTempObjectKey(objectKey: string): boolean {
  return objectKey.startsWith('products/temp/');
}

/**
 * presigned PUT 업로드.
 * 1) 백엔드에 발급 요청(POST /uploads/presigned-urls) → { tempObjectKey, presignedPutUrl, presignedGetUrl }
 * 2) presignedPutUrl 로 S3에 파일을 직접 PUT (raw fetch — 인증 헤더 없이)
 * 3) 생성/수정 요청에 넣을 objectKey와 미리보기용 previewUrl을 함께 반환
 *
 * S3는 발급 시 서명된 Content-Type 과 PUT 헤더가 일치해야 통과하므로,
 * 확장자 기반으로 백엔드와 동일하게 content-type 을 계산해 보낸다.
 */
export async function uploadViaPresign(
  file: File,
  purpose: UploadPurpose,
  productType?: string,
): Promise<UploadedObject> {
  const { data } = await api.post(`${API_BASE}/products/uploads/presigned-urls`, {
    purpose,
    fileName: file.name,
    productType,
  });
  const { tempObjectKey, presignedPutUrl, presignedGetUrl } = data.data as {
    tempObjectKey: string;
    presignedPutUrl: string;
    presignedGetUrl: string;
  };

  const res = await fetch(presignedPutUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentTypeOf(file.name) },
  });
  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status}`);
  }
  return { objectKey: tempObjectKey, previewUrl: presignedGetUrl };
}
