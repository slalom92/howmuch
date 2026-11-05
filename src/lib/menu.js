// 사이트 메뉴 (정적 페이지 public/*/index.html 의 메뉴도 같은 목록으로 맞춘다)
export const HOME = '/'
export const YOUTUBER = '/youtuber/'
export const WEDDING_GIFT = '/wedding-gift/'

// 좁은 화면에서 "메뉴"를 누르면 보이는 전체 목록
export const MENU = [
  { href: HOME, label: '돈미터 홈' },
  { href: YOUTUBER, label: '유튜버 수익 계산기' },
  { href: WEDDING_GIFT, label: '축의금 계산기' },
  { href: '/channel/', label: '유튜버별 수익' },
  { href: '/guide/', label: '수익 가이드' },
  { href: '/how/', label: '계산 방법' },
  { href: '/faq/', label: '자주 묻는 질문' },
]

// 유튜버 수익 계산기 쪽 넓은 화면에서 줄지어 보이는 링크
export const YOUTUBER_LINKS = MENU.slice(3)

export const FOOTER_MENU = [
  ...MENU.slice(1),
  { href: '/about/', label: '사이트 소개' },
  { href: '/privacy/', label: '개인정보처리방침' },
  { href: '/terms/', label: '이용약관' },
  { href: '/contact/', label: '문의' },
]
