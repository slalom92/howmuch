// 바닥글 링크 목록 (<ul className="footer__links"> 안에 넣는다). 골프는 한 줄에 투어 4개
import { Fragment } from 'react'
import { FOOTER_MENU } from '../lib/menu.js'

export default function FooterLinks() {
  return FOOTER_MENU.map((m) =>
    m.children ? (
      <li key={m.href} className="foot-golf">
        {m.label}{' '}
        {m.children.map((c, i) => (
          <Fragment key={c.href}>
            {i ? ' · ' : ''}
            <a href={c.href} title={c.title}>
              {c.label}
            </a>
          </Fragment>
        ))}
      </li>
    ) : (
      <li key={m.href}>
        <a href={m.href}>{m.label}</a>
      </li>
    ),
  )
}
