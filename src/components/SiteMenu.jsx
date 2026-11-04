import { MENU } from '../lib/menu.js'

// 넓은 화면은 링크를 줄지어, 좁은 화면은 "메뉴" 버튼 하나로 접는다 (모양은 public/themes.css)
// 바깥 클릭·Esc 로 닫는 동작은 public/theme.js 가 맡는다.
export default function SiteMenu({ current = '/' }) {
  return (
    <>
      {MENU.slice(1).map((m) => (
        <a key={m.href} className="navlink" href={m.href} aria-current={current === m.href ? 'page' : undefined}>
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
        <ul className="site-menu__list">
          {MENU.map((m) => (
            <li key={m.href}>
              <a href={m.href} aria-current={current === m.href ? 'page' : undefined}>
                {m.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </>
  )
}
