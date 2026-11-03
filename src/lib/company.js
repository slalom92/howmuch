// 회사 목록·회사 임금·기준 통계 불러오기 (서버 함수 /api/corps, /api/company, /api/benchmarks)

const CORPS_KEY = 'yt:corps'
const CORPS_TTL = 7 * 86400 * 1000

function cacheGet(key, ttl) {
  try {
    const { t, v } = JSON.parse(localStorage.getItem(key) || 'null') || {}
    return t && Date.now() - t < ttl ? v : null
  } catch {
    return null
  }
}
function cacheSet(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), v }))
  } catch {
    /* 무시 */
  }
}

async function get(path, params) {
  let res
  try {
    res = await fetch(`/api/${path}/${params ? '?' + new URLSearchParams(params) : ''}`)
  } catch {
    throw new Error('네트워크 연결을 확인한 뒤 다시 시도하세요.')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok || !body) throw new Error(body?.error || '데이터를 가져오지 못했습니다. 잠시 후 다시 시도하세요.')
  return body
}

let corpsPromise = null
export function loadCorps() {
  const cached = cacheGet(CORPS_KEY, CORPS_TTL)
  if (cached) return Promise.resolve(cached)
  corpsPromise ??= get('corps')
    .then(({ corps }) => {
      cacheSet(CORPS_KEY, corps)
      return corps
    })
    .catch((e) => {
      corpsPromise = null
      throw e
    })
  return corpsPromise
}

// 회사명 정규화: 공백, (주), 주식회사 제거, 소문자
const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/\(주\)|㈜|주식회사|\s/g, '')

// 정확히 일치 → 앞부분 일치 → 포함 순으로 최대 8개
export function searchCorps(corps, q) {
  const k = norm(q)
  if (!k) return []
  const exact = []
  const prefix = []
  const contains = []
  for (const c of corps) {
    const n = norm(c[1])
    if (n === k || c[2] === k) exact.push(c)
    else if (n.startsWith(k)) prefix.push(c)
    else if (n.includes(k)) contains.push(c)
    if (exact.length + prefix.length >= 8) break
  }
  return [...exact, ...prefix, ...contains].slice(0, 8).map(([code, name, stock]) => ({ code, name, stock }))
}

export function loadCompany(code) {
  const key = `yt:co:${code}`
  const cached = cacheGet(key, CORPS_TTL)
  if (cached) return Promise.resolve(cached)
  return get('company', { code }).then((c) => {
    cacheSet(key, c)
    return c
  })
}

let benchPromise = null
export function loadBenchmarks() {
  benchPromise ??= get('benchmarks').catch((e) => {
    benchPromise = null
    throw e
  })
  return benchPromise
}
