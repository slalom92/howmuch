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
  { href: '/channel/', label: '유튜버별 수익' },
  { href: '/guide/', label: '돈 가이드' },
  { href: '/how/', label: '계산 방법' },
  { href: '/faq/', label: '자주 묻는 질문' },
]

// 유튜버 수익 계산기 쪽 넓은 화면에서 줄지어 보이는 링크
export const YOUTUBER_LINKS = MENU.slice(12)

export const FOOTER_MENU = [
  ...MENU.slice(1),
  { href: '/about/', label: '사이트 소개' },
  { href: '/privacy/', label: '개인정보처리방침' },
  { href: '/terms/', label: '이용약관' },
  { href: '/contact/', label: '문의' },
]
