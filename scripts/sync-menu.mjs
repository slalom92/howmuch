// 정적 페이지의 "메뉴"(details.site-menu), 그 왼쪽 링크("자주 묻는 질문" 하나), 바닥글 골프 줄을 src/lib/menu.js 목록으로 다시 쓴다
//   node scripts/sync-menu.mjs
// 대상: index.html(홈), public/**/index.html. 계산기 화면은 src/components/SiteMenu.jsx 가 같은 모양으로 그린다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOME, MENU_CALCS, MENU_GOLF, MENU_MORE, FAQ_LINK } from '../src/lib/menu.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function files() {
  const out = [path.join(ROOT, 'index.html')]
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name === 'index.html') out.push(p)
    }
  }
  walk(path.join(ROOT, 'public'))
  return out
}

// 주소 → 이 페이지의 경로 ("/", "/guide/rpm/")
const pathOf = (file) => {
  const rel = path.relative(ROOT, path.dirname(file)).split(path.sep).join('/')
  const p = rel === '' ? '/' : `/${rel.replace(/^public\//, '').replace(/^public$/, '')}/`
  return p.replace(/\/+/g, '/')
}

const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
function menuHtml(current) {
  const cur = (href) => (href === current ? ' aria-current="page"' : '')
  const li = (m) => `<li><a href="${m.href}"${cur(m.href)}>${esc(m.label)}</a></li>`
  const golfOn = MENU_GOLF.some((g) => g.href === current)
  return (
    '<details class="site-menu">' +
    '<summary class="site-menu__btn" aria-label="메뉴 열기"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2.5 4h11M2.5 8h11M2.5 12h11"/></svg>메뉴</summary>' +
    '<div class="site-menu__list">' +
    `<a class="site-menu__home" href="${HOME}"${cur(HOME)}>돈미터 홈</a>` +
    '<p class="site-menu__head">계산기</p>' +
    `<ul class="site-menu__grid">${MENU_CALCS.map(li).join('')}</ul>` +
    `<div class="site-menu__golf${golfOn ? ' is-on' : ''}"><span>골프 상금</span>${MENU_GOLF.map((m) => `<a href="${m.href}" title="${esc(m.title)}" aria-label="${esc(m.title)}"${cur(m.href)}>${m.label}</a>`).join('')}</div>` +
    '<p class="site-menu__head">더 보기</p>' +
    `<ul class="site-menu__more">${MENU_MORE.map(li).join('')}</ul>` +
    '</div></details>'
  )
}

// 바닥글: 골프 투어 4개 줄을 "골프 선수 상금 KLPGA · KPGA · PGA · LPGA" 한 줄로
const golfLi = () =>
  `<li class="foot-golf">골프 선수 상금 ${MENU_GOLF.map((m) => `<a href="${m.href}" title="${esc(m.title)}">${m.label}</a>`).join(' · ')}</li>`
const GOLF_ROWS = new RegExp(MENU_GOLF.map((m) => `<li><a href="${m.href}">[^<]*</a></li>`).join('\\s*'), 'g')
const GOLF_ONE = /<li class="foot-golf">[\s\S]*?<\/li>/g

let n = 0
for (const f of files()) {
  const s = fs.readFileSync(f, 'utf8')
  const re = /<details class="site-menu">[\s\S]*?<\/details>/
  let out = re.test(s) ? s.replace(re, menuHtml(pathOf(f))) : s
  // 메뉴 왼쪽 링크: 전부 지우고 "자주 묻는 질문" 하나만 메뉴 바로 앞에
  if (re.test(out)) {
    const here = pathOf(f) === FAQ_LINK.href ? ' aria-current="page"' : ''
    out = out.replace(/<a class="navlink"[^>]*>[^<]*<\/a>\s*/g, '').replace('<details class="site-menu">', `<a class="navlink" href="${FAQ_LINK.href}"${here}>${FAQ_LINK.label}</a><details class="site-menu">`)
  }
  out = out.replace(GOLF_ROWS, golfLi()).replace(GOLF_ONE, golfLi())
  if (out !== s) {
    fs.writeFileSync(f, out)
    n++
  }
}
console.log(`[sync-menu] 메뉴를 바꾼 파일 ${n}개`)
