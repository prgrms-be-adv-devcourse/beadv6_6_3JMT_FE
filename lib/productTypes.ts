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

export const PRODUCT_TYPE_CHANGE_PLACEHOLDER: Record<ProductType, string> = {
  PROMPT: '예: 프롬프트 지시문 개선, 예시 3개 추가',
  NOTION: '예: 노션 페이지 구성 개선, 섹션 추가',
  PPT: '예: 슬라이드 디자인 수정, 오탈자 정정',
  EXCEL: '예: 수식 오류 수정, 시트 추가',
};

export const PRODUCT_TYPE_BROWSE_DESC: Record<string, string> = {
  all: '필요한 상품을 골라서 찾아보세요',
  PROMPT: '바로 쓰는 프롬프트를 찾아보세요',
  NOTION: '정리된 노션 템플릿을 찾아보세요',
  PPT: '발표 바로 가능한 PPT 템플릿을 찾아보세요',
  EXCEL: '즉시 활용하는 엑셀 양식을 찾아보세요',
};
