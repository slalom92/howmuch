// GET /api/route/?mode=walk|transit&sx=경도&sy=위도&ex=경도&ey=위도
// 직주근접 계산기: 고른 집 → 고른 역 경로 (카카오맵 REST API 도보·대중교통 경로 조회)
//
// - 키: KAKAO_REST_KEY (카카오디벨로퍼스 REST API 키). 서버에서만 읽고 브라우저에는 보내지 않는다. VITE_ 를 붙이지 않는다.
// - 카카오 정책상 경로 결과는 실시간으로만 쓴다: 저장하지 않고 CDN 에도 캐시하지 않는다 (no-store).
// - 카드를 눌렀을 때만 부른다. 다른 사이트에서 이 주소를 쓰지 못하게 돈미터 주소에서 온 요청만 받는다.
import { send } from './_lib/youtube.js'

const KAKAO = {
  walk: 'https://dapi.kakao.com/v2/routing/walk',
  transit: 'https://dapi.kakao.com/v2/routing/publictraffic',
}
const MAX_POINTS = 400 // 지도에 그릴 점 수 (넘으면 솎아 낸다)

const STATUS_TEXT = {
  SAME_POINT: '집과 역이 거의 같은 곳이에요',
  EQUAL_POINTS: '집과 역이 거의 같은 곳이에요',
  TOO_FAR_AWAY: '걸어가기엔 너무 멀어요',
  START_LINK_NOT_FOUND: '집 근처에서 길을 찾지 못했어요',
  END_LINK_NOT_FOUND: '역 근처에서 길을 찾지 못했어요',
  STARTNODES_NULL: '집 근처에 탈 수 있는 대중교통이 없어요',
  ENDNODES_NULL: '역 근처에 내릴 수 있는 대중교통이 없어요',
  NO_RESULTS: '경로를 찾지 못했어요',
  ROUTE_RESULT_NOT_FOUND: '경로를 찾지 못했어요',
}

function allowed(req) {
  const from = String(req.headers?.origin || req.headers?.referer || '')
  if (!from) return false // 브라우저는 같은 사이트 요청에도 Referer 를 보낸다 (주소만). 둘 다 없으면 받지 않는다
  try {
    const host = new URL(from).hostname
    return host === 'donmeter.com' || host.endsWith('.donmeter.com') || host.endsWith('.vercel.app') || host === 'localhost' || host === '127.0.0.1'
  } catch {
    return false
  }
}

const inKorea = (x, y) => Number.isFinite(x) && Number.isFinite(y) && x > 124 && x < 132 && y > 33 && y < 39

// 점이 너무 많으면 고르게 솎아 낸다 (처음과 끝은 남긴다)
function thin(points) {
  if (points.length <= MAX_POINTS) return points
  const step = (points.length - 1) / (MAX_POINTS - 1)
  return Array.from({ length: MAX_POINTS }, (_, i) => points[Math.round(i * step)])
}
const round = ([x, y]) => [Math.round(x * 1e6) / 1e6, Math.round(y * 1e6) / 1e6]
const pathOf = (steps) => thin(steps.flatMap((s) => s.path?.points || []).filter((p) => Array.isArray(p) && p.length >= 2)).map(round)

export function walkResult(j) {
  const r = j.route
  return {
    mode: 'walk',
    time: Math.round(r.properties?.totalTime || 0),
    distance: Math.round(r.properties?.totalDistance || 0),
    path: pathOf((r.legs || []).flatMap((l) => l.steps || [])),
    link: r.properties?.landingUrl || '',
  }
}

export function transitResult(j) {
  // 가장 빨리 가는 경로 하나
  const best = [...(j.routes || [])].sort((a, b) => (a.properties?.totalTime || 1e9) - (b.properties?.totalTime || 1e9))[0]
  const p = best.properties || {}
  const steps = (best.steps || []).map((s) => {
    const q = s.properties || {}
    return {
      type: q.type || '',
      time: Math.round(q.time || 0),
      distance: Math.round(q.distance || 0),
      name: (q.vehicles || []).map((v) => v.name).filter(Boolean).slice(0, 3).join(', '),
      from: q.stops?.[0]?.name || '',
      to: q.stops?.at?.(-1)?.name || '',
      path: thin(s.path?.points || []).map(round),
    }
  })
  return {
    mode: 'transit',
    time: Math.round(p.totalTime || 0),
    distance: Math.round(p.totalDistance || 0),
    transfers: p.transfers || 0,
    fare: p.fare?.value || p.fare?.min || 0,
    steps,
    link: j.properties?.landingURL || '',
  }
}

export default async function handler(req, res) {
  if (!allowed(req)) return send(res, 403, { error: '돈미터에서만 쓸 수 있어요' })
  const key = (process.env.KAKAO_REST_KEY || '').trim()
  if (!key) return send(res, 503, { error: '경로 기능이 아직 준비되지 않았어요' })

  const q = req.query || Object.fromEntries(new URL(req.url, 'http://x').searchParams)
  const mode = q.mode === 'transit' ? 'transit' : 'walk'
  const [sx, sy, ex, ey] = ['sx', 'sy', 'ex', 'ey'].map((k) => Number(q[k]))
  if (!inKorea(sx, sy) || !inKorea(ex, ey)) return send(res, 400, { error: '좌표가 올바르지 않아요' })

  const p = new URLSearchParams({ start_x: sx, start_y: sy, end_x: ex, end_y: ey, s_name: '집', e_name: String(q.name || '역').slice(0, 30) })
  try {
    const r = await fetch(`${KAKAO[mode]}?${p}`, { headers: { Authorization: `KakaoAK ${key}` } })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) {
      console.error('[route]', mode, r.status, j.msg || j.message || '')
      const text = r.status === 429 ? '오늘 경로 조회가 너무 많았어요. 내일 다시 해 주세요' : '경로를 불러오지 못했어요'
      return send(res, r.status === 429 ? 429 : 502, { error: text })
    }
    const status = j.status || (j.route || j.routes ? 'OK' : '')
    if (status !== 'OK' || (mode === 'walk' ? !j.route : !j.routes?.length)) return send(res, 200, { mode, none: STATUS_TEXT[status] || '경로를 찾지 못했어요' })
    return send(res, 200, mode === 'walk' ? walkResult(j) : transitResult(j))
  } catch (e) {
    console.error('[route]', mode, e.message)
    return send(res, 502, { error: '경로를 불러오지 못했어요' })
  }
}
