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
