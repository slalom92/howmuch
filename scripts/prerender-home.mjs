// 빌드 뒤 홈 화면(dist/index.html)에 첫 화면 HTML을 미리 채운다.
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
const htmlPath = path.join(root, 'dist', 'index.html')
const outDir = path.join(root, 'node_modules', '.prerender')
const outFile = path.join(outDir, 'entry.mjs')

// Vite 처럼 VITE_ 로 시작하는 환경변수를 import.meta.env 로 넘긴다
const env = { MODE: 'production', PROD: true, DEV: false, SSR: true, BASE_URL: '/' }
for (const [k, v] of Object.entries(process.env)) if (k.startsWith('VITE_')) env[k] = v

try {
  mkdirSync(outDir, { recursive: true })
  await build({
    entryPoints: [path.join(root, 'src', 'entry-server.jsx')],
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
  if (!re.test(html)) throw new Error('dist/index.html 에서 <div id="root"></div> 를 찾지 못했습니다')
  writeFileSync(htmlPath, html.replace(re, () => `<div id="root"><!--prerender-->${markup}<!--/prerender--></div>`))
  console.log(`[prerender] 홈 화면 HTML ${(markup.length / 1024).toFixed(1)}KB 를 dist/index.html 에 넣었습니다`)
} catch (e) {
  console.warn('[prerender] 홈 화면 미리 채우기를 건너뜁니다:', e?.message || e)
} finally {
  rmSync(outDir, { recursive: true, force: true })
}
