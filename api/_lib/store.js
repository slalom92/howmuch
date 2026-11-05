// 채널 목록 저장소 (선택 사항): Upstash Redis (Vercel Marketplace → Upstash for Redis)
//
// 환경변수 KV_REST_API_URL / KV_REST_API_TOKEN (또는 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)이
// 있으면 검색·인기 목록에서 만난 채널을 쌓아 검색창 자동완성(/api/directory/)에 쓴다.
// 없으면 아무것도 저장하지 않고, 자동완성은 고정 목록과 인기 목록만으로 동작한다.
//
// YouTube API 정책: 채널 ID 말고는 30일 넘게 새로 고치지 않은 데이터를 두지 않는다.
// 채널을 다시 만날 때마다 이름·구독자 수를 새로 쓰고, 30일 동안 다시 안 보인 채널은 지운다.

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || ''
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''
const HASH = 'dm:ch'
const SEEN = 'dm:seen'
export const KEEP_MS = 30 * 86400 * 1000
const MIN_SUBS = 10000

export const storeEnabled = () => Boolean(URL_ && TOKEN)

async function pipeline(cmds, ms = 1500) {
  if (!storeEnabled() || !cmds.length) return null
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try {
    const r = await fetch(`${URL_.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmds),
      signal: ctl.signal,
    })
    if (!r.ok) throw new Error(`store ${r.status}`)
    return await r.json()
  } catch (e) {
    console.error('[store]', e.message)
    return null
  } finally {
    clearTimeout(t)
  }
}

// 채널 요약(summarize 결과 또는 { id, handle, title, subscribers }) 목록을 기억한다. 실패해도 조용히 넘어간다.
export async function remember(channels) {
  if (!storeEnabled()) return
  const now = Date.now()
  const cmds = []
  for (const c of channels || []) {
    if (!c?.id || c.hiddenSubscribers) continue
    const subs = Number(c.subscribers || 0)
    if (subs < MIN_SUBS) continue
    const slug = (c.handle || '').replace(/^@/, '') || c.id
    const v = JSON.stringify({ s: slug, n: c.title, c: subs })
    cmds.push(['HSET', HASH, c.id, v], ['ZADD', SEEN, String(now), c.id])
  }
  await pipeline(cmds)
}

// 최근에 본 채널부터 최대 limit 개. 30일 넘게 안 보인 채널은 이때 지운다.
export async function recall(limit = 3000) {
  if (!storeEnabled()) return []
  const old = String(Date.now() - KEEP_MS)
  const pruned = await pipeline([['ZRANGEBYSCORE', SEEN, '-inf', old, 'LIMIT', '0', '500']])
  const stale = pruned?.[0]?.result || []
  if (stale.length) await pipeline([['HDEL', HASH, ...stale], ['ZREM', SEEN, ...stale]])

  const ids = (await pipeline([['ZREVRANGE', SEEN, '0', String(limit - 1)]]))?.[0]?.result || []
  if (!ids.length) return []
  const vals = (await pipeline([['HMGET', HASH, ...ids]], 3000))?.[0]?.result || []
  const out = []
  vals.forEach((v) => {
    try {
      const o = JSON.parse(v)
      if (o?.s && o?.n) out.push(o)
    } catch {
      /* 깨진 값은 건너뛴다 */
    }
  })
  return out
}
