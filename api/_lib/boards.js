// 많이 찾는 순위 (/ranking/ 페이지): GA4 이벤트를 모아 계산기별 순위를 만든다. 데이터베이스는 쓰지 않는다.
//
// - 이벤트 값(채널 ID, 선수 이름, 차 ID, 역 ID)은 GA4 관리 → 맞춤 정의에서 "이벤트 범위 맞춤 측정기준"으로
//   등록해야 Data API로 읽을 수 있다. 등록하지 않은 순위는 그 칸만 { ok: false, reason } 으로 돌려준다.
//     channel_id (view_channel) / player (kbo_view, golf_view) / tour (golf_view) / car (car_pick) / st (commute_station)
// - 사람이 입력한 글자는 그대로 내보내지 않는다. 돈미터 목록에 있는 선수·차·역, YouTube에 있는 구독자 1만 명 이상 채널만 남긴다.
// - 같은 사람이 여러 번 눌러도 한 번으로 세도록 사용자 수(totalUsers)로 순위를 매기고, MIN_USERS 명 미만은 빼서 보여 준다.
// - 이번 주(최근 7일)와 지난주(그 전 7일)를 한 번에 받아 순위 변동을 낸다.
import { PLAYERS as KBO_LIST, TEAMS as KBO_TEAMS } from '../../src/pages/kbo/kbo.js'
import klpga from '../../src/pages/klpga/klpga.js'
import kpga from '../../src/pages/kpga/kpga.js'
import pga from '../../src/pages/pga/pga.js'
import lpga from '../../src/pages/lpga/lpga.js'
import { CARS, carName } from '../../src/pages/car/car.js'
import { channelSlug, channelPath } from '../../src/lib/popular.js'
import { channelsBy } from './youtube.js'

export const MIN_USERS = 5
const TOP = 10
const MIN_SUBS = 10000
const RANGES = [
  { startDate: '6daysAgo', endDate: 'today', name: 'now' },
  { startDate: '13daysAgo', endDate: '7daysAgo', name: 'prev' },
]

const KBO_PLAYERS = new Map(KBO_LIST.map((p) => [p.name, p]))
const KBO_TEAM = Object.fromEntries(KBO_TEAMS.map((t) => [t.id, t.name]))
const TOURS = Object.fromEntries([klpga, kpga, pga, lpga].map((t) => [t.id, t]))
const CAR_BY_ID = new Map(CARS.map((c) => [c.id, c]))
const man = (won) => `${Math.round(won / 1e8 * 10) / 10}억 원`

// GA4 행 → { value(or [values]), now, prev }
function tally(rows, keyOf) {
  const map = new Map()
  for (const r of rows) {
    const range = r.dimensionValues.at(-1).value
    const key = keyOf(r.dimensionValues.slice(0, -1).map((d) => d.value))
    if (!key) continue
    const cur = map.get(key) || { key, now: 0, prev: 0 }
    cur[range === 'prev' ? 'prev' : 'now'] += Number(r.metricValues[0].value) || 0
    map.set(key, cur)
  }
  return [...map.values()]
}

// 이번 주 후보(문턱 이상, 넉넉히 TOP×2) + 지난주 순위 (지난주는 문턱 없이 전체 순위)
function order(items) {
  const prevRank = new Map(
    items
      .filter((x) => x.prev > 0)
      .sort((a, b) => b.prev - a.prev)
      .map((x, i) => [x.key, i + 1]),
  )
  const shown = items.filter((x) => x.now >= MIN_USERS).sort((a, b) => b.now - a.now || a.key.localeCompare(b.key)).slice(0, TOP * 2)
  return shown.map((x) => ({ ...x, prevRank: prevRank.get(x.key) || null }))
}

const eventFilter = (name) => ({
  andGroup: {
    expressions: [
      { filter: { fieldName: 'eventName', stringFilter: { value: name } } },
      { filter: { fieldName: 'country', stringFilter: { value: 'South Korea' } } },
    ],
  },
})

const reportBody = (event, dims) => ({
  dateRanges: RANGES,
  dimensions: dims.map((d) => ({ name: `customEvent:${d}` })),
  metrics: [{ name: 'totalUsers' }],
  dimensionFilter: eventFilter(event),
  limit: 1000,
})

// 순위마다 GA4 요청 하나. 맞춤 측정기준이 없으면 그 순위만 실패로 둔다
const BOARDS = [
  {
    id: 'youtuber',
    label: '유튜버',
    event: 'view_channel',
    dims: ['channel_id'],
    key: ([id]) => (/^UC[\w-]{22}$/.test(id) ? id : null),
    async decorate(list) {
      if (!list.length) return []
      const chans = await channelsBy({ id: list.map((x) => x.key).join(','), maxResults: 50 })
      const byId = new Map(chans.map((c) => [c.id, c]))
      return list
        .map((x) => {
          const c = byId.get(x.key)
          if (!c || c.hiddenSubscribers || c.subscribers < MIN_SUBS) return null
          return { ...x, name: c.title, sub: `구독자 ${c.subscribers.toLocaleString('ko-KR')}명`, href: channelPath(channelSlug(c)) }
        })
        .filter(Boolean)
    },
  },
  {
    id: 'kbo',
    label: '야구선수',
    event: 'kbo_view',
    dims: ['player'],
    key: ([n]) => (KBO_PLAYERS.has(n) ? n : null),
    decorate: (list) =>
      list.map((x) => {
        const p = KBO_PLAYERS.get(x.key)
        return { ...x, name: p.name, sub: `${KBO_TEAM[p.team] || ''} · 2026 연봉 ${man(p.pay * 1e4)}`, href: `/kbo/?name=${encodeURIComponent(p.name)}` }
      }),
  },
  {
    id: 'golf',
    label: '골프선수',
    event: 'golf_view',
    dims: ['player', 'tour'],
    key: ([n, tour]) => (TOURS[tour]?.PLAYERS.some((p) => p.name === n) ? `${tour}|${n}` : null),
    decorate: (list) =>
      list.map((x) => {
        const [tour, n] = x.key.split('|')
        const T = TOURS[tour]
        const p = T.PLAYERS.find((q) => q.name === n)
        return { ...x, name: n, sub: `${tour.toUpperCase()} · 2026 상금 ${man(p.prize)}`, href: `${T.path}?name=${encodeURIComponent(n)}` }
      }),
  },
  {
    id: 'car',
    label: '자동차',
    event: 'car_pick',
    dims: ['car'],
    key: ([id]) => (CAR_BY_ID.has(id) ? id : null),
    decorate: (list) =>
      list.map((x) => {
        const c = CAR_BY_ID.get(x.key)
        const price = c.newPrice ? `2023년 신차 ${c.newPrice.toLocaleString('ko-KR')}만 원` : `중고 시세 ${c.used.toLocaleString('ko-KR')}만 원`
        return { ...x, name: carName(c), sub: `${c.trim} · ${price}`, href: `/car/?car=${encodeURIComponent(c.id)}` }
      }),
  },
  {
    id: 'station',
    label: '회사 근처 역',
    event: 'commute_station',
    dims: ['st'],
    key: ([id]) => (id && id.length <= 40 && id !== '(not set)' ? id : null),
    async decorate(list, ctx) {
      const st = await ctx.stations()
      return list
        .map((x) => {
          const s = st.get(x.key)
          return s ? { ...x, name: `${s.name}역`, sub: s.lines.join(' · '), href: `/commute/?st=${encodeURIComponent(x.key)}` } : null
        })
        .filter(Boolean)
    },
  },
]

// stations.json: { lines, stations: [[id, 이름, 노선 번호들, ...]] } (직주근접 계산기와 같은 파일, CDN에서 받는다)
function stationLoader(origin) {
  let p = null
  return () =>
    (p ||= fetch(`${origin}/data/commute/stations.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`stations ${r.status}`))))
      .then((j) => new Map(j.stations.map(([id, name, ln]) => [String(id), { name, lines: (ln || []).map((i) => j.lines[i]).filter(Boolean) }]))))
}

// GA4 오류 메시지에서 등록 안 된 맞춤 측정기준을 알아본다
function reasonOf(e, dims) {
  const msg = String(e.message || '')
  if (/not a valid dimension|did not match|customEvent/i.test(msg)) return `GA4에 맞춤 측정기준 ${dims.join(', ')} 을(를) 등록해야 해요`
  return '잠시 뒤 다시 확인해 주세요'
}

// run(body) → GA4 runReport 응답 JSON. 실패하면 throw
export async function boards(run, origin) {
  const ctx = { stations: stationLoader(origin) }
  const out = await Promise.all(
    BOARDS.map(async (b) => {
      try {
        const j = await run(reportBody(b.event, b.dims))
        const ranked = order(tally(j.rows || [], b.key))
        // 이름을 붙이며 빠진 항목(작은 채널 등)이 있으면 순위를 다시 매긴다
        const items = (await b.decorate(ranked, ctx)).slice(0, TOP).map((x, i) => ({
          rank: i + 1,
          name: x.name,
          sub: x.sub,
          href: x.href,
          users: x.now,
          move: x.prevRank ? x.prevRank - (i + 1) : null,
          isNew: !x.prevRank,
        }))
        return { id: b.id, label: b.label, ok: true, items }
      } catch (e) {
        console.error('[ranking:board]', b.id, e.message)
        return { id: b.id, label: b.label, ok: false, items: [], reason: reasonOf(e, b.dims) }
      }
    }),
  )
  return { minUsers: MIN_USERS, boards: out }
}
