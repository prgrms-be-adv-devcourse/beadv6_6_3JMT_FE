export type MockUser = {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  provider?: 'local' | 'kakao';
  status?: 'active' | 'suspended' | 'withdrawn';
  createdAt?: string;
};

export type OrderItem = {
  orderId: string;
  productId: string;
  purchasedAt: string;
};

export type PaymentItem = {
  paymentId: string;
  orderId: string;
  productIds: string[];
  totalAmount: number;
  status: 'paid';
  paidAt: string;
};

export type MockPaymentHistoryItem = {
  orderId: string;
  orderProductId: string;
  paymentId: string;
  paymentStatus: 'PAID' | 'REFUNDING' | 'REFUNDED';
  isRefund: boolean;
  productType: string;
  title: string;
  amount: number;
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
  { id: 'user-1', name: '김민서', email: 'kms12782@nangman.cloud', role: 'buyer', status: 'active', createdAt: '2026-06-24T08:00:00.000Z' },
  { id: 'user-kakao-mock-kakao-123456', name: '카카오사용자', email: 'kakao@user.com', role: 'buyer', provider: 'kakao', status: 'active', createdAt: '2026-06-24T08:00:00.000Z' },
  { id: 'user-4', name: '구매자', email: 'buyer@prompthub.kr', role: 'buyer', status: 'active', createdAt: '2026-06-24T09:30:00.000Z' },
  { id: 'user-2', name: '프롬트랩', email: 'promptlab@prompthub.kr', role: 'seller', status: 'active', createdAt: '2026-06-20T10:00:00.000Z' },
  { id: 'user-3', name: '판매자', email: 'seller@prompthub.kr', role: 'seller', status: 'active', createdAt: '2026-06-18T11:00:00.000Z' },
  { id: 'user-5', name: '이준혁', email: 'junhyuk.lee@example.com', role: 'buyer', status: 'suspended', createdAt: '2026-06-15T12:00:00.000Z' },
  { id: 'user-6', name: '박지현', email: 'jihyun.park@example.com', role: 'buyer', status: 'withdrawn', createdAt: '2026-06-10T13:00:00.000Z' },
  { id: 'user-7', name: '최수연', email: 'suyeon.choi@example.com', role: 'seller', status: 'suspended', createdAt: '2026-06-05T14:00:00.000Z' },
  { id: 'admin-1', name: '관리자', email: 'admin@prompthub.kr', role: 'admin', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
];

// 이메일로 역할 결정 — MOCK_USERS 우선, 없으면 이름 기반 추측
export function getRoleByEmail(email: string): 'buyer' | 'seller' | 'admin' {
  const known = MOCK_USERS.find((u) => u.email === email);
  if (known) return known.role;
  if (email.startsWith('admin@') || email.includes('admin')) return 'admin';
  if (email.includes('seller') || email.includes('promptlab')) return 'seller';
  return 'buyer';
}

export const MOCK_ORDERS: Record<string, OrderItem[]> = {
  'user-1': [
    { orderId: 'order-101', productId: '11111111-1111-1111-1111-111111111111', purchasedAt: '2026-06-01T00:00:00.000Z' },
    { orderId: 'order-102', productId: '22222222-2222-2222-2222-222222222222', purchasedAt: '2026-05-20T00:00:00.000Z' },
    { orderId: 'order-103', productId: '44444444-4444-4444-4444-444444444444', purchasedAt: '2026-04-10T00:00:00.000Z' },
  ],
  'user-4': [
    { orderId: 'order-401', productId: '11111111-1111-1111-1111-111111111111', purchasedAt: '2026-06-10T00:00:00.000Z' },
    { orderId: 'order-402', productId: '33333333-3333-3333-3333-333333333333', purchasedAt: '2026-06-05T00:00:00.000Z' },
  ],
  'user-2': [
    { orderId: 'order-201', productId: '66666666-6666-6666-6666-666666666666', purchasedAt: '2026-06-10T00:00:00.000Z' },
  ],
};

export const MOCK_PAYMENTS: Record<string, PaymentItem[]> = {};

export const MOCK_PAYMENT_HISTORY: Record<string, MockPaymentHistoryItem[]> = {
  'user-1': [
    {
      orderId: 'order-101', orderProductId: 'op-101-1', paymentId: 'pay-101',
      paymentStatus: 'PAID', isRefund: true, productType: 'PROMPT',
      title: '사진 같은 제품 목업 생성기', amount: 5900, paidAt: '2026-06-01T10:00:00',
    },
    {
      orderId: 'order-102', orderProductId: 'op-102-1', paymentId: 'pay-102',
      paymentStatus: 'PAID', isRefund: false, productType: 'PROMPT',
      title: '전환율 높이는 랜딩 카피 작성', amount: 4900, paidAt: '2026-05-20T14:30:00',
    },
    {
      orderId: 'order-103', orderProductId: 'op-103-1', paymentId: 'pay-103',
      paymentStatus: 'REFUNDING', isRefund: false, productType: 'PROMPT',
      title: '30일 SNS 콘텐츠 캘린더', amount: 3900, paidAt: '2026-04-10T09:00:00',
    },
    {
      orderId: 'order-104', orderProductId: 'op-104-1', paymentId: 'pay-104',
      paymentStatus: 'REFUNDED', isRefund: false, productType: 'PROMPT',
      title: '코드 리뷰 자동화 봇', amount: 8900, paidAt: '2026-03-15T11:00:00',
    },
  ],
  'user-4': [
    {
      orderId: 'order-401', orderProductId: 'op-401-1', paymentId: 'pay-401',
      paymentStatus: 'PAID', isRefund: true, productType: 'PROMPT',
      title: '사진 같은 제품 목업 생성기', amount: 5900, paidAt: '2026-06-10T08:00:00',
    },
    {
      orderId: 'order-402', orderProductId: 'op-402-1', paymentId: 'pay-402',
      paymentStatus: 'PAID', isRefund: false, productType: 'PROMPT',
      title: '리액트 컴포넌트 리팩터링 도우미', amount: 7900, paidAt: '2026-06-05T13:00:00',
    },
  ],
};

export type WishlistItem = {
  wishlistId: string;
  productId: string;
  createdAt: string;
};

export const MOCK_WISHLISTS: Record<string, WishlistItem[]> = {
  'user-1': [
    { wishlistId: 'wl-1', productId: '33333333-3333-3333-3333-333333333333', createdAt: '2026-06-01T00:00:00.000Z' },
    { wishlistId: 'wl-2', productId: '55555555-5555-5555-5555-555555555555', createdAt: '2026-06-05T00:00:00.000Z' },
  ],
  'user-4': [
    { wishlistId: 'wl-5', productId: '22222222-2222-2222-2222-222222222222', createdAt: '2026-06-10T00:00:00.000Z' },
  ],
  'user-2': [
    { wishlistId: 'wl-3', productId: '11111111-1111-1111-1111-111111111111', createdAt: '2026-06-10T00:00:00.000Z' },
    { wishlistId: 'wl-4', productId: '77777777-7777-7777-7777-777777777777', createdAt: '2026-06-12T00:00:00.000Z' },
  ],
};

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 'notif-1', icon: '🛒', text: '새 상품이 출시되었습니다.', timestamp: '2026-06-16T09:00:00.000Z', read: false },
  { id: 'notif-2', icon: '⭐', text: '구매한 프롬프트에 리뷰를 남겨주세요.', timestamp: '2026-06-15T14:00:00.000Z', read: false },
  { id: 'notif-3', icon: '📢', text: '판매자 신청이 승인되었습니다.', timestamp: '2026-06-14T10:00:00.000Z', read: true },
];

export type SellerApplicationData = {
  sellerRequestId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  categories: string[];
  introduction: string | null;
  portfolioUrl: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  rejectReason: string | null;
};

export const SELLER_APPLICATIONS: Record<string, SellerApplicationData> = {};

export const MOCK_PASSWORDS: Record<string, string> = {
  'user-1': 'password123',
  'user-4': 'password123',
  'user-2': 'password123',
  'user-3': 'password123',
  'admin-1': 'password123',
};
