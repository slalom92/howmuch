// 서버 함수 공용 모듈 (Vercel은 _로 시작하는 파일을 함수로 배포하지 않는다)
//
// API 키는 서버 환경변수 YT_API_KEY에만 둔다. 브라우저 코드에는 키가 들어가지 않는다.
// 응답에 Cache-Control: s-maxage를 붙여 Vercel CDN이 같은 요청 결과를 모든 방문자와 공유하게 한다.

const API = 'https://www.googleapis.com/youtube/v3'
// 기존 키에 HTTP 리퍼러 제한이 걸려 있어도 동작하도록 사이트 주소를 Referer로 보낸다.
const SITE = process.env.SITE_URL || 'https://donmeter.com/'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export async function call(path, params) {
  const key = process.env.YT_API_KEY
  if (!key) throw new ApiError(500, '서버에 YouTube API 키가 설정되지 않았습니다.')

  const qs = new URLSearchParams({ ...params, key })
  let res
  try {
    res = await fetch(`${API}/${path}?${qs}`, { headers: { Referer: SITE } })
  } catch {
    throw new ApiError(502, 'YouTube에 연결하지 못했습니다. 잠시 후 다시 검색하세요.')
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const reason = body?.error?.errors?.[0]?.reason
    console.error('[youtube]', path, res.status, reason, body?.error?.message)
    if (['quotaExceeded', 'dailyLimitExceeded', 'rateLimitExceeded'].includes(reason))
      throw new ApiError(429, '오늘 쓸 수 있는 YouTube 검색량을 모두 썼어요. 아래 많이 찾는 유튜버는 바로 볼 수 있고, 검색은 매일 오후 4~5시(한국 시간)에 다시 열려요.')
    if (res.status === 400 || res.status === 403)
      throw new ApiError(500, '서버의 YouTube API 키 설정을 확인해야 합니다.')
    throw new ApiError(502, 'YouTube에서 데이터를 가져오지 못했습니다. 잠시 후 다시 검색하세요.')
  }
  return body
}

function summarize(ch) {
  const st = ch.statistics || {}
  const th = ch.snippet?.thumbnails || {}
  return {
    id: ch.id,
    title: ch.snippet?.title ?? '',
    handle: ch.snippet?.customUrl ?? '',
    thumbnail: th.medium?.url || th.default?.url || null,
    subscribers: Number(st.subscriberCount || 0),
    hiddenSubscribers: Boolean(st.hiddenSubscriberCount),
    videoCount: Number(st.videoCount || 0),
    totalViews: Number(st.viewCount || 0),
    uploads: ch.contentDetails?.relatedPlaylists?.uploads,
    createdAt: Date.parse(ch.snippet?.publishedAt || '') || null, // 채널 개설일
  }
}

export async function channelsBy(params) {
  const data = await call('channels', { part: 'snippet,statistics,contentDetails', ...params })
  return (data.items || []).map(summarize)
}

function isoToSec(iso = '') {
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  const [, d = 0, h = 0, mi = 0, s = 0] = m.map((x) => Number(x || 0))
  return d * 86400 + h * 3600 + mi * 60 + s
}

export async function recentVideos(uploadsPlaylist) {
  if (!uploadsPlaylist) return []
  const list = await call('playlistItems', { part: 'contentDetails', playlistId: uploadsPlaylist, maxResults: 50 })
  const ids = (list.items || []).map((i) => i.contentDetails.videoId).filter(Boolean)
  if (!ids.length) return []
  const vids = await call('videos', { part: 'snippet,statistics,contentDetails', id: ids.join(','), maxResults: 50 })
  return (vids.items || []).map((v) => ({
    id: v.id,
    publishedAt: Date.parse(v.snippet.publishedAt),
    views: Number(v.statistics?.viewCount || 0),
    durationSec: isoToSec(v.contentDetails?.duration),
    live: v.snippet.liveBroadcastContent,
  }))
}

// ---------- 응답 ----------
export function query(req) {
  return new URL(req.url, 'http://localhost').searchParams
}

export function send(res, status, data, cdnSeconds = 0) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  // 성공한 응답만 CDN에 캐시. 오류(쿼터 초과 등)는 캐시하지 않는다.
  res.setHeader(
    'Cache-Control',
    status === 200 && cdnSeconds ? `public, s-maxage=${cdnSeconds}, stale-while-revalidate=86400` : 'no-store',
  )
  res.end(JSON.stringify(data))
}

export function sendError(res, e) {
  if (e instanceof ApiError) return send(res, e.status, { error: e.message })
  console.error(e)
  return send(res, 500, { error: '알 수 없는 오류가 났습니다. 잠시 후 다시 검색하세요.' })
}
