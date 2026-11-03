// GET /api/search?kind=query|handle|id|username&q=검색어
// 후보 채널 목록을 돌려준다. 같은 검색어는 Vercel CDN에 24시간 캐시된다.
import { call, channelsBy, query, send, sendError } from './_lib/youtube.js'

const KINDS = new Set(['query', 'handle', 'id', 'username'])
const DAY = 86400

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
    else {
      // 이름 검색만 search.list(하루 약 100회 제한)를 쓴다
      const s = await call('search', {
        part: 'snippet',
        type: 'channel',
        q,
        maxResults: 6,
        regionCode: 'KR',
        relevanceLanguage: 'ko',
      })
      const ids = (s.items || []).map((i) => i.snippet?.channelId || i.id?.channelId).filter(Boolean)
      items = ids.length ? await channelsBy({ id: ids.join(',') }) : []
      items.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    }
    return send(res, 200, { items }, DAY)
  } catch (e) {
    return sendError(res, e)
  }
}
