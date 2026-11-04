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

// 마지막 한글 글자에 받침이 있으면 '이에요', 없으면 '예요'
function withEyo(text) {
  const last = [...text].reverse().find((ch) => ch >= '가' && ch <= '힣')
  const hasFinal = last ? (last.charCodeAt(0) - 0xac00) % 28 !== 0 : false
  return text + (hasFinal ? '이에요' : '예요')
}

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

  const self = new URL(origin + '/s/')
  for (const [k, v] of app.searchParams) self.searchParams.set(k, v)

  let title = '이 유튜버, 한 달에 얼마 벌까? | 유튜버 월급명세서'
  let desc = '좋아하는 유튜버의 한 달 광고 수익을 추정해 드려요. 우리 회사에 다닌다면 몇 년차 무슨 직급일지, 내 채널로 따라잡으려면 얼마나 걸릴지도 알려 드립니다.'

  const channel = app.searchParams.get('c') ? await getJson(origin, `/api/channel/?id=${encodeURIComponent(c)}`) : null
  if (channel?.videos) {
    const monthly = monthlyRevenue(analyze(channel.videos), 'mid').total
    const avg = COMPARE.find((x) => x.id === 'avg').monthly
    const r = ratioText(monthly, avg)
    const vsWorker = r === '비슷한 수준' ? '직장인 평균 월급과 비슷한 수준이에요' : withEyo(`직장인 평균 월급의 ${r}`)

    const company = app.searchParams.get('co') ? await getJson(origin, `/api/company/?code=${co}`) : null
    if (company?.avgSalary) {
      const { place } = placeInCompany(company, monthly * 12)
      const companyName = company.stockName || company.name
      title = `${channel.title}, ${companyName}에 다닌다면? ${place.text}`
      desc = `한 달 추정 수익 ${won(monthly)}${place.sub ? `, ${place.sub}에 해당하는 연봉` : ''}. ${vsWorker}. 우리 회사로도 계산해 보세요.`
    } else {
      title = `${channel.title} 한 달 추정 수익 ${won(monthly)}`
      desc = `${vsWorker}. 우리 회사에 다닌다면 몇 년차 무슨 직급일지, 내 채널로는 얼마나 걸릴지 확인해 보세요.`
    }
  }

  const target = app.toString()
  const image = `${origin}/og/share-v1.png`
  // 카카오 스크랩 규칙: og:url 은 이 페이지 주소와 같아야 하고, 봇은 자바스크립트를 실행하지 않는다.
  // 그래서 meta refresh 없이 자바스크립트로만 계산기 화면으로 넘긴다.
  const html = `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="유튜버 월급명세서" />
<meta property="og:locale" content="ko_KR" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${esc(self.toString())}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:width" content="1600" />
<meta property="og:image:height" content="800" />
<meta property="og:image:alt" content="유튜버 월급명세서: 이 유튜버, 한 달에 얼마 벌까?" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(image)}" />
</head><body>
<p><a href="${esc(target)}">${esc(title)} 결과 보기</a></p>
<script>location.replace(${JSON.stringify(target)})</script>
</body></html>`

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', `public, s-maxage=${SIX_HOURS}, stale-while-revalidate=3600`)
  res.end(html)
}
