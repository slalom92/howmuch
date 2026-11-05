// GET /api/search?kind=query|handle|id|username&q=검색어
// 후보 채널 목록을 돌려준다. 같은 검색어는 Vercel CDN에 7일 캐시된다 (채널 ID는 거의 바뀌지 않고, 숫자는 /api/channel 에서 따로 새로 받는다).
import { call, channelsBy, query, send, sendError } from './_lib/youtube.js'
import { knownHandle, cleanQuery } from './_lib/known.js'
import { remember } from './_lib/store.js'

// 같은 사이트의 다른 주소를 부른다 (CDN 캐시를 같이 쓰므로 대부분 YouTube 호출 없이 끝난다)
async function getSelf(req, path, ms = 1500) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'donmeter.com'
  const proto = req.headers['x-forwarded-proto'] || (/^(localhost|127\.)/.test(host) ? 'http' : 'https')
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), ms)
  try {
    const r = await fetch(`${proto}://${host}${path}`, { signal: ctl.signal })
    return r.ok ? await r.json() : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// 잘 알려진 채널 이름이면 핸들로 바로 찾는다 (100단위 → 1단위, 결과도 CDN에 캐시)
async function byKnownName(req, q) {
  let slug = knownHandle(q)
  if (!slug) {
    const tr = await getSelf(req, '/api/trending/')
    slug = knownHandle(q, tr?.source === 'trending' ? tr.items : [])
  }
  if (!slug) return null
  const hit = await getSelf(req, `/api/search/?kind=handle&q=${encodeURIComponent('@' + slug.toLowerCase())}`, 4000)
  if (hit?.items?.length) return hit.items
  const items = await channelsBy({ forHandle: '@' + slug })
  return items.length ? items : null
}

const KINDS = new Set(['query', 'handle', 'id', 'username'])
const DAY = 86400
const WEEK = DAY * 7

export default async function handler(req, res) {
  const params = query(req)
  const kind = params.get('kind')
  const q = (params.get('q') || '').trim()
  if (!KINDS.has(kind) || !q || q.length > 100) return send(res, 400, { error: '검색어를 확인한 뒤 다시 검색하세요.' })

  try {
    let items
    if (kind === 'id') items = await channelsBy({ id: q })
    else if (kind === 'handle') items = await channelsBy({ forHandle: q })
    else if (kind === 'username') items = await channelsBy({ forUsername: q })
    else if ((items = await byKnownName(req, q))) {
      // 사전에 있는 이름: 핸들 조회로 끝
    } else {
      // 사전에 없는 이름만 search.list(하루 약 100회 제한)를 쓴다
      const s = await call('search', {
        part: 'snippet',
        type: 'channel',
        q: cleanQuery(q),
        maxResults: 6,
        regionCode: 'KR',
        relevanceLanguage: 'ko',
      })
      const ids = (s.items || []).map((i) => i.snippet?.channelId || i.id?.channelId).filter(Boolean)
      items = ids.length ? await channelsBy({ id: ids.join(',') }) : []
      items.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    }
    // 검색에서 만난 채널을 자동완성 목록에 쌓는다 (저장소가 없으면 그냥 넘어간다)
    await remember(items)
    return send(res, 200, { items }, WEEK)
  } catch (e) {
    return sendError(res, e)
  }
}
