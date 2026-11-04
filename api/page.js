// GET /channel/<핸들>/  (vercel.json 에서 /channel/:slug/ → /api/page/?slug= 로 연결)
//
// 채널마다 검색에 잡히는 페이지를 만든다.
// - 계산기 화면(index.html)을 그대로 쓰되, <head> 의 제목·설명·canonical 을 그 채널 것으로 바꾸고
// - <div id="root"> 안에 수익 요약을 HTML로 미리 넣는다. 자바스크립트를 실행하지 않는 검색 로봇(네이버 등)도
//   "침착맨 유튜브 수익" 같은 내용을 읽을 수 있다. 브라우저에서는 React가 이 자리를 계산기 화면으로 바꾼다.
// - 채널 데이터는 /api/search/, /api/channel/ 을 거쳐 가져와 CDN 캐시를 계산기 화면과 함께 쓴다.
import { query } from './_lib/youtube.js'
import { analyze, monthlyRevenue, overallAvgViews, PERIODS } from '../src/lib/calc.js'
import { won, count, ratioText } from '../src/lib/format.js'
import { COMPARE } from '../src/lib/compare.js'
import { planGoal, duration, bigCount } from '../src/lib/goal.js'
import { channelSlug, channelPath, normalizeSlug, isChannelId, mergeChannels, revenueTitle } from '../src/lib/popular.js'

const SIX_HOURS = 6 * 3600
const DAY = 86400
const SITE_NAME = '돈미터'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// <script> 안에 넣는 JSON 은 </script> 로 끊기지 않게 < 를 이스케이프
const scriptJson = (v) => JSON.stringify(v).replace(/</g, '\\u003c')

async function getJson(origin, path) {
  try {
    const r = await fetch(origin + path)
    const body = await r.json().catch(() => null)
    return { status: r.status, body }
  } catch {
    return { status: 502, body: null }
  }
}

// 마지막 한글 글자에 받침이 있으면 '이에요', 없으면 '예요'
function eyo(text) {
  const last = [...text].reverse().find((ch) => ch >= '가' && ch <= '힣')
  const hasFinal = last ? (last.charCodeAt(0) - 0xac00) % 28 !== 0 : false
  return text + (hasFinal ? '이에요' : '예요')
}

function kstDate() {
  const d = new Date(Date.now() + 9 * 3600 * 1000)
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`
}

// <head> 안의 태그 하나를 바꾸거나, 없으면 </head> 앞에 넣는다
function setTag(html, re, tag) {
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function applyHead(html, { title, desc, url, robots, jsonLd }) {
  let h = html
  h = setTag(h, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
  h = setTag(h, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`)
  h = h.replace(/[ \t]*<!--[^>]*keywords[^>]*-->\r?\n?/, '').replace(/[ \t]*<meta name="keywords"[^>]*>\r?\n?/, '')
  h = setTag(h, /<meta name="robots"[^>]*>/, `<meta name="robots" content="${robots}" />`)
  h = url
    ? setTag(h, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(url)}" />`)
    : h.replace(/[ \t]*<link rel="canonical"[^>]*>\r?\n?/, '')
  if (url) h = setTag(h, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(url)}" />`)
  h = setTag(h, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`)
  h = setTag(h, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`)
  h = setTag(h, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`)
  h = setTag(h, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(desc)}" />`)
  if (jsonLd) {
    h = setTag(
      h,
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">${scriptJson(jsonLd)}</script>`,
    )
  }
  return h
}

// 홈 화면 HTML이 미리 채워져 있어도(scripts/prerender-home.mjs) 그 자리를 채널 내용으로 바꾼다
const ROOT_RE = /<div id="root">(?:<!--prerender-->[\s\S]*?<!--\/prerender-->)?<\/div>/

function injectRoot(html, inner, boot) {
  const bootTag = boot ? `<script>window.__CHANNEL__=${scriptJson(boot)}</script>` : ''
  return html.replace(ROOT_RE, () => `<div id="root">${inner}</div>${bootTag}`)
}

function popularLinks(excludeSlug, trending, limit = 12) {
  const list = mergeChannels(trending, excludeSlug, limit)
  return `<nav class="ssr__more" aria-label="다른 유튜버 수익">
    <h2>다른 유튜버 수익도 보기</h2>
    <ul>${list.map((p) => `<li><a href="${channelPath(p.slug)}">${esc(p.name)}</a></li>`).join('')}</ul>
    <p><a href="/channel/">유튜버별 수익 전체 보기</a> · <a href="/guide/">유튜브 수익 가이드</a></p>
  </nav>`
}

function shell(inner) {
  return `<div class="ssr">
  <header class="ssr__head"><a class="ssr__brand" href="/">${SITE_NAME}</a></header>
  <main class="ssr__main">${inner}</main>
</div>`
}

// "나도 ○○만큼 벌려면?" 예시 표 (구독자 1천·1만·10만 명, 주 2편 기준)
function goalBlock(ch, a) {
  if (ch.hiddenSubscribers || !ch.subscribers) return ''
  const rows = [1000, 10000, 100000]
    .filter((n) => n < ch.subscribers)
    .map((n) => {
      const p = planGoal({ channel: ch, analysis: a, tier: 'mid', mySubs: n, uploadsPerMonth: 8 })
      return `<tr><th scope="row">${bigCount(n)}명</th><td>매달 ${bigCount(Math.max(1, Math.ceil(p.videosPerMonth)))}편</td><td>평균 ${duration(p.avgMonths)}</td></tr>`
    })
  if (!rows.length) return ''
  const p = planGoal({ channel: ch, analysis: a, tier: 'mid', mySubs: 1000, uploadsPerMonth: 8 })
  const share = p.targetShare >= 1 ? `${p.targetShare.toFixed(1)}%` : `${p.targetShare.toPrecision(1)}%`
  return `<h2>나도 ${esc(ch.title)}만큼 벌려면?</h2>
    <p>${esc(ch.title)}의 한 달 수익을 내 채널로 벌려면 구독자 수에 따라 필요한 영상 수가 크게 달라져요. 구독자 ${bigCount(ch.subscribers)}명 이상 채널은 전체의 ${share}예요.</p>
    <table class="ssr__table">
      <caption>내 구독자 수별로 같은 수익에 필요한 영상과 구독자 ${bigCount(ch.subscribers)}명까지 걸리는 평균 기간</caption>
      <thead><tr><th scope="col">내 구독자</th><th scope="col">필요한 영상</th><th scope="col">구독자 따라잡기</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>
    <p class="ssr__note">내 구독자 수를 직접 넣으면 필요한 조회수와 제작 기간까지 계산해 볼 수 있어요.</p>`
}

function channelBody(ch, a, slug, trending) {
  const mid = monthlyRevenue(a, 'mid').total
  const low = monthlyRevenue(a, 'low').total
  const high = monthlyRevenue(a, 'high').total
  const avg = COMPARE.find((x) => x.id === 'avg').monthly
  const r = ratioText(mid, avg)
  const vs = r === '비슷한 수준' ? '직장인 평균 월급과 비슷한 수준' : `직장인 평균 월급(${won(avg)})의 ${r}`
  const uploads = a.long.uploadsPerMonth + a.short.uploadsPerMonth
  const subs = ch.hiddenSubscribers ? '비공개' : `${count(ch.subscribers)}명`
  const rows = ['day', 'week', 'month', 'year']
    .map((k) => {
      const label = { day: '하루', week: '한 주', month: '한 달', year: '1년' }[k]
      return `<tr><th scope="row">${label}</th><td>${won(mid * PERIODS[k].factor)}</td></tr>`
    })
    .join('')
  return `<h1>${esc(revenueTitle(ch.title))}은 얼마일까?</h1>
    <p class="ssr__lede">${esc(kstDate())} 기준, 최근 영상 조회수로 추정한 ${esc(ch.title)}의 한 달 광고 수익은 <strong>약 ${won(mid)}</strong>이에요. ${esc(eyo(vs))}.</p>
    <dl class="ssr__facts">
      <div><dt>구독자</dt><dd>${subs}</dd></div>
      <div><dt>최근 영상 평균 조회수</dt><dd>${count(overallAvgViews(a))}회</dd></div>
      <div><dt>한 달 업로드</dt><dd>${uploads.toFixed(1)}편</dd></div>
      <div><dt>전체 영상</dt><dd>${count(ch.videoCount)}개</dd></div>
    </dl>
    <table class="ssr__table">
      <caption>${esc(ch.title)} 기간별 추정 광고 수익 (1,000회당 롱폼 2,000원·쇼츠 100원 가정)</caption>
      <tbody>${rows}</tbody>
    </table>
    <p>광고 단가를 낮게 잡으면 한 달 ${won(low)}, 높게 잡으면 ${won(high)}까지 달라져요. 롱폼 광고 수익은 ${won(monthlyRevenue(a, 'mid').long)}, 쇼츠 수익 배분은 ${won(monthlyRevenue(a, 'mid').short)}으로 추정했어요.</p>
    <p class="ssr__note"><span class="src-tag src-tag--est">돈미터 추정</span> YouTube API 공개 데이터(최근 영상 최대 50개)로 돈미터가 따로 계산한 제3자 추정치이며, Google이나 YouTube가 발표하거나 승인한 수치가 아니에요. 협찬, 멤버십, 슈퍼챗 수익은 빠져 있고 실제 정산 금액과 다를 수 있어요. 구독자 수와 전체 영상 수는 YouTube가 제공한 값이에요.</p>
    ${goalBlock(ch, a)}
    <p><a href="https://www.youtube.com/${esc(ch.handle || 'channel/' + ch.id)}" rel="noopener">${esc(ch.title)} 채널 바로가기</a></p>
    ${popularLinks(slug, trending)}`
}

function send(res, status, html, cache) {
  res.statusCode = status
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', cache)
  res.end(html)
}

export default async function handler(req, res) {
  const params = query(req)
  const slug = normalizeSlug(params.get('slug'))
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'donmeter.com'
  const proto = req.headers['x-forwarded-proto'] || (/^(localhost|127\.)/.test(host) ? 'http' : 'https')
  const origin = `${proto}://${host}`

  // 다른 쿼리(회사 비교 ?co=)는 그대로 넘긴다
  const extra = new URLSearchParams()
  const co = params.get('co')
  if (co && /^\d{8}$/.test(co)) extra.set('co', co)
  const qs = extra.toString() ? `?${extra}` : ''

  let template
  try {
    const r = await fetch(origin + '/')
    template = await r.text()
  } catch {
    template = null
  }
  if (!template || !ROOT_RE.test(template)) {
    return send(res, 503, '<!doctype html><title>잠시 후 다시 시도해 주세요</title>', 'no-store')
  }

  const notFound = (status, message, cache) => {
    const html = applyHead(template, {
      title: `채널을 찾지 못했어요 | ${SITE_NAME}`,
      desc: message,
      url: null,
      robots: 'noindex, follow',
    })
    const inner = shell(`<h1>채널을 찾지 못했어요</h1><p class="ssr__lede">${esc(message)}</p>${popularLinks(null, null)}`)
    return send(res, status, injectRoot(html, inner, null), cache)
  }

  if (!slug) return notFound(404, '채널 주소를 확인해 주세요.', `public, s-maxage=${DAY}`)

  // 1) slug → 채널 ID
  let id = isChannelId(slug) ? slug : null
  if (!id) {
    const s = await getJson(origin, `/api/search/?kind=handle&q=${encodeURIComponent('@' + slug)}`)
    if (s.status !== 200) return notFound(503, '잠시 후 다시 시도해 주세요.', 'no-store')
    id = s.body?.items?.[0]?.id
    if (!id) return notFound(404, `@${slug} 채널을 찾지 못했어요. 핸들을 다시 확인해 주세요.`, `public, s-maxage=3600`)
  }

  // 2) 채널 정보 + 최근 영상
  const c = await getJson(origin, `/api/channel/?id=${encodeURIComponent(id)}`)
  if (c.status === 404) return notFound(404, '채널을 찾지 못했어요.', `public, s-maxage=3600`)
  if (c.status !== 200 || !c.body?.videos) return notFound(503, '잠시 후 다시 시도해 주세요.', 'no-store')
  const ch = c.body

  // 3) 대표 주소로 통일 (채널 ID나 대문자로 들어오면 핸들 주소로 301)
  const canonicalSlug = channelSlug(ch)
  let requested = params.get('slug') || ''
  try {
    requested = decodeURIComponent(requested)
  } catch {
    /* 그대로 비교 */
  }
  if (canonicalSlug !== requested.replace(/\/+$/, '')) {
    res.statusCode = 301
    res.setHeader('Location', channelPath(canonicalSlug) + qs)
    res.setHeader('Cache-Control', `public, s-maxage=${DAY}`)
    return res.end()
  }

  // 다른 유튜버 링크: 자동 갱신 목록 (CDN 캐시, 실패하면 고정 목록)
  const tr = await getJson(origin, '/api/trending/')
  const trending = tr.body?.source === 'trending' ? tr.body.items : null

  const a = analyze(ch.videos)
  const mid = monthlyRevenue(a, 'mid').total
  const url = `${origin}${channelPath(canonicalSlug)}`
  const subs = ch.hiddenSubscribers ? '' : `구독자 ${count(ch.subscribers)}명, `
  const title = `${revenueTitle(ch.title)} – 한 달 약 ${won(mid)} 추정 | ${SITE_NAME}`
  const desc = `${subs}최근 영상 평균 조회수 ${count(overallAvgViews(a))}회인 ${ch.title}의 유튜브 광고 수익을 추정했어요. 하루 약 ${won(mid * PERIODS.day.factor)}, 1년 약 ${won(mid * 12)}. 우리 회사 연봉과 비교하고, 내 채널로 같은 수익을 내려면 영상이 몇 편 필요한지도 계산해 보세요.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: SITE_NAME, inLanguage: 'ko-KR' },
      {
        '@type': 'WebPage',
        '@id': `${url}#page`,
        url,
        name: revenueTitle(ch.title),
        description: desc,
        inLanguage: 'ko-KR',
        isPartOf: { '@id': `${origin}/#website` },
        dateModified: new Date().toISOString().slice(0, 10),
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: '유튜버별 수익', item: `${origin}/channel/` },
          { '@type': 'ListItem', position: 3, name: revenueTitle(ch.title), item: url },
        ],
      },
    ],
  }

  const html = applyHead(template, { title, desc, url, robots: 'index, follow, max-image-preview:large', jsonLd })
  const inner = shell(channelBody(ch, a, canonicalSlug, trending))
  return send(res, 200, injectRoot(html, inner, { id: ch.id, slug: canonicalSlug }), `public, s-maxage=${SIX_HOURS}, stale-while-revalidate=${DAY}`)
}
