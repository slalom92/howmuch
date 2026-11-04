// 사이트 주요 메뉴 (정적 페이지 메뉴는 scripts/build_pages.py 에 같은 목록이 있다)
export const MENU = [
  { href: '/', label: '수익 계산기' },
  { href: '/channel/', label: '유튜버별 수익' },
  { href: '/guide/', label: '수익 가이드' },
  { href: '/how/', label: '계산 방법' },
  { href: '/faq/', label: '자주 묻는 질문' },
]

export const FOOTER_MENU = [
  ...MENU.slice(1),
  { href: '/about/', label: '사이트 소개' },
  { href: '/privacy/', label: '개인정보처리방침' },
  { href: '/terms/', label: '이용약관' },
  { href: '/contact/', label: '문의' },
]
