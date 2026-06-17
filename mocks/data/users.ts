export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
};

export type OrderItem = {
  orderId: string;
  productId: number;
  purchasedAt: string;
};

export type PaymentItem = {
  paymentId: string;
  orderId: string;
  productIds: number[];
  totalAmount: number;
  status: 'paid';
  paidAt: string;
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
  { id: 'admin-1', name: '관리자', email: 'admin@prompthub.kr', role: 'admin' },
];

// 이메일로 역할 결정 (기존 LoginModal 로직과 동일)
export function getRoleByEmail(email: string): 'buyer' | 'seller' | 'admin' {
  if (email === 'admin@prompthub.kr' || email.startsWith('admin@')) return 'admin';
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

export const MOCK_PAYMENTS: Record<string, PaymentItem[]> = {};

export type WishlistItem = {
  wishlistId: string;
  productId: number;
  createdAt: string;
};

export const MOCK_WISHLISTS: Record<string, WishlistItem[]> = {
  'user-1': [
    { wishlistId: 'wl-1', productId: 3, createdAt: '2026-06-01T00:00:00.000Z' },
    { wishlistId: 'wl-2', productId: 5, createdAt: '2026-06-05T00:00:00.000Z' },
  ],
  'user-2': [
    { wishlistId: 'wl-3', productId: 1, createdAt: '2026-06-10T00:00:00.000Z' },
    { wishlistId: 'wl-4', productId: 7, createdAt: '2026-06-12T00:00:00.000Z' },
  ],
};

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 'notif-1', icon: '🛒', text: '새 상품이 출시되었습니다.', timestamp: '2026-06-16T09:00:00.000Z', read: false },
  { id: 'notif-2', icon: '⭐', text: '구매한 프롬프트에 리뷰를 남겨주세요.', timestamp: '2026-06-15T14:00:00.000Z', read: false },
  { id: 'notif-3', icon: '📢', text: '판매자 신청이 승인되었습니다.', timestamp: '2026-06-14T10:00:00.000Z', read: true },
];

export const SELLER_APPLY_STATUS: Record<string, 'pending' | 'approved' | 'rejected'> = {};

export const MOCK_PASSWORDS: Record<string, string> = {
  'user-1': 'password123',
  'user-2': 'password123',
  'user-3': 'password123',
  'admin-1': 'password123',
};
