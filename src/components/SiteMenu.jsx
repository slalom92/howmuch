import { HOME, MENU_MINE, MENU_OTHERS, MENU_GOLF, MENU_READ, MENU_HELP, YOUTUBER, HEADER_LINK } from '../lib/menu.js'

// 넓은 화면은 "메뉴" 왼쪽에 "오늘의 돈 뉴스" 링크 하나만 두고, "메뉴" 버튼은 모든 너비에서 보인다 (모양은 public/themes.css)
// 메뉴 안: 홈 / 내 돈으로 재기(이름 + 한 줄 설명) / 남의 돈 엿보기(골프 투어 4개 한 줄) / 읽을거리 / 도움말.
// 정적 페이지는 scripts/sync-menu.mjs 로 같은 모양을 쓴다. 바깥 클릭·Esc 로 닫는 동작은 public/theme.js 가 맡는다.
// items, links 는 예전 이름이라 받기만 한다 (페이지마다 링크를 고르던 때의 흔적)
export default function SiteMenu({ current = YOUTUBER }) {
  const cur = (href) => (current === href ? 'page' : undefined)
  const golfOn = MENU_GOLF.some((g) => g.href === current)
  const list = (items, className) => (
    <ul className={className}>
      {items.map((m) => (
        <li key={m.href}>
          <a href={m.href} aria-current={cur(m.href)}>
            {m.label}
          </a>
        </li>
      ))}
    </ul>
  )
  return (
    <>
      <a className="navlink" href={HEADER_LINK.href} aria-current={cur(HEADER_LINK.href)}>
        {HEADER_LINK.label}
      </a>
      <details className="site-menu">
        <summary className="site-menu__btn" aria-label="메뉴 열기">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
          </svg>
          메뉴
        </summary>
        <div className="site-menu__list">
          <a className="site-menu__home" href={HOME} aria-current={cur(HOME)}>
            돈미터 홈
          </a>
          <p className="site-menu__head">내 돈으로 재기</p>
          <ul className="site-menu__mine">
            {MENU_MINE.map((m) => (
              <li key={m.href}>
                <a href={m.href} aria-current={cur(m.href)}>
                  <strong>{m.label}</strong>
                  <span>{m.desc}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="site-menu__head">남의 돈 엿보기</p>
          {list(MENU_OTHERS, 'site-menu__grid')}
          <div className={`site-menu__golf${golfOn ? ' is-on' : ''}`}>
            <span>골프 상금</span>
            {MENU_GOLF.map((m) => (
              <a key={m.href} href={m.href} title={m.title} aria-label={m.title} aria-current={cur(m.href)}>
                {m.label}
              </a>
            ))}
          </div>
          <p className="site-menu__head">읽을거리</p>
          {list(MENU_READ, 'site-menu__grid')}
          {list(MENU_HELP, 'site-menu__help')}
        </div>
      </details>
    </>
  )
}
