import { HOME, MENU_CALCS, MENU_GOLF, MENU_MORE, YOUTUBER, YOUTUBER_LINKS } from '../lib/menu.js'

// 넓은 화면은 links 를 줄지어 보여 주고, "메뉴" 버튼은 모든 너비에서 보인다 (모양은 public/themes.css)
// 메뉴 안: 홈, 계산기(2열), 골프 선수 상금(투어 4개 한 줄), 더 보기. 정적 페이지는 scripts/sync-menu.mjs 로 같은 모양을 쓴다.
// 바깥 클릭·Esc 로 닫는 동작은 public/theme.js 가 맡는다.
// links: 넓은 화면에 줄지어 보일 링크 (기본은 유튜버 수익 계산기 쪽 메뉴). items 는 예전 이름이라 받기만 한다.
export default function SiteMenu({ current = YOUTUBER, links = YOUTUBER_LINKS }) {
  const cur = (href) => (current === href ? 'page' : undefined)
  const golfOn = MENU_GOLF.some((g) => g.href === current)
  return (
    <>
      {links.map((m) => (
        <a key={m.href} className="navlink" href={m.href} aria-current={cur(m.href)}>
          {m.label}
        </a>
      ))}
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
          <p className="site-menu__head">계산기</p>
          <ul className="site-menu__grid">
            {MENU_CALCS.map((m) => (
              <li key={m.href}>
                <a href={m.href} aria-current={cur(m.href)}>
                  {m.label}
                </a>
              </li>
            ))}
          </ul>
          <div className={`site-menu__golf${golfOn ? ' is-on' : ''}`}>
            <span>골프 상금</span>
            {MENU_GOLF.map((m) => (
              <a key={m.href} href={m.href} title={m.title} aria-label={m.title} aria-current={cur(m.href)}>
                {m.label}
              </a>
            ))}
          </div>
          <p className="site-menu__head">더 보기</p>
          <ul className="site-menu__more">
            {MENU_MORE.map((m) => (
              <li key={m.href}>
                <a href={m.href} aria-current={cur(m.href)}>
                  {m.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </>
  )
}
