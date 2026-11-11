// 역 주변 집 찾기 (카카오맵 주소 검색, 화면에서 그때그때)
//
// 카카오 정책상 로컬 API 결과는 실시간으로만 쓸 수 있어 어디에도 저장하지 않는다.
// 같은 화면 안에서 같은 주소를 두 번 찾지 않도록 이 페이지가 열려 있는 동안만 메모리에 들고 있는다.
import { meters } from './commute.js'

const memo = new Map()
const LIMIT = 120 // 한 번에 번지까지 찾는 집 수 (가까운 동부터)
const DONG_SLACK = 1200 // 동 중심이 반경 + 이만큼 안이면 그 동의 집을 찾아본다

function search(kakao, kind, q) {
  const key = `${kind}|${q}`
  if (memo.has(key)) return memo.get(key)
  const p = new Promise((resolve) => {
    const done = (res, status) => {
      const r = status === kakao.maps.services.Status.OK && res[0] ? res[0] : null
      resolve(r ? { lat: Number(r.y), lng: Number(r.x) } : null)
    }
    if (kind === 'addr') new kakao.maps.services.Geocoder().addressSearch(q, done)
    else new kakao.maps.services.Places().keywordSearch(q, done)
  })
  memo.set(key, p)
  return p
}

// 할 일을 n개씩 나눠 돌린다
async function pool(items, n, fn, isAlive) {
  const queue = [...items]
  await Promise.all(
    Array.from({ length: Math.min(n, queue.length) }, async () => {
      while (queue.length && isAlive()) await fn(queue.shift())
    }),
  )
}

// homes: fitHome 을 거친 집들, station: { lat, lng }, radius: m
// onUpdate(list, done, cut) 로 찾는 대로 알려 준다. cut: 집이 많아 가까운 LIMIT 곳까지만 찾았을 때 true. list 는 반경 안의 집 (+ lat, lng, dist, approx)
export async function findNear(kakao, homes, station, radius, onUpdate, isAlive = () => true) {
  const found = []
  const push = (h, pos, approx) => {
    const dist = meters(station, pos)
    if (dist <= radius) found.push({ ...h, lat: pos.lat, lng: pos.lng, dist, approx: approx || h.approx })
  }

  // 1) 동 중심
  const dongs = new Map()
  for (const h of homes) {
    const q = `${h.full} ${h.dong}`
    if (!dongs.has(q)) dongs.set(q, null)
  }
  await pool([...dongs.keys()], 6, async (q) => dongs.set(q, await search(kakao, 'addr', q)), isAlive)
  if (!isAlive()) return found

  const near = []
  for (const h of homes) {
    const c = dongs.get(`${h.full} ${h.dong}`)
    if (!c) continue
    const d = meters(station, c)
    if (d > radius + DONG_SLACK) continue
    if (h.approx) push(h, c, true)
    else near.push({ h, c, d })
  }
  onUpdate([...found], false)

  // 2) 번지 (가까운 동부터, 많으면 LIMIT 곳까지)
  near.sort((a, b) => a.d - b.d)
  let batch = 0
  await pool(
    near.slice(0, LIMIT),
    6,
    async ({ h, c }) => {
      let pos = await search(kakao, 'addr', `${h.full} ${h.dong} ${h.jibun}`)
      if (!pos && h.kind === 'apt' && h.name) pos = await search(kakao, 'keyword', `${h.sggName} ${h.dong} ${h.name}`)
      push(h, pos || c, !pos)
      if (++batch % 12 === 0 && isAlive()) onUpdate([...found], false)
    },
    isAlive,
  )
  if (isAlive()) onUpdate([...found], true, near.length > LIMIT)
  return found
}
