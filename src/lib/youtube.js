// YouTube Data API v3 연동
//
// 쿼터(무료 기본값): search.list는 하루 약 100회로 따로 제한되고,
// channels / playlistItems / videos.list는 1회당 1 unit (하루 10,000 unit).
// 그래서 @핸들·채널 주소·채널 ID 입력은 search.list를 쓰지 않고 바로 조회하고,
// 결과는 localStorage에 캐시해 같은 채널을 다시 볼 때 API를 호출하지 않는다.

import { demoSearch, demoChannel } from './demo.js'

const API = 'https://www.googleapis.com/youtube/v3'
const KEY = import.meta.env.VITE_YT_API_KEY || ''
export const DEMO_MODE = !KEY

const CHANNEL_TTL = 6 * 3600 * 1000
const SEARCH_TTL = 24 * 3600 * 1000

// ---------- 캐시 ----------
function cacheGet(key, ttl) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { t, v } = JSON.parse(raw)
    if (Date.now() - t > ttl) return null
    return v
  } catch {
    return null
  }
}
function cacheSet(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), v }))
  } catch {
    /* 저장 공간 부족 등은 무시 */
  }
}

// ---------- 입력 해석 ----------
// 반환: { kind: 'id' | 'handle' | 'username' | 'query', value }
export function parseInput(raw) {
  const s = raw.trim()
  if (!s) return null
  const url = s.match(/youtube\.com\/(channel\/|@|user\/|c\/)?([^/?#\s]+)/i)
  if (url) {
    const [, prefix = '', rest] = url
    const value = decodeURIComponent(rest)
    if (prefix === 'channel/') return { kind: 'id', value }
    if (prefix === '@') return { kind: 'handle', value: '@' + value }
    if (prefix === 'user/') return { kind: 'username', value }
    return { kind: 'query', value }
  }
  if (/^UC[\w-]{22}$/.test(s)) return { kind: 'id', value: s }
  if (s.startsWith('@') && !/\s/.test(s)) return { kind: 'handle', value: s }
  return { kind: 'query', value: s }
}

// ---------- API ----------
async function call(path, params) {
  const qs = new URLSearchParams({ ...params, key: KEY })
  let res
  try {
    res = await fetch(`${API}/${path}?${qs}`)
  } catch {
    throw new Error('네트워크 연결을 확인한 뒤 다시 검색하세요.')
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const reason = body?.error?.errors?.[0]?.reason
    if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded')
      throw new Error('오늘 사용할 수 있는 검색량을 모두 썼습니다. 내일 다시 시도하거나 @핸들로 검색하세요.')
    if (res.status === 400 || res.status === 403)
      throw new Error('YouTube API 키가 올바르지 않거나 이 사이트 주소에서 쓸 수 없도록 제한되어 있습니다.')
    throw new Error('YouTube에서 데이터를 가져오지 못했습니다. 잠시 후 다시 검색하세요.')
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
  }
}

async function channelsBy(params) {
  const data = await call('channels', { part: 'snippet,statistics,contentDetails', ...params })
  return (data.items || []).map(summarize)
}

function isoToSec(iso = '') {
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  const [, d = 0, h = 0, mi = 0, s = 0] = m.map((x) => Number(x || 0))
  return d * 86400 + h * 3600 + mi * 60 + s
}

async function recentVideos(uploadsPlaylist) {
  if (!uploadsPlaylist) return []
  const list = await call('playlistItems', { part: 'contentDetails', playlistId: uploadsPlaylist, maxResults: 50 })
  const ids = (list.items || []).map((i) => i.contentDetails.videoId).filter(Boolean)
  if (!ids.length) return []
  const vids = await call('videos', { part: 'snippet,statistics,contentDetails', id: ids.join(','), maxResults: 50 })
  return (vids.items || []).map((v) => ({
    id: v.id,
    title: v.snippet.title,
    publishedAt: Date.parse(v.snippet.publishedAt),
    views: Number(v.statistics?.viewCount || 0),
    durationSec: isoToSec(v.contentDetails?.duration),
    live: v.snippet.liveBroadcastContent,
  }))
}

// 검색: 후보 채널 목록을 돌려준다. 핸들/ID 입력이면 결과는 1개.
export async function searchChannels(raw) {
  const parsed = parseInput(raw)
  if (!parsed) return []
  if (DEMO_MODE) return demoSearch(parsed.value)

  const ck = `yt:s:${parsed.kind}:${parsed.value.toLowerCase()}`
  const cached = cacheGet(ck, SEARCH_TTL)
  if (cached) return cached

  let result
  if (parsed.kind === 'id') result = await channelsBy({ id: parsed.value })
  else if (parsed.kind === 'handle') result = await channelsBy({ forHandle: parsed.value })
  else if (parsed.kind === 'username') result = await channelsBy({ forUsername: parsed.value })
  else {
    const s = await call('search', {
      part: 'snippet',
      type: 'channel',
      q: parsed.value,
      maxResults: 6,
      regionCode: 'KR',
      relevanceLanguage: 'ko',
    })
    const ids = (s.items || []).map((i) => i.snippet.channelId || i.id.channelId).filter(Boolean)
    result = ids.length ? await channelsBy({ id: ids.join(',') }) : []
    // search 결과 순서 유지
    result.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
  }
  cacheSet(ck, result)
  return result
}

// 채널 상세 + 최근 영상
export async function loadChannel(summaryOrId) {
  const id = typeof summaryOrId === 'string' ? summaryOrId : summaryOrId.id
  if (DEMO_MODE) return demoChannel(id)

  const ck = `yt:c:${id}`
  const cached = cacheGet(ck, CHANNEL_TTL)
  if (cached) return cached

  let summary = typeof summaryOrId === 'object' && summaryOrId.uploads ? summaryOrId : null
  if (!summary) {
    const [c] = await channelsBy({ id })
    if (!c) throw new Error('채널을 찾지 못했습니다. 채널 주소를 다시 확인하세요.')
    summary = c
  }
  const videos = await recentVideos(summary.uploads)
  const full = { ...summary, videos }
  cacheSet(ck, full)
  return full
}
