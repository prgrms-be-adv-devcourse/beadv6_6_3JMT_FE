/** 금액을 한국 원화 형식으로 포맷 (₩1,234,567) */
export function won(n: number): string {
  return '₩' + n.toLocaleString('ko-KR');
}
