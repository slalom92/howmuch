// 빌드 뒤 각 계산기 페이지(dist/youtuber/, dist/wedding-gift/, dist/kbo/, dist/klpga/, dist/kpga/, dist/pga/, dist/lpga/, dist/apt/, dist/jonber/, dist/survive/, dist/commute/ 의 index.html)에 첫 화면 HTML을 미리 채운다.
// (사이트 첫 화면 dist/index.html 은 계산기를 고르는 정적 페이지라 채울 것이 없다)
//
// SPA는 처음 받는 HTML이 <div id="root"></div> 뿐이라, 자바스크립트를 실행하지 않는
// 검색·광고 심사 로봇에게는 빈 페이지로 보인다. 그래서 React로 홈 화면을 한 번 그려
// <div id="root"> 안에 넣어 둔다. 브라우저에서는 React가 이 자리를 그대로 새로 그린다.
//
// Vite에 들어 있는 esbuild로 src/entry-server.jsx 를 Node용으로 묶어 실행한다 (추가 패키지 없음).
// 실패해도 빌드는 멈추지 않고 경고만 남긴다 (미리 채우기는 있으면 좋은 기능이므로).
import { build } from 'esbuild'
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const root = process.cwd()
const outDir = path.join(root, 'node_modules', '.prerender')

// 미리 채울 페이지: 진입점 → 빌드된 HTML
const PAGES = [
  { name: '유튜버 수익 계산기', entry: 'src/entry-server.jsx', html: 'dist/youtuber/index.html' },
  { name: '축의금 계산기', entry: 'src/pages/wedding-gift/entry-server.jsx', html: 'dist/wedding-gift/index.html' },
  { name: '프로야구 선수 연봉', entry: 'src/pages/kbo/entry-server.jsx', html: 'dist/kbo/index.html' },
  { name: '여자골프 선수 상금', entry: 'src/pages/klpga/entry-server.jsx', html: 'dist/klpga/index.html' },
  { name: '남자골프 선수 상금', entry: 'src/pages/kpga/entry-server.jsx', html: 'dist/kpga/index.html' },
  { name: 'PGA 투어 선수 상금', entry: 'src/pages/pga/entry-server.jsx', html: 'dist/pga/index.html' },
  { name: 'LPGA 투어 선수 상금', entry: 'src/pages/lpga/entry-server.jsx', html: 'dist/lpga/index.html' },
  { name: '연봉 모아 집 사기', entry: 'src/pages/apt/entry-server.jsx', html: 'dist/apt/index.html' },
  { name: '월급 분당 계산기', entry: 'src/pages/jonber/entry-server.jsx', html: 'dist/jonber/index.html' },
  { name: '존버 계산기', entry: 'src/pages/survive/entry-server.jsx', html: 'dist/survive/index.html' },
  { name: '직주근접 계산기', entry: 'src/pages/commute/entry-server.jsx', html: 'dist/commute/index.html' },
]

// Vite 처럼 VITE_ 로 시작하는 환경변수를 import.meta.env 로 넘긴다
const env = { MODE: 'production', PROD: true, DEV: false, SSR: true, BASE_URL: '/' }
for (const [k, v] of Object.entries(process.env)) if (k.startsWith('VITE_')) env[k] = v

async function prerender(page, i) {
  const outFile = path.join(outDir, `entry-${i}.mjs`)
  const htmlPath = path.join(root, page.html)
  await build({
    entryPoints: [path.join(root, page.entry)],
    outfile: outFile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    jsx: 'automatic',
    loader: { '.js': 'jsx' },
    packages: 'external',
    define: { 'import.meta.env': JSON.stringify(env) },
    logLevel: 'warning',
  })
  const { render } = await import(pathToFileURL(outFile).href)
  const markup = render()

  const html = readFileSync(htmlPath, 'utf8')
  const re = /<div id="root">(?:<!--prerender-->[\s\S]*?<!--\/prerender-->)?<\/div>/
  if (!re.test(html)) throw new Error(`${page.html} 에서 <div id="root"></div> 를 찾지 못했습니다`)
  writeFileSync(htmlPath, html.replace(re, () => `<div id="root"><!--prerender-->${markup}<!--/prerender--></div>`))
  console.log(`[prerender] ${page.name} HTML ${(markup.length / 1024).toFixed(1)}KB 를 ${page.html} 에 넣었습니다`)
}

mkdirSync(outDir, { recursive: true })
// 한 페이지가 실패해도 나머지는 계속한다 (미리 채우기는 있으면 좋은 기능이므로 빌드를 멈추지 않는다)
for (const [i, page] of PAGES.entries()) {
  try {
    await prerender(page, i)
  } catch (e) {
    console.warn(`[prerender] ${page.name} 미리 채우기를 건너뜁니다:`, e?.message || e)
  }
}
rmSync(outDir, { recursive: true, force: true })
