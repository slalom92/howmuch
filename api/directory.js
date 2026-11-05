// GET /api/directory/
// 검색창 자동완성용 채널 목록. YouTube API를 부르지 않는다 (인기 목록은 CDN 캐시를 그대로 쓴다).
//   1) 많이 찾는 유튜버(src/lib/popular.js)와 핸들을 확인해 둔 채널(_lib/known.js)
//   2) 요즘 뜨는 채널(/api/trending/)
//   3) 저장소가 연결돼 있으면 검색·채널 페이지에서 만난 구독자 1만 명 이상 채널 (_lib/store.js)
// 응답: { updatedAt, items: [{ s: 핸들(또는 채널 ID), n: 이름, c: 구독자 수 }] }
import { send } from './_lib/youtube.js'
import { POPULAR } from '../src/lib/popular.js'
import { EXTRA } from './_lib/known.js'
import { recall } from './_lib/store.js'

async function getSelf(req, path, ms = 1500) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'donmeter.com'
  const proto = req.headers['x-forwarded-proto'] || (/^(localhost|127\.)/.test(host) ? 'http' : 'https')
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try {
    const r = await fetch(`${proto}://${host}${path}`, { signal: ctl.signal })
    return r.ok ? await r.json() : null
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

export default async function handler(req, res) {
  const [tr, stored] = await Promise.all([getSelf(req, '/api/trending/'), recall().catch(() => [])])
  const seen = new Map()
  const add = (s, n, c = 0) => {
    if (!s || !n) return
    const k = s.toLowerCase()
    const prev = seen.get(k)
    if (!prev || (c && c > prev.c)) seen.set(k, { s, n, c: c || prev?.c || 0 })
  }
  for (const p of POPULAR) add(p.slug, p.name)
  for (const p of EXTRA) add(p.slug, p.name)
  if (tr?.source === 'trending') for (const p of tr.items) add(p.slug, p.name, p.subs)
  for (const p of stored) add(p.s, p.n, p.c)

  const items = [...seen.values()]
  return send(res, 200, { updatedAt: new Date().toISOString(), items }, 3600, 86400)
}
