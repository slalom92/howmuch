// 사이트 메뉴 (정적 페이지 public/*/index.html 의 메뉴도 같은 목록으로 맞춘다)
export const HOME = '/'
export const YOUTUBER = '/youtuber/'
export const WEDDING_GIFT = '/wedding-gift/'
export const KBO = '/kbo/'
export const KLPGA = '/klpga/'
export const KPGA = '/kpga/'
export const PGA = '/pga/'
export const LPGA = '/lpga/'
export const APT = '/apt/'
export const JONBER = '/jonber/'
export const SURVIVE = '/survive/'
export const COMMUTE = '/commute/'
export const CAR = '/car/'
export const SUBSCRIPTION = '/subscription/'
export const MANAGE_FEE = '/manage-fee/'

// 좁은 화면에서 "메뉴"를 누르면 보이는 전체 목록
export const MENU = [
  { href: HOME, label: '돈미터 홈' },
  { href: YOUTUBER, label: '유튜버 수익 계산기' },
  { href: WEDDING_GIFT, label: '축의금 계산기' },
  { href: KBO, label: '프로야구 선수 연봉' },
  { href: KLPGA, label: '여자골프 선수 상금' },
  { href: KPGA, label: '남자골프 선수 상금' },
  { href: PGA, label: 'PGA 선수 상금' },
  { href: LPGA, label: 'LPGA 선수 상금' },
  { href: APT, label: '연봉 모아 집 사기' },
  { href: JONBER, label: '월급 분당 계산기' },
  { href: SURVIVE, label: '존버 계산기' },
  { href: COMMUTE, label: '직주근접 계산기' },
  { href: CAR, label: '자차 계산기' },
  { href: SUBSCRIPTION, label: '월 구독료 계산기' },
  { href: MANAGE_FEE, label: '관리비 계산기' },
  { href: '/channel/', label: '유튜버별 수익' },
  { href: '/guide/', label: '돈 가이드' },
  { href: '/how/', label: '계산 방법' },
  { href: '/faq/', label: '자주 묻는 질문' },
]

// "메뉴"를 눌렀을 때 보이는 묶음 (모든 화면 너비에서 같다)
//   내 돈으로 재기(이름 + 한 줄 설명) / 남의 돈 엿보기(골프 4개 투어는 한 줄) / 읽을거리 / 맨 아래 도움말
// 계산기 화면은 src/components/SiteMenu.jsx, 정적 페이지(index.html, public/**/index.html)는 scripts/sync-menu.mjs 가 이 목록으로 그린다
export const MENU_MINE = [
  { href: JONBER, label: '월급 분당 계산기', desc: '내 시급으로 커피·치킨은 몇 분' },
  { href: SURVIVE, label: '존버 계산기', desc: '월급 한 번으로 며칠 버틸까' },
  { href: CAR, label: '자차 계산기', desc: '내 연봉에 맞는 차와 3년 감가' },
  { href: SUBSCRIPTION, label: '월 구독료 계산기', desc: '구독료는 월급의 몇 %일까' },
  { href: MANAGE_FEE, label: '관리비 계산기', desc: '우리 집 관리비, 평균보다 비쌀까' },
  { href: APT, label: '연봉 모아 집 사기', desc: '몇 년 모으면 이 아파트' },
  { href: COMMUTE, label: '직주근접 계산기', desc: '역 근처 월세와 출퇴근 시간' },
  { href: WEDDING_GIFT, label: '축의금 계산기', desc: '관계별로 얼마 낼까' },
]
export const MENU_OTHERS = [
  { href: YOUTUBER, label: '유튜버 수익' },
  { href: KBO, label: '프로야구 연봉' },
]
export const MENU_GOLF = [
  { href: KLPGA, label: 'KLPGA', title: '여자골프 선수 상금' },
  { href: KPGA, label: 'KPGA', title: '남자골프 선수 상금' },
  { href: PGA, label: 'PGA', title: 'PGA 선수 상금' },
  { href: LPGA, label: 'LPGA', title: 'LPGA 선수 상금' },
]
export const MENU_READ = [
  { href: '/news/', label: '오늘의 돈 뉴스' },
  { href: '/guide/', label: '돈 가이드' },
  { href: '/ranking/', label: '많이 찾는 순위' },
  { href: '/channel/', label: '유튜버별 수익' },
]
export const MENU_HELP = [
  { href: '/how/', label: '계산 방법' },
  { href: '/faq/', label: '자주 묻는 질문' },
  { href: '/about/', label: '사이트 소개' },
]

// 넓은 화면에서 "메뉴" 왼쪽에 보이는 링크 하나 (가장 자주 바뀌는 글)
export const HEADER_LINK = { href: '/news/', label: '오늘의 돈 뉴스' }

// (예전) 유튜버 수익 계산기 쪽 넓은 화면에서 줄지어 보이던 링크
export const YOUTUBER_LINKS = MENU.slice(15)

// 바닥글: 골프 4개 투어는 한 줄로 묶는다 ({ children } 이 있는 항목, src/components/FooterLinks.jsx)
const GOLF_HREFS = MENU_GOLF.map((g) => g.href)
export const FOOTER_MENU = [
  ...MENU.slice(1).flatMap((m) => (m.href === KLPGA ? [{ href: KLPGA, label: '골프 선수 상금', children: MENU_GOLF }] : GOLF_HREFS.includes(m.href) ? [] : [m])),
  { href: '/about/', label: '사이트 소개' },
  { href: '/privacy/', label: '개인정보처리방침' },
  { href: '/terms/', label: '이용약관' },
  { href: '/contact/', label: '문의' },
]
