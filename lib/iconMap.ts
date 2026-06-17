import {
  Sparkles, Image as LucideImage, PenLine, CodeXml,
  Megaphone, MessageCircle, BarChart3, BookOpen,
  Search, ChevronRight, Star, ShieldCheck, Zap, Wallet,
} from 'lucide-react';
import type { ComponentType, CSSProperties } from 'react';

/** 카테고리·UI 아이콘 slug → Lucide 컴포넌트 매핑 */
export const ICON_MAP: Record<string, ComponentType<{ style?: CSSProperties }>> = {
  /* ── 카테고리 아이콘 (전 페이지 공통) ── */
  sparkles:         Sparkles,
  image:            LucideImage,
  'pen-line':       PenLine,
  'code-xml':       CodeXml,
  megaphone:        Megaphone,
  'message-circle': MessageCircle,
  'bar-chart-3':    BarChart3,
  /* ── 콘텐츠 타입 ── */
  'book-open':      BookOpen,
  /* ── 홈 UI 전용 (app/page.tsx) ── */
  search:           Search,
  'chevron-right':  ChevronRight,
  star:             Star,
  'shield-check':   ShieldCheck,
  zap:              Zap,
  wallet:           Wallet,
};
