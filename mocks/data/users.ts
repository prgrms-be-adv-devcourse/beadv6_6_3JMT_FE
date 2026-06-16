export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller';
};

export type OrderItem = {
  orderId: string;
  productId: number;
  purchasedAt: string;
};

export type NotificationItem = {
  id: string;
  icon: string;
  text: string;
  timestamp: string;
  read: boolean;
};

export const MOCK_USERS: MockUser[] = [
  { id: 'user-1', name: '김민서', email: 'kms12782@nangman.cloud', role: 'buyer' },
  { id: 'user-2', name: '프롬트랩', email: 'promptlab@prompthub.kr', role: 'seller' },
  { id: 'user-3', name: '판매자', email: 'seller@prompthub.kr', role: 'seller' },
];

// 이메일로 역할 결정 (기존 LoginModal 로직과 동일)
export function getRoleByEmail(email: string): 'buyer' | 'seller' {
  if (email.includes('seller') || email.endsWith('@prompthub.kr')) return 'seller';
  return 'buyer';
}

export const MOCK_ORDERS: Record<string, OrderItem[]> = {
  'user-1': [
    { orderId: 'order-101', productId: 1, purchasedAt: '2026-06-01T00:00:00.000Z' },
    { orderId: 'order-102', productId: 2, purchasedAt: '2026-05-20T00:00:00.000Z' },
    { orderId: 'order-103', productId: 4, purchasedAt: '2026-04-10T00:00:00.000Z' },
  ],
  'user-2': [
    { orderId: 'order-201', productId: 6, purchasedAt: '2026-06-10T00:00:00.000Z' },
  ],
};

export const MOCK_WISHLISTS: Record<string, number[]> = {
  'user-1': [3, 5],
  'user-2': [1, 7],
};

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 'notif-1', icon: '🛒', text: '새 상품이 출시되었습니다.', timestamp: '2026-06-16T09:00:00.000Z', read: false },
  { id: 'notif-2', icon: '⭐', text: '구매한 프롬프트에 리뷰를 남겨주세요.', timestamp: '2026-06-15T14:00:00.000Z', read: false },
  { id: 'notif-3', icon: '📢', text: '판매자 신청이 승인되었습니다.', timestamp: '2026-06-14T10:00:00.000Z', read: true },
];

export const SELLER_APPLY_STATUS: Record<string, 'pending' | 'approved' | 'rejected'> = {};
