export function won(n: number | null | undefined): string {
  const val = typeof n === 'number' && Number.isFinite(n) ? n : 0
  return '₩' + val.toLocaleString('ko-KR')
}

/** YYYY-MM 정산 월을 한국어 레이블로 포맷 */
export function settlementMonthLabel(month: string): string {
  const [year, value] = month.split('-')
  return `${year}년 ${Number(value)}월`
}

/** 주간 정산 시작일과 종료일을 한 줄 기간으로 포맷 */
export function settlementPeriodLabel(start: string, end: string): string {
  return `${start.replaceAll('-', '.')} ~ ${end.slice(5).replaceAll('-', '.')}`
}

/** Axios 형태의 API 오류에서 사용자 노출 메시지를 안전하게 추출 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  )
}

/** 토스페이먼츠 최소 결제금액 제약 — 상품 가격 하한 */
export const MIN_PRODUCT_PRICE = 100

/** 상품 가격이 유효한지 검사 (무료 0원 또는 100원 이상만 허용) */
export function isValidProductPrice(amount: number): boolean {
  return amount === 0 || amount >= MIN_PRODUCT_PRICE
}
