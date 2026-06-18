export type Product = {
  id: number;
  title: string;
  category: string;
  icon: string;
  model: string;
  amount: number;
  originalAmount?: number;
  rating: number;
  salesCount: number;
  seller: string;
  sellerId: string;
  badge?: string;
  desc: string;
  thumbnail_url: string | null;
  content?: string;
  status?: 'active' | 'review';
  createdAt: string;
  updatedAt: string;
};

export const PRODUCTS: Product[] = [
  {
    id: 1, title: '사진 같은 제품 목업 생성기', category: 'image', icon: 'image',
    model: 'Midjourney v6', amount: 5900, rating: 4.9, salesCount: 1240,
    seller: '프롬트랩', sellerId: 'user-2', badge: '신규',
    desc: '제품 사진을 스튜디오 품질의 광고 컷으로 바꿔주는 미드저니 프롬프트. 조명·각도·배경을 한 번에 지정합니다.',
    thumbnail_url: null, createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 2, title: '전환율 높이는 랜딩 카피 작성', category: 'writing', icon: 'pen-line',
    model: 'GPT-4o', amount: 4900, originalAmount: 7900, rating: 4.8, salesCount: 980,
    seller: '프롬트랩', sellerId: 'user-2', badge: '베스트',
    desc: '후킹 헤드라인부터 CTA까지, 검증된 프레임워크로 랜딩 페이지 카피를 단계별로 만들어 줍니다.',
    thumbnail_url: null, createdAt: '2026-04-15T00:00:00.000Z', updatedAt: '2026-05-20T00:00:00.000Z',
  },
  {
    id: 3, title: '리액트 컴포넌트 리팩터링 도우미', category: 'coding', icon: 'code-xml',
    model: 'Claude 3.5', amount: 7900, rating: 5.0, salesCount: 612,
    seller: '판매자', sellerId: 'user-3',
    desc: '지저분한 컴포넌트를 깔끔한 훅 기반 구조로 리팩터링하고, 테스트 코드까지 제안합니다.',
    thumbnail_url: null, createdAt: '2026-03-10T00:00:00.000Z', updatedAt: '2026-06-05T00:00:00.000Z',
  },
  {
    id: 4, title: '30일 SNS 콘텐츠 캘린더', category: 'marketing', icon: 'megaphone',
    model: 'GPT-4o', amount: 3900, originalAmount: 5900, rating: 4.7, salesCount: 2310,
    seller: '프롬트랩', sellerId: 'user-2', badge: '베스트',
    desc: '브랜드 톤만 입력하면 한 달치 인스타·스레드 게시물 아이디어와 카피를 자동 생성합니다.',
    thumbnail_url: null, createdAt: '2026-02-20T00:00:00.000Z', updatedAt: '2026-06-10T00:00:00.000Z',
  },
  {
    id: 5, title: '친절한 CS 챗봇 페르소나', category: 'chatbot', icon: 'message-circle',
    model: 'Claude 3.5', amount: 6900, rating: 4.9, salesCount: 540,
    seller: '토크봇', sellerId: 'seller-5',
    desc: '고객 문의를 따뜻하고 정확하게 응대하는 상담 챗봇 시스템 프롬프트.',
    thumbnail_url: null, createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-05-15T00:00:00.000Z',
  },
  {
    id: 6, title: '엑셀 데이터 인사이트 요약', category: 'data', icon: 'bar-chart-3',
    model: 'GPT-4o', amount: 0, rating: 4.6, salesCount: 430,
    seller: '데이터핀', sellerId: 'seller-6',
    desc: '표 데이터를 붙여넣으면 핵심 추세·이상치를 보고서 형태로 정리해 줍니다.',
    thumbnail_url: null, createdAt: '2026-01-05T00:00:00.000Z', updatedAt: '2026-04-20T00:00:00.000Z',
  },
  {
    id: 7, title: '감성 일러스트 캐릭터 시트', category: 'image', icon: 'image',
    model: 'Midjourney v6', amount: 4500, rating: 4.8, salesCount: 870,
    seller: '프롬트랩', sellerId: 'user-2',
    desc: '일관된 캐릭터를 여러 포즈·표정으로 생성하는 캐릭터 시트 프롬프트.',
    thumbnail_url: null, createdAt: '2026-03-22T00:00:00.000Z', updatedAt: '2026-05-30T00:00:00.000Z',
  },
  {
    id: 8, title: '유튜브 스크립트 후킹 오프닝', category: 'writing', icon: 'pen-line',
    model: 'GPT-4o', amount: 0, rating: 4.7, salesCount: 1520,
    seller: '프롬트랩', sellerId: 'user-2', badge: '신규',
    desc: '첫 15초에 이탈을 막는 강력한 오프닝 훅을 주제별로 생성합니다.',
    thumbnail_url: null, createdAt: '2026-05-10T00:00:00.000Z', updatedAt: '2026-06-08T00:00:00.000Z',
  },
  {
    id: 9, title: 'A/B 테스트 광고 카피 생성기', category: 'marketing', icon: 'megaphone',
    model: 'GPT-4o', amount: 4200, rating: 4.6, salesCount: 780,
    seller: '프롬트랩', sellerId: 'user-2',
    desc: '동일 메시지를 다른 톤으로 변형해 A/B 테스트용 카피 세트를 빠르게 만들어 줍니다.',
    thumbnail_url: null, createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-04-15T00:00:00.000Z',
  },
  {
    id: 10, title: '코드 리뷰 자동화 봇', category: 'coding', icon: 'code-xml',
    model: 'Claude 3.5', amount: 8900, rating: 4.9, salesCount: 310,
    seller: '판매자', sellerId: 'user-3',
    desc: 'PR 코드를 붙여넣으면 보안·가독성·성능 관점에서 리뷰 코멘트를 생성합니다.',
    thumbnail_url: null, createdAt: '2026-01-20T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z',
  },
  {
    id: 11, title: '여행 일정 플래너', category: 'chatbot', icon: 'message-circle',
    model: 'GPT-4o', amount: 2900, rating: 4.5, salesCount: 1100,
    seller: '토크봇', sellerId: 'seller-5',
    desc: '도시, 일수, 예산을 입력하면 현지인 맞춤 여행 일정을 짜줍니다.',
    thumbnail_url: null, createdAt: '2026-03-05T00:00:00.000Z', updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 12, title: '판매 데이터 주간 리포트', category: 'data', icon: 'bar-chart-3',
    model: 'GPT-4o', amount: 3500, rating: 4.7, salesCount: 290,
    seller: '데이터핀', sellerId: 'seller-6',
    desc: '주간 판매 데이터를 넣으면 KPI 요약과 다음 주 액션 아이템을 뽑아줍니다.',
    thumbnail_url: null, createdAt: '2026-04-25T00:00:00.000Z', updatedAt: '2026-06-12T00:00:00.000Z',
  },
  {
    id: 13, title: '로고 디자인 컨셉 생성기', category: 'image', icon: 'image',
    model: 'Midjourney v6', amount: 6500, rating: 4.8, salesCount: 760,
    seller: '비주얼랩', sellerId: 'seller-1',
    desc: '브랜드 키워드만 입력하면 다양한 스타일의 로고 컨셉을 빠르게 시각화합니다.',
    thumbnail_url: null, createdAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-06-09T00:00:00.000Z',
  },
  {
    id: 14, title: '인스타그램 릴스 썸네일 생성', category: 'image', icon: 'image',
    model: 'DALL·E 3', amount: 3200, rating: 4.6, salesCount: 530,
    seller: '크리에이트랩', sellerId: 'seller-7', badge: '신규',
    desc: '릴스 주제와 분위기를 입력하면 클릭을 유도하는 썸네일 이미지를 생성합니다.',
    thumbnail_url: null, createdAt: '2026-05-18T00:00:00.000Z', updatedAt: '2026-06-11T00:00:00.000Z',
  },
  {
    id: 15, title: '이메일 뉴스레터 작성 도우미', category: 'writing', icon: 'pen-line',
    model: 'GPT-4o', amount: 4400, rating: 4.7, salesCount: 810,
    seller: '카피킷', sellerId: 'seller-2',
    desc: '제목·요약·본문·CTA까지 뉴스레터 구조 전체를 한 번에 완성해 주는 프롬프트.',
    thumbnail_url: null, createdAt: '2026-04-10T00:00:00.000Z', updatedAt: '2026-05-28T00:00:00.000Z',
  },
  {
    id: 16, title: '보도자료 초안 자동 작성', category: 'writing', icon: 'pen-line',
    model: 'Claude 3.5', amount: 5500, rating: 4.9, salesCount: 340,
    seller: '미디어브릿지', sellerId: 'seller-8', badge: '베스트',
    desc: '제품·이벤트 정보만 입력하면 언론사 기준에 맞는 보도자료 초안을 생성합니다.',
    thumbnail_url: null, createdAt: '2026-03-28T00:00:00.000Z', updatedAt: '2026-06-03T00:00:00.000Z',
  },
  {
    id: 17, title: 'SQL 쿼리 최적화 도우미', category: 'coding', icon: 'code-xml',
    model: 'GPT-4o', amount: 6800, rating: 4.8, salesCount: 420,
    seller: '데브플로우', sellerId: 'user-3',
    desc: '느린 쿼리를 붙여넣으면 인덱스 제안과 함께 최적화된 버전을 반환합니다.',
    thumbnail_url: null, createdAt: '2026-02-15T00:00:00.000Z', updatedAt: '2026-05-10T00:00:00.000Z',
  },
  {
    id: 18, title: 'API 문서 자동 생성기', category: 'coding', icon: 'code-xml',
    model: 'Claude 3.5', amount: 7200, rating: 4.7, salesCount: 265,
    seller: '코드스미스', sellerId: 'seller-9',
    desc: '함수 시그니처와 설명을 넣으면 OpenAPI 스펙 형식의 문서를 자동 작성합니다.',
    thumbnail_url: null, createdAt: '2026-03-01T00:00:00.000Z', updatedAt: '2026-05-22T00:00:00.000Z',
  },
  {
    id: 19, title: '경쟁사 분석 리포트 생성기', category: 'marketing', icon: 'megaphone',
    model: 'GPT-4o', amount: 5100, rating: 4.6, salesCount: 630,
    seller: '그로스하우스', sellerId: 'seller-4',
    desc: '경쟁사 URL·특징을 입력하면 SWOT 기반의 경쟁사 분석 리포트를 생성합니다.',
    thumbnail_url: null, createdAt: '2026-02-08T00:00:00.000Z', updatedAt: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 20, title: '카카오톡 채널 메시지 작성', category: 'marketing', icon: 'megaphone',
    model: 'GPT-4o', amount: 2900, rating: 4.5, salesCount: 940,
    seller: '마케팅허브', sellerId: 'seller-10', badge: '신규',
    desc: '프로모션 목적과 타깃을 입력하면 카카오 채널 알림 메시지를 다양한 톤으로 작성합니다.',
    thumbnail_url: null, createdAt: '2026-05-22T00:00:00.000Z', updatedAt: '2026-06-14T00:00:00.000Z',
  },
  {
    id: 21, title: '멀티턴 고객 응대 시나리오', category: 'chatbot', icon: 'message-circle',
    model: 'Claude 3.5', amount: 7500, rating: 4.8, salesCount: 380,
    seller: '토크봇', sellerId: 'seller-5',
    desc: '주문·환불·불만 등 상황별 멀티턴 대화 시나리오를 자동으로 생성합니다.',
    thumbnail_url: null, createdAt: '2026-04-05T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 22, title: '온보딩 FAQ 챗봇 구축', category: 'chatbot', icon: 'message-circle',
    model: 'GPT-4o', amount: 4800, rating: 4.6, salesCount: 510, status: 'review',
    seller: '챗플로우', sellerId: 'seller-11',
    desc: '서비스 소개 문서를 넣으면 신규 유저 온보딩용 FAQ 챗봇 프롬프트를 구성합니다.',
    thumbnail_url: null, createdAt: '2026-03-15T00:00:00.000Z', updatedAt: '2026-05-25T00:00:00.000Z',
  },
  {
    id: 23, title: '마케팅 대시보드 인사이트 요약', category: 'data', icon: 'bar-chart-3',
    model: 'GPT-4o', amount: 4100, rating: 4.7, salesCount: 355, status: 'review',
    seller: '데이터핀', sellerId: 'seller-6',
    desc: 'GA4·광고 지표를 붙여넣으면 핵심 인사이트와 개선 제안을 리포트로 정리합니다.',
    thumbnail_url: null, createdAt: '2026-02-28T00:00:00.000Z', updatedAt: '2026-05-18T00:00:00.000Z',
  },
  {
    id: 24, title: '고객 리뷰 감성 분석기', category: 'data', icon: 'bar-chart-3',
    model: 'Claude 3.5', amount: 5800, rating: 4.9, salesCount: 190, status: 'review',
    seller: '애널리틱스랩', sellerId: 'seller-12', badge: '신규',
    desc: '리뷰 텍스트를 붙여넣으면 긍정·부정·중립 분류와 핵심 키워드를 자동 추출합니다.',
    thumbnail_url: null, createdAt: '2026-05-30T00:00:00.000Z', updatedAt: '2026-06-15T00:00:00.000Z',
  },
];

export const PRODUCT_VERSIONS = [
  { ver: 'v1.3', date: '2026-06-01', note: '조명 프리셋 3종 추가' },
  { ver: 'v1.2', date: '2026-05-10', note: '배경 제거 옵션 개선' },
  { ver: 'v1.1', date: '2026-04-20', note: '각도 키워드 최적화' },
  { ver: 'v1.0', date: '2026-04-01', note: '최초 출시' },
];
