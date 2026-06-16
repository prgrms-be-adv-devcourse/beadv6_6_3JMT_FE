import { HttpResponse } from 'msw';

export function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ success: true, data, message: 'success' }, { status });
}

export function err(code: string, message: string, status: number) {
  return HttpResponse.json({ success: false, data: null, message, code }, { status });
}

export const ERR = {
  unauthorized: () => err('UNAUTHORIZED', '로그인이 필요합니다.', 401),
  forbidden:    () => err('FORBIDDEN', '접근 권한이 없습니다.', 403),
  notFound:     (resource = '요청한 데이터') =>
    err('NOT_FOUND', `${resource}가 없습니다.`, 404),
  validation:   (message: string) => err('VALIDATION_ERROR', message, 422),
  server:       () => err('SERVER_ERROR', '서버 오류입니다.', 500),
};

/** 페이지네이션 응답 — meta를 최상위에 포함 */
export function okList<T>(items: T[], page = 1, size = 20, status = 200) {
  const start = (page - 1) * size;
  const sliced = items.slice(start, start + size);
  return HttpResponse.json(
    {
      success: true,
      data: sliced,
      message: 'success',
      meta: {
        page,
        size,
        total: items.length,
        hasNext: start + size < items.length,
      },
    },
    { status },
  );
}

/** Authorization 헤더에서 Bearer 토큰 추출 */
export function extractToken(request: Request): string | null {
  const auth = request.headers.get('Authorization') ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

/** 토큰 형식: "mock-token::{userId}" */
export function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  const [, userId] = token.split('::');
  return userId ?? null;
}
