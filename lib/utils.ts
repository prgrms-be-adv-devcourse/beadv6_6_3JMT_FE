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
