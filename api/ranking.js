// GET /api/ranking/
// 홈 화면 계산기 아이콘 순서와 HOT 뱃지를 GA4 조회수로 정한다.
//
// - 구글 애널리틱스 Data API 로 최근 7일, 한국 접속의 페이지별 조회수(screenPageViews)를 받아 계산기별로 더한다.
//   (해외 접속은 대부분 데이터센터 봇이라 뺀다)
// - 조회수 순서대로 order, 위 3개를 hot 으로 돌려준다. 결과는 CDN에 1시간 캐시된다.
// - 환경변수 (Vercel → Settings → Environment Variables, VITE_ 를 붙이지 않는다)
//     GA4_SA_KEY       서비스 계정 키 JSON 전체 (그대로 붙여 넣거나 base64 로 바꿔 넣어도 된다)
//     GA4_PROPERTY_ID  GA4 속성 ID (숫자). 없으면 아래 기본값
// - 키가 없거나 조회가 실패하면 503 을 돌려주고, 홈 화면은 HTML 에 적힌 기본 순서를 그대로 쓴다.
import crypto from 'node:crypto'
import { send } from './_lib/youtube.js'

const HOUR = 3600
const DAYS = 7
const TOP = 3
const DEFAULT_PROPERTY = '562129426'

// 홈 화면 아이콘(index.html 의 data-app)과 페이지 주소
export const APPS = [
  { id: 'youtuber', match: (p) => p === '/youtuber/' || p.startsWith('/channel/') },
  { id: 'wedding-gift', match: (p) => p === '/wedding-gift/' },
  { id: 'kbo', match: (p) => p === '/kbo/' },
  { id: 'golf', match: (p) => ['/klpga/', '/kpga/', '/pga/', '/lpga/'].includes(p) },
  { id: 'apt', match: (p) => p === '/apt/' },
  { id: 'jonber', match: (p) => p === '/jonber/' },
  { id: 'survive', match: (p) => p === '/survive/' },
]

function serviceAccount() {
  const raw = (process.env.GA4_SA_KEY || '').trim()
  if (!raw) return null
  const text = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  const key = JSON.parse(text)
  if (!key.client_email || !key.private_key) throw new Error('GA4_SA_KEY 에 client_email, private_key 가 없어요')
  return key
}

const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url')

// 서비스 계정으로 액세스 토큰 받기 (따뜻한 함수에서는 다시 쓰기)
let cached = { token: '', exp: 0 }
async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000)
  if (cached.token && cached.exp - 60 > now) return cached.token
  const head = b64url({ alg: 'RS256', typ: 'JWT' })
  const claim = b64url({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })
  const sig = crypto.createSign('RSA-SHA256').update(`${head}.${claim}`).sign(key.private_key).toString('base64url')
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${sig}` }),
  })
  const j = await r.json()
  if (!r.ok || !j.access_token) throw new Error(`토큰 실패 ${r.status} ${j.error || ''}`)
  cached = { token: j.access_token, exp: now + (j.expires_in || 3600) }
  return cached.token
}

async function pageViews(token, property) {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: `${DAYS}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: { filter: { fieldName: 'country', stringFilter: { value: 'South Korea' } } },
      limit: 10000,
    }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(`GA4 ${r.status} ${j.error?.message || ''}`)
  return (j.rows || []).map((row) => ({ path: row.dimensionValues[0].value, views: Number(row.metricValues[0].value) || 0 }))
}

// 페이지별 조회수 → 계산기별 합계, 순서, HOT
export function rank(rows) {
  const views = Object.fromEntries(APPS.map((a) => [a.id, 0]))
  for (const { path, views: n } of rows) {
    const p = path.endsWith('/') ? path : `${path}/`
    const app = APPS.find((a) => a.match(p))
    if (app) views[app.id] += n
  }
  // 조회수가 같으면 원래 순서(APPS)대로
  const order = APPS.map((a, i) => ({ id: a.id, i, n: views[a.id] }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((a) => a.id)
  return { order, hot: order.filter((id) => views[id] > 0).slice(0, TOP), views }
}

export default async function handler(req, res) {
  try {
    const key = serviceAccount()
    if (!key) return send(res, 503, { error: 'GA4_SA_KEY 가 없어요' })
    const property = (process.env.GA4_PROPERTY_ID || DEFAULT_PROPERTY).trim()
    const rows = await pageViews(await accessToken(key), property)
    return send(res, 200, { days: DAYS, updatedAt: new Date().toISOString(), ...rank(rows) }, HOUR)
  } catch (e) {
    console.error('[ranking]', e.message)
    return send(res, 503, { error: '인기 순서를 불러오지 못했어요' })
  }
}
