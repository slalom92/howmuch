// public/sitemap.xml 을 다시 만든다:  node scripts/build-sitemap.mjs
//
// 넣는 주소
//   1) 계산기 페이지 (아래 PAGES)
//   2) public/ 아래 정적 페이지 (…/index.html 이 있는 폴더 전부, noindex 페이지는 뺀다)
//   3) 채널 페이지: src/lib/popular.js 의 "많이 찾는 유튜버" 목록 (/channel/<slug>/)
//
// lastmod(마지막 수정일)는 그 페이지를 만드는 파일들이 git 에 마지막으로 커밋된 날이다.
// 아직 커밋하지 않은 변경이 있으면 파일 수정 시각을 쓴다. 새 계산기를 만들면 PAGES 에 한 줄 더한다.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SITE = 'https://donmeter.com'
const root = process.cwd()

// 계산기 페이지: 주소 → 그 페이지 내용을 바꾸는 파일·폴더
const PAGES = [
  { url: '/', files: ['index.html', 'public/hub.css'] },
  { url: '/youtuber/', files: ['youtuber/index.html', 'src/App.jsx', 'src/components', 'src/lib'] },
  { url: '/wedding-gift/', files: ['wedding-gift/index.html', 'src/pages/wedding-gift'] },
  { url: '/kbo/', files: ['kbo/index.html', 'src/pages/kbo'] },
  { url: '/klpga/', files: ['klpga/index.html', 'src/pages/klpga'] },
  { url: '/kpga/', files: ['kpga/index.html', 'src/pages/kpga', 'src/pages/klpga'] },
  { url: '/pga/', files: ['pga/index.html', 'src/pages/pga', 'src/pages/klpga'] },
]

// 채널 페이지는 서버(api/page.js)가 그린다
const CHANNEL_FILES = ['api/page.js', 'api/_lib', 'src/lib/popular.js']

const day = (d) => d.toISOString().slice(0, 10)

function git(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

// 폴더면 안의 파일 전부의 가장 늦은 수정 시각
function newestMtime(p) {
  const full = path.join(root, p)
  if (!existsSync(full)) return 0
  const st = statSync(full)
  if (!st.isDirectory()) return st.mtimeMs
  let max = 0
  for (const name of readdirSync(full)) max = Math.max(max, newestMtime(path.join(p, name)))
  return max
}

function lastmod(files) {
  const have = files.filter((f) => existsSync(path.join(root, f)))
  const dirty = git(['status', '--porcelain', '--', ...have])
  if (!dirty) {
    const committed = git(['log', '-1', '--format=%cI', '--', ...have])
    if (committed) return day(new Date(committed))
  }
  return day(new Date(Math.max(...have.map(newestMtime))))
}

// public/ 아래 index.html 이 있는 폴더 → 주소
function staticPages(dir = 'public') {
  const out = []
  for (const name of readdirSync(path.join(root, dir))) {
    const rel = path.join(dir, name)
    if (!statSync(path.join(root, rel)).isDirectory()) continue
    const html = path.join(rel, 'index.html')
    if (existsSync(path.join(root, html))) {
      const src = readFileSync(path.join(root, html), 'utf8')
      if (!/<meta[^>]+name="robots"[^>]+noindex/i.test(src)) {
        out.push({ url: '/' + path.relative('public', rel).split(path.sep).join('/') + '/', files: [html] })
      }
    }
    out.push(...staticPages(rel))
  }
  return out
}

const { POPULAR } = await import(pathToFileURL(path.join(root, 'src/lib/popular.js')).href)
const channelDate = lastmod(CHANNEL_FILES)

const pages = [...PAGES, ...staticPages().sort((a, b) => a.url.localeCompare(b.url))]
const entries = pages.map((p) => ({ url: p.url, mod: lastmod(p.files) }))
for (const c of POPULAR) entries.push({ url: `/channel/${c.slug}/`, mod: channelDate })

const seen = new Set()
const lines = entries
  .filter((e) => !seen.has(e.url) && seen.add(e.url))
  .map((e) => `  <url><loc>${SITE}${e.url}</loc><lastmod>${e.mod}</lastmod></url>`)

writeFileSync(
  path.join(root, 'public/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join('\n')}\n</urlset>\n`,
)
console.log(`[sitemap] 주소 ${lines.length}개를 public/sitemap.xml 에 썼습니다`)
