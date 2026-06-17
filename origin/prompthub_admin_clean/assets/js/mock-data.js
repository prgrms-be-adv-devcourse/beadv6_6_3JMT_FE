/* PromptHub 관리자 대시보드 — mock data.
 * Internal admin tool for an AI prompt marketplace. Korean-first copy,
 * concrete-but-restrained numbers. Mutable in-memory store: admin actions
 * (approve / reject / pay / suspend …) update React state at runtime. */
(function () {
  // ── KPI metrics for the dashboard home ──────────────────────────────
  window.ADMIN_METRICS = {
    totalUsers: 48210,
    totalUsersDelta: 3.2, // % vs last week
    newToday: 312,
    newTodayDelta: 12.4,
    monthRevenue: 184320000, // ₩ this month (GMV)
    monthRevenueDelta: 8.7,
    pendingPayout: 23940000, // ₩ awaiting settlement
    pendingPayoutCount: 18,
  };

  // ── Last 7 days transaction volume (count) + revenue (₩) ────────────
  window.ADMIN_SALES_7D = [
    { day: "월", date: "6/8", count: 284, revenue: 5120000 },
    { day: "화", date: "6/9", count: 312, revenue: 5740000 },
    { day: "수", date: "6/10", count: 268, revenue: 4860000 },
    { day: "목", date: "6/11", count: 401, revenue: 7220000 },
    { day: "금", date: "6/12", count: 488, revenue: 9140000 },
    { day: "토", date: "6/13", count: 372, revenue: 6680000 },
    { day: "일", date: "6/14", count: 429, revenue: 7910000 },
  ];

  // ── Users ───────────────────────────────────────────────────────────
  // status: active | suspended | withdrawn
  window.ADMIN_USERS = [
    { id: "U-10293", name: "김도윤", email: "doyoon.kim@gmail.com", joined: "2026-06-14", role: "구매자", orders: 0, status: "active" },
    { id: "U-10288", name: "이서아", email: "seoa.lee@kakao.com", joined: "2026-06-13", role: "판매자", orders: 12, status: "active" },
    { id: "U-10271", name: "박지호", email: "jiho.park@naver.com", joined: "2026-06-12", role: "구매자", orders: 5, status: "active" },
    { id: "U-10264", name: "최유진", email: "yujin.choi@gmail.com", joined: "2026-06-12", role: "구매자", orders: 2, status: "suspended" },
    { id: "U-10250", name: "정민준", email: "minjun.j@outlook.com", joined: "2026-06-11", role: "판매자", orders: 31, status: "active" },
    { id: "U-10243", name: "강하늘", email: "haneul.kang@gmail.com", joined: "2026-06-11", role: "구매자", orders: 1, status: "active" },
    { id: "U-10238", name: "윤서연", email: "seoyeon.yoon@kakao.com", joined: "2026-06-10", role: "구매자", orders: 8, status: "withdrawn" },
    { id: "U-10221", name: "임재현", email: "jaehyun.lim@gmail.com", joined: "2026-06-10", role: "판매자", orders: 47, status: "active" },
    { id: "U-10210", name: "한소희", email: "sohee.han@naver.com", joined: "2026-06-09", role: "구매자", orders: 3, status: "active" },
    { id: "U-10204", name: "오지안", email: "jian.oh@gmail.com", joined: "2026-06-09", role: "구매자", orders: 0, status: "suspended" },
    { id: "U-10198", name: "신예준", email: "yejun.shin@kakao.com", joined: "2026-06-08", role: "판매자", orders: 22, status: "active" },
    { id: "U-10185", name: "조아인", email: "ain.cho@gmail.com", joined: "2026-06-08", role: "구매자", orders: 6, status: "active" },
    { id: "U-10172", name: "배준우", email: "junwoo.bae@naver.com", joined: "2026-06-07", role: "구매자", orders: 4, status: "active" },
    { id: "U-10166", name: "권나윤", email: "nayoon.kwon@gmail.com", joined: "2026-06-07", role: "구매자", orders: 9, status: "withdrawn" },
    { id: "U-10159", name: "황시우", email: "siu.hwang@kakao.com", joined: "2026-06-06", role: "판매자", orders: 15, status: "active" },
  ];

  // ── Seller applications ─────────────────────────────────────────────
  // status: pending | approved | rejected
  window.ADMIN_SELLER_APPS = [
    { id: "S-2041", name: "이서아", shop: "비주얼랩", category: "이미지 생성", email: "seoa.lee@kakao.com", applied: "2026-06-14", intro: "미드저니·DALL·E 기반 제품 목업과 광고 컷 프롬프트를 전문으로 제작합니다. 광고 대행사 5년 경력.", samples: 8, status: "pending" },
    { id: "S-2039", name: "정민준", shop: "데브플로우", category: "코딩", email: "minjun.j@outlook.com", applied: "2026-06-14", intro: "리액트·SQL 리팩터링과 테스트 자동화 프롬프트. 시니어 개발자가 검증한 워크플로우를 제공합니다.", samples: 12, status: "pending" },
    { id: "S-2036", name: "한소희", shop: "카피킷", category: "글쓰기", email: "sohee.han@naver.com", applied: "2026-06-13", intro: "전환율 중심의 랜딩·이메일 카피 프레임워크. 퍼포먼스 마케터 출신.", samples: 6, status: "pending" },
    { id: "S-2030", name: "배준우", shop: "그로스하우스", category: "마케팅", email: "junwoo.bae@naver.com", applied: "2026-06-12", intro: "SNS 콘텐츠 캘린더와 광고 문구 자동화 프롬프트 묶음.", samples: 5, status: "approved" },
    { id: "S-2024", name: "조아인", shop: "토크봇", category: "챗봇", email: "ain.cho@gmail.com", applied: "2026-06-11", intro: "CS 상담 챗봇 페르소나와 에스컬레이션 규칙 설계.", samples: 4, status: "approved" },
    { id: "S-2019", name: "권나윤", shop: "데이터핀", category: "데이터 분석", email: "nayoon.kwon@gmail.com", applied: "2026-06-10", intro: "엑셀·CSV 데이터 요약 및 인사이트 리포트 프롬프트.", samples: 3, status: "rejected" },
  ];

  // ── Products awaiting review ────────────────────────────────────────
  // status: pending | approved | rejected
  window.ADMIN_PRODUCTS = [
    {
      id: "P-5582", title: "사진 같은 제품 목업 생성기", seller: "비주얼랩", category: "이미지 생성", model: "Midjourney v6",
      price: 5900, submitted: "2026-06-14", status: "pending",
      desc: "제품 사진을 스튜디오 품질의 광고 컷으로 바꿔주는 미드저니 프롬프트. 조명·각도·배경을 한 번에 지정합니다.",
      prompt: "A high-end studio product photograph of {제품}, placed on a {배경 소재} surface, lit with soft three-point studio lighting, 85mm lens, f/2.8, shallow depth of field, crisp reflections, commercial advertising style, ultra-detailed, 8k --ar 4:5 --style raw",
      tags: ["제품사진", "광고", "스튜디오 조명"],
    },
    {
      id: "P-5579", title: "전환율 높이는 랜딩 카피 작성", seller: "카피킷", category: "글쓰기", model: "GPT-4o",
      price: 4900, submitted: "2026-06-14", status: "pending",
      desc: "후킹 헤드라인부터 CTA까지, 검증된 프레임워크로 랜딩 페이지 카피를 단계별로 만들어 줍니다.",
      prompt: "당신은 전환율 최적화 전문 카피라이터입니다. 다음 제품 정보를 바탕으로 (1) 후킹 헤드라인 3안, (2) 서브 헤드라인, (3) 핵심 베네핏 3가지, (4) 신뢰 요소, (5) CTA 문구 2안을 PAS 프레임워크로 작성하세요. 제품: {제품 설명}, 타깃: {타깃 고객}.",
      tags: ["랜딩페이지", "카피라이팅", "전환율"],
    },
    {
      id: "P-5574", title: "SQL 쿼리 자동 작성 & 최적화", seller: "데브플로우", category: "코딩", model: "GPT-4o",
      price: 6500, submitted: "2026-06-13", status: "pending",
      desc: "자연어로 원하는 데이터를 설명하면 정확한 SQL과 인덱스 튜닝 팁까지 제안합니다.",
      prompt: "역할: 시니어 데이터 엔지니어. 사용자가 자연어로 요청한 데이터 질의를 PostgreSQL 표준 SQL로 변환하세요. 테이블 스키마: {스키마}. 출력 형식: ```sql 블록 + 인덱스 추천 + 예상 비용 코멘트```. 요청: {요청}.",
      tags: ["SQL", "데이터베이스", "최적화"],
    },
    {
      id: "P-5568", title: "30일 SNS 콘텐츠 캘린더", seller: "그로스하우스", category: "마케팅", model: "GPT-4o",
      price: 3900, submitted: "2026-06-13", status: "pending",
      desc: "브랜드 톤만 입력하면 한 달치 인스타·스레드 게시물 아이디어와 카피를 자동 생성합니다.",
      prompt: "브랜드 {브랜드명}({업종})의 30일 SNS 콘텐츠 캘린더를 표로 작성하세요. 열: 날짜, 채널(IG/Threads), 포맷, 후킹 카피, 해시태그 5개. 톤: {브랜드 톤}. 주 1회 프로모션 포함.",
      tags: ["SNS", "콘텐츠 캘린더", "인스타그램"],
    },
    {
      id: "P-5560", title: "감성 일러스트 캐릭터 시트", seller: "비주얼랩", category: "이미지 생성", model: "Midjourney v6",
      price: 4500, submitted: "2026-06-12", status: "pending",
      desc: "일관된 캐릭터를 여러 포즈·표정으로 생성하는 캐릭터 시트 프롬프트.",
      prompt: "Character reference sheet of {캐릭터 설명}, multiple poses and facial expressions, front and side view, soft pastel color palette, clean line art, consistent character design, white background --ar 16:9 --niji 6",
      tags: ["캐릭터", "일러스트", "레퍼런스 시트"],
    },
    {
      id: "P-5551", title: "친절한 CS 챗봇 페르소나", seller: "토크봇", category: "챗봇", model: "Claude 3.5",
      price: 6900, submitted: "2026-06-11", status: "pending",
      desc: "고객 문의를 따뜻하고 정확하게 응대하는 상담 챗봇 시스템 프롬프트. 에스컬레이션 규칙 포함.",
      prompt: "당신은 {브랜드}의 고객 상담원입니다. 항상 공손하고 따뜻한 존댓말을 사용하세요. 환불·교환 문의는 정책 {정책 링크}를 근거로 안내하고, 욕설·법적 분쟁·결제 오류는 즉시 '상담원 연결'로 에스컬레이션하세요. 모르는 내용은 추측하지 말고 확인 후 안내한다고 답하세요.",
      tags: ["CS", "챗봇", "페르소나"],
    },
  ];

  // ── Settlements ─────────────────────────────────────────────────────
  // status: pending | approved | paid | held
  window.ADMIN_SETTLEMENTS = [
    { id: "T-7781", seller: "임재현", shop: "데브플로우", period: "2026-05", sales: 142, gross: 11240000, fee: 1686000, amount: 9554000, requested: "2026-06-01", status: "pending" },
    { id: "T-7780", seller: "이서아", shop: "비주얼랩", period: "2026-05", sales: 98, gross: 7820000, fee: 1173000, amount: 6647000, requested: "2026-06-01", status: "pending" },
    { id: "T-7778", seller: "배준우", shop: "그로스하우스", period: "2026-05", sales: 211, gross: 9430000, fee: 1414500, amount: 8015500, requested: "2026-06-01", status: "approved" },
    { id: "T-7775", seller: "신예준", shop: "워크플로우랩", period: "2026-05", sales: 64, gross: 3120000, fee: 468000, amount: 2652000, requested: "2026-06-01", status: "approved" },
    { id: "T-7770", seller: "황시우", shop: "스튜디오K", period: "2026-05", sales: 53, gross: 2740000, fee: 411000, amount: 2329000, requested: "2026-06-01", status: "held" },
    { id: "T-7766", seller: "조아인", shop: "토크봇", period: "2026-04", sales: 120, gross: 8280000, fee: 1242000, amount: 7038000, requested: "2026-05-01", status: "paid" },
    { id: "T-7761", seller: "정민준", shop: "데브플로우", period: "2026-04", sales: 88, gross: 6960000, fee: 1044000, amount: 5916000, requested: "2026-05-01", status: "paid" },
    { id: "T-7755", seller: "한소희", shop: "카피킷", period: "2026-04", sales: 175, gross: 7350000, fee: 1102500, amount: 6247500, requested: "2026-05-01", status: "paid" },
  ];

  // ── helpers ─────────────────────────────────────────────────────────
  window.adminWon = function (n) {
    return "₩" + Math.round(n).toLocaleString("ko-KR");
  };
  // compact ₩ for big KPI numbers: 184,320,000 → 1.84억
  window.adminWonShort = function (n) {
    if (n >= 100000000) return (n / 100000000).toFixed(2).replace(/\.?0+$/, "") + "억원";
    if (n >= 10000) return Math.round(n / 10000).toLocaleString("ko-KR") + "만원";
    return "₩" + n.toLocaleString("ko-KR");
  };
})();
