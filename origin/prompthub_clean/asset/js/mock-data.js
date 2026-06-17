/* PromptHub — marketplace mock data (richer set for the landing grid).
 * Overrides window.PH_DATA from the design-system bundle so reused screens
 * (DetailScreen) and our own screens share one source of truth. */
window.PH_DATA = {
  categories: [
    { id: "all", label: "전체" },
    { id: "image", label: "이미지 생성", icon: "image", desc: "광고컷·일러스트·목업" },
    { id: "writing", label: "글쓰기", icon: "pen-line", desc: "카피·블로그·이메일" },
    { id: "coding", label: "코딩", icon: "code-xml", desc: "리팩터링·디버깅·테스트" },
    { id: "marketing", label: "마케팅", icon: "megaphone", desc: "SNS·광고·전략" },
    { id: "chatbot", label: "챗봇", icon: "message-circle", desc: "페르소나·상담" },
    { id: "data", label: "데이터 분석", icon: "bar-chart-3", desc: "요약·인사이트" },
  ],
  // popular search tags shown under the hero (label + the query they fire)
  tags: [
    { label: "ChatGPT", q: "GPT-4o" },
    { label: "Midjourney", q: "Midjourney" },
    { label: "Claude", q: "Claude" },
    { label: "블로그 글쓰기", q: "글쓰기" },
    { label: "제품 사진", q: "이미지" },
    { label: "SNS 마케팅", q: "마케팅" },
  ],
  prompts: [
    { id: 1, title: "사진 같은 제품 목업 생성기", cat: "image", icon: "image", model: "Midjourney v6", price: 5900, rating: 4.9, sales: 1240, seller: "비주얼랩", badge: "신규", desc: "제품 사진을 스튜디오 품질의 광고 컷으로 바꿔주는 미드저니 프롬프트. 조명·각도·배경을 한 번에 지정합니다." },
    { id: 2, title: "전환율 높이는 랜딩 카피 작성", cat: "writing", icon: "pen-line", model: "GPT-4o", price: 4900, originalPrice: 7900, rating: 4.8, sales: 980, seller: "카피킷", badge: "베스트", desc: "후킹 헤드라인부터 CTA까지, 검증된 프레임워크로 랜딩 페이지 카피를 단계별로 만들어 줍니다." },
    { id: 3, title: "리액트 컴포넌트 리팩터링 도우미", cat: "coding", icon: "code-xml", model: "Claude 3.5", price: 7900, rating: 5.0, sales: 612, seller: "데브플로우", desc: "지저분한 컴포넌트를 깔끔한 훅 기반 구조로 리팩터링하고, 테스트 코드까지 제안합니다." },
    { id: 4, title: "30일 SNS 콘텐츠 캘린더", cat: "marketing", icon: "megaphone", model: "GPT-4o", price: 3900, originalPrice: 5900, rating: 4.7, sales: 2310, seller: "그로스하우스", badge: "베스트", desc: "브랜드 톤만 입력하면 한 달치 인스타·스레드 게시물 아이디어와 카피를 자동 생성합니다." },
    { id: 5, title: "친절한 CS 챗봇 페르소나", cat: "chatbot", icon: "message-circle", model: "Claude 3.5", price: 6900, rating: 4.9, sales: 540, seller: "토크봇", desc: "고객 문의를 따뜻하고 정확하게 응대하는 상담 챗봇 시스템 프롬프트. 에스컬레이션 규칙 포함." },
    { id: 6, title: "엑셀 데이터 인사이트 요약", cat: "data", icon: "bar-chart-3", model: "GPT-4o", price: 0, rating: 4.6, sales: 430, seller: "데이터핀", desc: "표 데이터를 붙여넣으면 핵심 추세·이상치·다음 액션을 보고서 형태로 정리해 줍니다." },
    { id: 7, title: "감성 일러스트 캐릭터 시트", cat: "image", icon: "image", model: "Midjourney v6", price: 4500, rating: 4.8, sales: 870, seller: "비주얼랩", desc: "일관된 캐릭터를 여러 포즈·표정으로 생성하는 캐릭터 시트 프롬프트." },
    { id: 8, title: "유튜브 스크립트 후킹 오프닝", cat: "writing", icon: "pen-line", model: "GPT-4o", price: 0, rating: 4.7, sales: 1520, seller: "카피킷", badge: "신규", desc: "첫 15초에 이탈을 막는 강력한 오프닝 훅을 주제별로 생성합니다." },
    { id: 9, title: "SQL 쿼리 자동 작성 & 최적화", cat: "coding", icon: "code-xml", model: "GPT-4o", price: 6500, originalPrice: 9900, rating: 4.8, sales: 720, seller: "데브플로우", desc: "자연어로 원하는 데이터를 설명하면 정확한 SQL과 인덱스 튜닝 팁까지 제안합니다." },
    { id: 10, title: "브랜드 로고 컨셉 무드보드", cat: "image", icon: "image", model: "Midjourney v6", price: 5200, rating: 4.7, sales: 660, seller: "스튜디오K", badge: "신규", desc: "브랜드 키워드를 입력하면 색·형태·분위기가 일관된 로고 컨셉 시안을 한 번에 생성합니다." },
    { id: 11, title: "고객 후기 → 광고 문구 변환기", cat: "marketing", icon: "megaphone", model: "Claude 3.5", price: 4200, rating: 4.9, sales: 1130, seller: "그로스하우스", desc: "실제 리뷰를 붙여넣으면 신뢰감 있는 광고 카피와 헤드라인 후보를 자동으로 뽑아 줍니다." },
    { id: 12, title: "회의록 → 액션 아이템 정리", cat: "writing", icon: "pen-line", model: "GPT-4o", price: 0, rating: 4.6, sales: 1980, seller: "워크플로우랩", badge: "베스트", desc: "긴 회의 내용을 담당자·기한이 명확한 할 일 목록으로 깔끔하게 요약합니다." },
  ],
};
