// 채널 검색과 조회
//
// YouTube API는 브라우저가 직접 부르지 않고 우리 서버 함수(/api/search, /api/channel)를 거친다.
// - API 키가 브라우저 코드에 드러나지 않는다.
// - 서버 응답은 Vercel CDN에 캐시되어, 같은 검색은 모든 방문자가 결과를 공유한다 (쿼터 절약).
// - 브라우저에도 localStorage로 한 번 더 캐시해 같은 사람이 다시 볼 때는 요청 자체를 안 보낸다.
//
// VITE_DEMO_MODE=true 이면 서버 없이 가상 채널 데이터로 동작한다.

import { demoSearch, demoChannel } from './demo.js'

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const CHANNEL_TTL = 6 * 3600 * 1000
const SEARCH_TTL = 24 * 3600 * 1000

// ---------- 브라우저 캐시 ----------
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
  const s = raw.trim().replace(/\s+/g, ' ')
  if (!s) return null
  const url = s.match(/youtube\.com\/(channel\/|@|user\/|c\/)?([^/?#\s]+)/i)
  if (url) {
    const [, prefix = '', rest] = url
    const value = decodeURIComponent(rest)
    if (prefix === 'channel/') return { kind: 'id', value }
    if (prefix === '@') return { kind: 'handle', value: ('@' + value).toLowerCase() }
    if (prefix === 'user/') return { kind: 'username', value: value.toLowerCase() }
    return { kind: 'query', value: value.toLowerCase() }
  }
  if (/^UC[\w-]{22}$/.test(s)) return { kind: 'id', value: s }
  if (s.startsWith('@') && !/\s/.test(s)) return { kind: 'handle', value: s.toLowerCase() }
  // 대소문자만 다른 검색어가 같은 캐시를 쓰도록 소문자로 통일
  return { kind: 'query', value: s.toLowerCase() }
}

// ---------- 서버 함수 호출 ----------
async function apiGet(path, params) {
  let res
  try {
    res = await fetch(`/api/${path}?${new URLSearchParams(params)}`)
  } catch {
    throw new Error('네트워크 연결을 확인한 뒤 다시 검색하세요.')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok || !body) throw new Error(body?.error || '데이터를 가져오지 못했습니다. 잠시 후 다시 검색하세요.')
  return body
}

// 검색: 후보 채널 목록을 돌려준다. 핸들/ID 입력이면 결과는 1개.
export async function searchChannels(raw) {
  const parsed = parseInput(raw)
  if (!parsed) return []
  if (DEMO_MODE) return demoSearch(parsed.value)

  const ck = `yt:s:${parsed.kind}:${parsed.value}`
  const cached = cacheGet(ck, SEARCH_TTL)
  if (cached) return cached

  const { items } = await apiGet('search', { kind: parsed.kind, q: parsed.value })
  cacheSet(ck, items)
  return items
}

// 채널 상세 + 최근 영상
export async function loadChannel(summaryOrId) {
  const id = typeof summaryOrId === 'string' ? summaryOrId : summaryOrId.id
  if (DEMO_MODE) return demoChannel(id)

  const ck = `yt:c:${id}`
  const cached = cacheGet(ck, CHANNEL_TTL)
  if (cached) return cached

  const full = await apiGet('channel', { id })
  cacheSet(ck, full)
  return full
}
