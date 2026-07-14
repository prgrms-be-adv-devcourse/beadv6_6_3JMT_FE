import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';

export type UploadPurpose = 'thumbnail' | 'image' | 'file';

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

/**
 * presigned PUT 업로드.
 * 1) 백엔드에 발급 요청(POST /uploads) → { uploadUrl, fileUrl }
 * 2) uploadUrl 로 S3에 파일을 직접 PUT (raw fetch — 인증 헤더 없이)
 * 3) 생성/수정 요청에 넣을 fileUrl 반환
 *
 * S3는 발급 시 서명된 Content-Type 과 PUT 헤더가 일치해야 통과하므로,
 * 확장자 기반으로 백엔드와 동일하게 content-type 을 계산해 보낸다.
 */
export async function uploadViaPresign(
  file: File,
  purpose: UploadPurpose,
  productType?: string,
): Promise<string> {
  const { data } = await api.post(`${API_BASE}/sellers/me/products/uploads`, {
    purpose,
    fileName: file.name,
    productType,
  });
  const { uploadUrl, fileUrl } = data.data as { uploadUrl: string; fileUrl: string };

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentTypeOf(file.name) },
  });
  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status}`);
  }
  return fileUrl;
}
