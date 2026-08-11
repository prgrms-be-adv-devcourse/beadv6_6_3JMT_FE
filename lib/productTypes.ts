import { Sparkles, NotebookText, Presentation, FileSpreadsheet } from 'lucide-react';
import type { ComponentType, CSSProperties } from 'react';

export type ProductType = 'PROMPT' | 'NOTION' | 'PPT' | 'EXCEL';

export interface ProductTypeOption {
  id: ProductType;
  label: string;
  icon: ComponentType<{ style?: CSSProperties; size?: number }>;
}

export const PRODUCT_TYPES: ProductTypeOption[] = [
  { id: 'PROMPT', label: '프롬프트', icon: Sparkles },
  { id: 'NOTION', label: '노션', icon: NotebookText },
  { id: 'PPT', label: 'PPT', icon: Presentation },
  { id: 'EXCEL', label: '엑셀', icon: FileSpreadsheet },
];

export const PRODUCT_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  PRODUCT_TYPES.map((t) => [t.id, t.label]),
);

export const PRODUCT_TYPE_ICON: Record<string, ProductTypeOption['icon']> = Object.fromEntries(
  PRODUCT_TYPES.map((t) => [t.id, t.icon]),
);

export const PRODUCT_TYPE_TITLE_PLACEHOLDER: Record<ProductType, string> = {
  PROMPT: '예: 전환율 높이는 랜딩 카피 작성',
  NOTION: '예: 신입사원 온보딩 노션 템플릿',
  PPT: '예: 스타트업 IR 피치덱 템플릿',
  EXCEL: '예: 월간 지출관리 가계부 템플릿',
};

export const PRODUCT_TYPE_DESC_PLACEHOLDER: Record<ProductType, string> = {
  PROMPT: '상품 목록에 표시되는 짧은 소개 문구를 입력하세요. 예: 전환율 높이는 랜딩 카피를 단계별로 만들어 드립니다.',
  NOTION: '상품 목록에 표시되는 짧은 소개 문구를 입력하세요. 예: 팀 온보딩에 바로 쓰는 노션 템플릿이에요.',
  PPT: '상품 목록에 표시되는 짧은 소개 문구를 입력하세요. 예: 투자 유치용 IR 덱을 빠르게 완성해요.',
  EXCEL: '상품 목록에 표시되는 짧은 소개 문구를 입력하세요. 예: 매달 지출을 자동으로 정리해 주는 엑셀이에요.',
};

export const PRODUCT_TYPE_TAG_PLACEHOLDER: Record<ProductType, string> = {
  PROMPT: '예: 카피라이팅, 마케팅, 이메일작성',
  NOTION: '예: 온보딩, 업무관리, 회의록',
  PPT: '예: IR, 피치덱, 사업계획서',
  EXCEL: '예: 가계부, 지출관리, 재고관리',
};

// 태그는 검색과 추천 두 곳에서 실제로 쓰인다 — ES 검색 필드 가중치가 tags.text^2(상품명 3
// 다음, 소개글 1.5보다 높음)이고, 추천용 임베딩 원문에도 태그가 들어간다.
// 노션·PPT·엑셀은 본문(content)이 null로 색인돼 제목·태그·소개글이 검색 가능한 전부라,
// 프롬프트보다 태그 비중이 크다는 점을 유형별로 다르게 안내한다.
export const PRODUCT_TYPE_TAG_HINT: Record<ProductType, string> = {
  PROMPT: '태그는 검색과 ‘비슷한 상품’ 추천에 쓰여요. 프롬프트의 주제·용도를 짧게 적고 Enter로 추가하세요.',
  NOTION: '태그는 검색과 ‘비슷한 상품’ 추천에 쓰여요. 노션은 페이지 내용이 검색되지 않으니 주제·용도를 태그로 꼭 적어주세요.',
  PPT: '태그는 검색과 ‘비슷한 상품’ 추천에 쓰여요. PPT는 파일 내용이 검색되지 않으니 주제·용도를 태그로 꼭 적어주세요.',
  EXCEL: '태그는 검색과 ‘비슷한 상품’ 추천에 쓰여요. 엑셀은 파일 내용이 검색되지 않으니 주제·용도를 태그로 꼭 적어주세요.',
};

export const PRODUCT_TYPE_CHANGE_PLACEHOLDER: Record<ProductType, string> = {
  PROMPT: '예: 프롬프트 지시문 개선, 예시 3개 추가',
  NOTION: '예: 노션 페이지 구성 개선, 섹션 추가',
  PPT: '예: 슬라이드 디자인 수정, 오탈자 정정',
  EXCEL: '예: 수식 오류 수정, 시트 추가',
};

// PATCH는 유형과 무관하게 같은 필드(제목·소개·가격·태그·이미지)라 문구가 거의 같다 — 모델은
// PROMPT에만 있는 필드라 그 유형에서만 언급한다. MAJOR는 유형별 핵심 산출물이 갈리므로 나눈다.
export const PRODUCT_TYPE_PATCH_DESC: Record<ProductType, string> = {
  PROMPT: '제목·소개·모델·가격·태그·이미지처럼 기본 정보를 고칠 때예요',
  NOTION: '제목·소개·가격·태그·이미지처럼 기본 정보를 고칠 때예요',
  PPT: '제목·소개·가격·태그·이미지처럼 기본 정보를 고칠 때예요',
  EXCEL: '제목·소개·가격·태그·이미지처럼 기본 정보를 고칠 때예요',
};

export const PRODUCT_TYPE_MAJOR_DESC: Record<ProductType, string> = {
  PROMPT: '프롬프트 본문을 바꾸거나 무료·유료를 전환할 때예요',
  NOTION: '노션 링크를 바꾸거나 무료·유료를 전환할 때예요',
  PPT: 'PPT 파일을 바꾸거나 무료·유료를 전환할 때예요',
  EXCEL: '엑셀 파일을 바꾸거나 무료·유료를 전환할 때예요',
};

export const PRODUCT_TYPE_BROWSE_DESC: Record<string, string> = {
  all: '필요한 상품을 골라서 찾아보세요',
  PROMPT: '바로 쓰는 프롬프트를 찾아보세요',
  NOTION: '정리된 노션 템플릿을 찾아보세요',
  PPT: '발표 바로 가능한 PPT 템플릿을 찾아보세요',
  EXCEL: '즉시 활용하는 엑셀 양식을 찾아보세요',
};
