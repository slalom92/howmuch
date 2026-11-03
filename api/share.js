// GET /s/?c=채널ID&co=회사고유번호  (vercel.json 에서 /s/ → /api/share/ 로 연결)
//
// 카카오톡·X·페이스북 같은 SNS는 자바스크립트를 실행하지 않고 HTML의 og 태그만 읽는다.
// 그래서 공유 링크는 이 페이지를 거치게 해 "침착맨 한 달 추정 수익 7,948만 원 · 삼성전자 기준 부장급" 같은
// 미리보기 문구를 만들고, 사람이 열면 바로 계산기 화면으로 넘긴다.
import { query } from './_lib/youtube.js'
import { analyze, monthlyRevenue } from '../src/lib/calc.js'
import { placeInCompany } from '../src/lib/career.js'
import { won, ratioText } from '../src/lib/format.js'
import { COMPARE } from '../src/lib/compare.js'

const SIX_HOURS = 6 * 3600

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function getJson(origin, path) {
  try {
    const r = await fetch(origin + path)
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  const params = query(req)
  const c = (params.get('c') || '').trim()
  const co = (params.get('co') || '').trim()
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'howmuchyoutube.blog'
  const proto = req.headers['x-forwarded-proto'] || (/^(localhost|127\.)/.test(host) ? 'http' : 'https')
  const origin = `${proto}://${host}`

  const app = new URL(origin + '/')
  if (/^[\w-]{10,64}$/.test(c)) app.searchParams.set('c', c)
  if (/^\d{8}$/.test(co)) app.searchParams.set('co', co)

  let title = '이 유튜버, 한 달에 얼마 벌까? | 유튜버 월급명세서'
  let desc = '유튜버 이름만 검색하면 광고 수익을 추정하고 직장인 월급, 우리 회사 연봉과 비교해 봅니다.'

  const channel = app.searchParams.get('c') ? await getJson(origin, `/api/channel/?id=${encodeURIComponent(c)}`) : null
  if (channel?.videos) {
    const monthly = monthlyRevenue(analyze(channel.videos), 'mid').total
    title = `${channel.title} 한 달 추정 수익 ${won(monthly)}`
    const avg = COMPARE.find((x) => x.id === 'avg').monthly
    desc = `직장인 평균 월급의 ${ratioText(monthly, avg)}.`

    const company = app.searchParams.get('co') ? await getJson(origin, `/api/company/?code=${co}`) : null
    if (company?.avgSalary) {
      const { place } = placeInCompany(company, monthly * 12)
      desc = `${company.name}에 다닌다면 ${place.text}${place.sub ? ` (${place.sub})` : ''}. ${desc}`
    }
    desc += ' 공개 데이터로 계산한 추정치입니다.'
  }

  const target = app.toString()
  const html = `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="유튜버 월급명세서" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${esc(target)}" />
<meta property="og:image" content="${esc(origin)}/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(origin)}/og-image.png" />
<link rel="canonical" href="${esc(target)}" />
<meta http-equiv="refresh" content="0; url=${esc(target)}" />
</head><body>
<p><a href="${esc(target)}">${esc(title)} 결과 보기</a></p>
<script>location.replace(${JSON.stringify(target)})</script>
</body></html>`

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', `public, s-maxage=${SIX_HOURS}, stale-while-revalidate=3600`)
  res.end(html)
}
