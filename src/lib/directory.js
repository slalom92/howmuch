// 검색창 자동완성: /api/directory/ 의 채널 목록을 한 번 받아 두고 브라우저에서 바로 찾는다.
// 후보를 고르면 @핸들로 찾으므로 YouTube 이름 검색(한 번에 100단위)을 쓰지 않는다.

const KEY = 'yt:dir'
const TTL = 6 * 3600 * 1000
let mem = null
let loading = null

export function normName(s) {
  return String(s || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s·.,'"!?()[\]{}~_\-|:/@]+/g, '')
}

function prepare(items) {
  return items.map((it) => ({ ...it, k: normName(it.n), ks: normName(it.s) }))
}

export function loadDirectory() {
  if (mem) return Promise.resolve(mem)
  if (loading) return loading
  try {
    const { t, v } = JSON.parse(localStorage.getItem(KEY) || 'null') || {}
    if (t && Date.now() - t < TTL && Array.isArray(v)) return Promise.resolve((mem = prepare(v)))
  } catch {
    /* 무시 */
  }
  loading = fetch('/api/directory/')
    .then((r) => (r.ok ? r.json() : null))
    .then((body) => {
      const v = Array.isArray(body?.items) ? body.items : []
      try {
        if (v.length) localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), v }))
      } catch {
        /* 저장 공간이 없으면 그냥 쓴다 */
      }
      mem = prepare(v)
      return mem
    })
    .catch(() => (mem = []))
    .finally(() => {
      loading = null
    })
  return loading
}

// 이름이 검색어로 시작하면 먼저, 그다음 이름이나 핸들에 들어 있으면. 같은 순위면 구독자 많은 순.
export function suggest(dir, q, limit = 6) {
  const n = normName(q)
  if (!dir?.length || !n) return []
  const scored = []
  for (const it of dir) {
    let rank = -1
    if (it.k === n || it.ks === n) rank = 0
    else if (it.k.startsWith(n) || it.ks.startsWith(n)) rank = 1
    else if (n.length >= 2 && (it.k.includes(n) || it.ks.includes(n))) rank = 2
    if (rank >= 0) scored.push([rank, -(it.c || 0), it])
  }
  scored.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  return scored.slice(0, limit).map((x) => x[2])
}

// 목록에 똑같은 이름이 하나만 있으면 그 채널 (엔터로 바로 검색할 때)
export function exactMatch(dir, q) {
  const n = normName(q)
  if (!n) return null
  const hits = (dir || []).filter((it) => it.k === n || it.ks === n)
  return hits.length === 1 ? hits[0] : null
}

// 자동완성 항목을 검색창에 넘길 값으로 (채널 ID면 그대로, 아니면 @핸들)
export const toQuery = (it) => (/^UC[\w-]{22}$/.test(it.s) ? it.s : '@' + it.s)
