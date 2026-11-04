// GET /api/trending/
// "다른 유튜버 수익도 보기" 목록을 자동으로 갱신한다.
// YouTube 한국 인기 동영상(chart=mostPopular) 50개의 채널을 순위대로 모아, 구독자 10만 명 이상이고
// @핸들이 있는 채널만 남긴다. API 사용량은 갱신 1번에 2 (videos 1 + channels 1).
// 결과는 Vercel CDN에 6시간 캐시되어 모든 방문자와 채널 페이지가 함께 쓴다.
// 실패하면 src/lib/popular.js 의 고정 목록을 돌려준다.
import { call, send } from './_lib/youtube.js'
import { POPULAR, channelSlug } from '../src/lib/popular.js'

const SIX_HOURS = 6 * 3600
const MIN_SUBS = 100000
const LIMIT = 20

export default async function handler(req, res) {
  try {
    const top = await call('videos', { part: 'snippet', chart: 'mostPopular', regionCode: 'KR', maxResults: 50 })
    const ids = []
    for (const v of top.items || []) {
      const id = v.snippet?.channelId
      if (id && !ids.includes(id)) ids.push(id)
    }
    if (!ids.length) throw new Error('empty')

    const ch = await call('channels', { part: 'snippet,statistics', id: ids.join(','), maxResults: 50 })
    const byId = new Map((ch.items || []).map((c) => [c.id, c]))
    const items = []
    for (const id of ids) {
      const c = byId.get(id)
      if (!c) continue
      const st = c.statistics || {}
      const subs = Number(st.subscriberCount || 0)
      const handle = c.snippet?.customUrl || ''
      if (st.hiddenSubscriberCount || subs < MIN_SUBS || !handle) continue
      items.push({ slug: channelSlug({ id, handle }), name: c.snippet.title, subs })
      if (items.length >= LIMIT) break
    }
    if (items.length < 5) throw new Error('too few')
    return send(res, 200, { source: 'trending', updatedAt: new Date().toISOString(), items }, SIX_HOURS)
  } catch (e) {
    if (e?.message && !['empty', 'too few'].includes(e.message)) console.error('[trending]', e.message)
    // 고정 목록은 짧게 캐시해서 다음 요청 때 다시 인기 목록을 시도한다
    return send(res, 200, { source: 'fixed', items: POPULAR.map(({ slug, name }) => ({ slug, name })) }, 600)
  }
}
