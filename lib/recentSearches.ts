// 최근 검색어 — 이 브라우저에만 저장한다.
//
// BE#381이 구현되면 검색 행동 로그가 서버에도 쌓이지만 용도가 다르다. 그쪽은 집계·분석용
// (무엇이 많이 검색되나, 검색에서 클릭으로 얼마나 이어지나)이고, 이건 그 사람에게 다시
// 보여주는 화면 기능이다. 분석용으로 모은 데이터를 개인에게 되돌려주려면 로그인 사용자로
// 한정되고 조회 API와 개인정보 판단이 따로 필요하다 — 그건 BE#382의 몫이고 현재 보류다.
//
// 브라우저 기본 autofill에 맡기지 않는 이유: input에 name을 붙여 autofill을 살리면
// 상품명 제안 드롭다운과 브라우저 목록이 동시에 뜨는데, 브라우저 쪽은 위치도 스타일도
// 제어할 수 없다. 직접 저장하면 드롭다운 하나로 통일된다.

const STORAGE_KEY = 'ph.recentSearches'
const LIMIT = 5

function read(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string').slice(0, LIMIT)
  } catch {
    // 사파리 프라이빗 모드처럼 localStorage 접근이 막히거나 값이 깨진 경우.
    // 최근 검색어는 없어도 되는 기능이므로 조용히 빈 목록으로 취급한다.
    return []
  }
}

function write(keywords: string[]): string[] {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords))
    } catch {
      // 저장 실패는 무시한다 — 화면 동작은 반환값으로 이어진다.
    }
  }
  return keywords
}

export function getRecentSearches(): string[] {
  return read()
}

/** 이미 있는 검색어는 중복으로 쌓지 않고 맨 앞으로 올린다. */
export function addRecentSearch(keyword: string): string[] {
  const trimmed = keyword.trim()
  if (!trimmed) return read()
  return write([trimmed, ...read().filter((v) => v !== trimmed)].slice(0, LIMIT))
}

export function removeRecentSearch(keyword: string): string[] {
  return write(read().filter((v) => v !== keyword))
}

export function clearRecentSearches(): string[] {
  return write([])
}
