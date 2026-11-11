// 직주근접 계산기: 회사 근처 역을 고르면 그 역 주변에서 최근 계약된 전월세와 출퇴근 길을 보여 준다
//
// - 사용자는 숫자를 쓰지 않고 전세/월세, 주거 형태, 역에서 거리, 역만 고른다.
// - 계약: 국토교통부 전월세 실거래가(아파트, 연립다세대, 오피스텔, 단독다가구). 매물이 아니라 이미 맺어진 계약이다.
// - 역: 국가철도공단 전국도시철도역사정보표준데이터. 데이터는 scripts/build-commute.mjs 가 public/data/commute/ 에 만든다.
// - 집 위치는 화면에서 그때그때 카카오맵으로 찾고 저장하지 않는다. 경로는 /api/route/ (카카오 경로 조회)로 그때그때 받는다.

export const DATA = '/data/commute'

export const KINDS = [
  { id: 'wolse', label: '월세' },
  { id: 'jeonse', label: '전세' },
]

export const TYPES = [
  { id: 'room', label: '원룸', note: '33㎡ 이하' },
  { id: 'villa', label: '빌라', note: '연립·다세대' },
  { id: 'offi', label: '오피스텔' },
  { id: 'apt', label: '아파트' },
]

export const DISTS = [
  { id: '500', label: '500m' },
  { id: '1000', label: '1km' },
  { id: '2000', label: '2km' },
]

export const SORTS = [
  { id: 'near', label: '가까운 순' },
  { id: 'cheap', label: '싼 순' },
  { id: 'new', label: '최근 계약 순' },
]

export const ROOM_MAX = 33 // 원룸: 전용(단독다가구는 계약) 면적 33㎡ 이하
export const JEONSE_RATE = 0.0457 // 2026년 9월 예금은행 전세자금대출 금리
export const WORKDAYS = (52 * 5) / 12 // 한 달 출근일 (주 5일 × 52주 ÷ 12 = 21.7일)
export const DEFAULT_STATION = '강남'

export const DEFAULTS = { k: 'wolse', t: 'room', d: '1000', st: '', o: 'near' }

export const SOURCES = {
  rent: { label: '국토교통부, 아파트·연립다세대·오피스텔·단독다가구 전월세 실거래가 자료 (공공데이터포털)', url: 'https://www.data.go.kr/data/15126474/openapi.do' },
  station: { label: '국가철도공단, 전국도시철도역사정보표준데이터 (공공데이터포털)', url: 'https://www.data.go.kr/data/15013205/standard.do' },
  rate: { label: '한국은행, 2026년 9월 예금은행 전세자금대출 금리 연 4.57% (신규취급액 기준, 파이낸셜뉴스 보도)', url: 'https://www.fnnews.com/news/202610291202476646' },
  route: { label: '카카오맵 도보·대중교통 경로 조회', url: 'https://developers.kakao.com/docs/ko/kakaomap/rest-api' },
}

const pickOf = (list, v, def) => (list.some((x) => x.id === v) ? v : def)

export function normalize(s = {}) {
  return {
    k: pickOf(KINDS, s.k, DEFAULTS.k),
    t: pickOf(TYPES, s.t, DEFAULTS.t),
    d: pickOf(DISTS, String(s.d), DEFAULTS.d),
    st: typeof s.st === 'string' ? s.st.slice(0, 40) : '',
    o: pickOf(SORTS, s.o, DEFAULTS.o),
  }
}

export function fromSearch(search) {
  const p = new URLSearchParams(search || '')
  return normalize({ k: p.get('k'), t: p.get('t'), d: p.get('d'), st: p.get('st') || '', o: p.get('o') })
}

export function toSearch(s) {
  const p = new URLSearchParams()
  for (const k of ['k', 't', 'd', 'o']) if (s[k] !== DEFAULTS[k]) p.set(k, s[k])
  if (s.st) p.set('st', s.st)
  const q = p.toString()
  return q ? `?${q}` : ''
}

// ---------- 역 목록 ----------
// stations.json: { regions, lines, sgg, stations: [[id, 이름, 노선 번호들, 위도, 경도, 지역, 주변 시군구 번호들]] }
export function readStations(json) {
  const sgg = json.sgg || []
  const lines = json.lines || []
  const stations = (json.stations || []).map(([id, name, ln, lat, lng, region, near]) => ({
    id,
    name,
    lines: ln.map((i) => lines[i]).filter(Boolean),
    lat,
    lng,
    region,
    near: near.map((i) => sgg[i]).filter((g) => g && g.have !== false),
  }))
  return { ...json, stations }
}

export function stationOf(data, id) {
  if (!data) return null
  return data.stations.find((s) => s.id === id) || data.stations.find((s) => s.name === DEFAULT_STATION) || data.stations[0] || null
}

export const linesOf = (data, region) => (data ? [...new Set(data.stations.filter((s) => s.region === region).flatMap((s) => s.lines))] : [])
export const stationsOn = (data, region, line) => (data ? data.stations.filter((s) => s.region === region && s.lines.includes(line)) : [])

// ---------- 계약 ----------
// 시군구 파일: { code, full, name, homes: [[종류, 이름, 동, 지번, 준공, [[면적, 보증금(만원), 월세(만원), 'YYYYMMDD', 갱신, 층], …]]] }
export function readHomes(file) {
  return (file.homes || []).map(([kind, name, dong, jibun, built, deals], i) => ({
    key: `${file.code}-${i}`,
    kind,
    name,
    dong,
    jibun,
    built,
    full: file.full,
    sggName: file.name,
    deals: deals.map(([area, deposit, monthly, date, renew, floor]) => ({ area, deposit, monthly, date, renew: !!renew, floor })),
  }))
}

const KIND_LABEL = { apt: '아파트', villa: '빌라', offi: '오피스텔', house: '단독·다가구' }

// 고른 조건에 맞는 계약만 남긴 집. 맞는 계약이 없으면 null
export function fitHome(home, state) {
  const room = state.t === 'room'
  if (room ? home.kind === 'apt' : home.kind !== state.t) return null
  const deals = home.deals.filter((d) => (state.k === 'jeonse' ? d.monthly === 0 && d.deposit > 0 : d.monthly > 0) && (!room || d.area <= ROOM_MAX))
  if (!deals.length) return null
  // 대표 계약: 가장 최근 신규 계약 (없으면 가장 최근 계약)
  const rep = deals.find((d) => !d.renew) || deals[0]
  const prices = deals.map((d) => (state.k === 'jeonse' ? d.deposit : d.monthly))
  return {
    ...home,
    deals,
    rep,
    kindLabel: KIND_LABEL[home.kind] || '',
    title: home.name || `${home.dong} ${KIND_LABEL[home.kind] || ''}`.trim(),
    approx: home.kind === 'house' || !home.jibun, // 지번이 없으면 동 중심에 찍는다
    low: Math.min(...prices),
    high: Math.max(...prices),
  }
}

// 한 달 집값: 월세 + 보증금을 전세대출 금리로 빌렸다고 칠 때의 이자 (원)
export const monthlyCost = (d) => Math.round(d.monthly * 10000 + (d.deposit * 10000 * JEONSE_RATE) / 12)

// 존버 계산기로: 한 달 집값을 생활비의 집 항목으로 넣는다
export const surviveLink = (d) => `/survive/?s=pick&r=${Math.round(monthlyCost(d) / 1000) * 1000}`

export function median(list) {
  if (!list.length) return 0
  const a = [...list].sort((x, y) => x - y)
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2)
}

// 결과 요약: 대표 계약들의 중간값, 역 500m 안과 밖 비교 (양쪽 모두 3곳 이상일 때)
export function summarize(list, state) {
  const price = (h) => (state.k === 'jeonse' ? h.rep.deposit : h.rep.monthly)
  const cost = (h) => monthlyCost(h.rep)
  const out = {
    count: list.length,
    price: median(list.map(price)),
    deposit: median(list.map((h) => h.rep.deposit)),
    cost: median(list.map(cost)),
  }
  if (Number(state.d) > 500) {
    const inner = list.filter((h) => h.dist <= 500)
    const outer = list.filter((h) => h.dist > 500)
    if (inner.length >= 3 && outer.length >= 3) out.near = { inner: median(inner.map(cost)), outer: median(outer.map(cost)), n: [inner.length, outer.length] }
  }
  return out
}

export function sortHomes(list, sort, state) {
  const price = (h) => (state.k === 'jeonse' ? h.rep.deposit : monthlyCost(h.rep))
  const by = {
    near: (a, b) => a.dist - b.dist,
    cheap: (a, b) => price(a) - price(b) || a.dist - b.dist,
    new: (a, b) => b.rep.date.localeCompare(a.rep.date) || a.dist - b.dist,
  }[sort]
  return [...list].sort(by)
}

// ---------- 거리 ----------
const RAD = Math.PI / 180
export function meters(a, b) {
  const x = (b.lng - a.lng) * RAD * Math.cos(((a.lat + b.lat) / 2) * RAD)
  const y = (b.lat - a.lat) * RAD
  return Math.sqrt(x * x + y * y) * 6371000
}

// ---------- 글자 ----------
// 만 원 → "1억 2,000만", "75만"
export function man(v) {
  const n = Math.round(v)
  if (n >= 10000) {
    const eok = Math.floor(n / 10000)
    const rest = n % 10000
    return rest ? `${eok}억 ${rest.toLocaleString('ko-KR')}만` : `${eok}억`
  }
  return `${n.toLocaleString('ko-KR')}만`
}

// 원 → "85만 원", "3만 2천 원"
export function won(v) {
  const n = Math.round(v / 1000) * 1000
  if (n >= 10000) {
    const m = Math.floor(n / 10000)
    const k = (n % 10000) / 1000
    return k ? `${m.toLocaleString('ko-KR')}만 ${k}천 원` : `${m.toLocaleString('ko-KR')}만 원`
  }
  return `${n.toLocaleString('ko-KR')}원`
}

export const distText = (m) => (m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`)
export const minText = (sec) => {
  const m = Math.max(1, Math.round(sec / 60))
  return m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}`
}
export const hourText = (min) => (min < 60 ? `${Math.round(min)}분` : `${Math.round(min / 6) / 10}시간`)
export const dateText = (ymd) => `${ymd.slice(0, 4)}.${ymd.slice(4, 6)}.${ymd.slice(6, 8)}`
export const areaText = (a) => `${a}㎡(${Math.round(a / 3.3058)}평)`

// 한 달 출퇴근 시간 (분): 편도 × 2 × 출근일
export const monthMinutes = (sec) => (sec / 60) * 2 * WORKDAYS

// 질문과 답은 commute/index.html 의 FAQ 구조화 데이터와 같게 유지한다
export const FAQ = [
  {
    q: '카드에 나오는 집은 지금 나와 있는 매물인가요?',
    a: '아니에요. 국토교통부에 신고된 전월세 실거래 계약이에요. 이미 계약이 끝난 집이라 지금 들어갈 수 있는지는 알 수 없고, 그 동네에서 비슷한 집이 얼마에 계약되는지 보는 참고 자료예요.',
  },
  {
    q: '원룸은 어떻게 골랐나요?',
    a: "국토교통부 자료에는 원룸 구분이 없어서, 연립·다세대(빌라), 오피스텔, 단독·다가구 계약 가운데 면적이 33㎡(약 10평) 이하인 계약을 원룸으로 봤어요. 단독·다가구는 번지가 공개되지 않아 지도에 동 중심으로 찍혀요.",
  },
  {
    q: '한 달 집값은 어떻게 계산하나요?',
    a: '월세에 보증금 이자를 더했어요. 보증금은 전세대출로 빌렸다고 치고 2026년 9월 예금은행 전세자금대출 금리 연 4.57%로 한 달 이자를 셌어요. 전세는 보증금 이자만, 월세는 월세와 보증금 이자를 합친 금액이에요. 관리비와 공과금은 들어 있지 않아요.',
  },
  {
    q: '역까지 거리와 출퇴근 시간은 어떻게 구하나요?',
    a: '카드의 거리는 집과 역 사이의 직선 거리예요. 카드를 누르면 카카오맵 경로 조회로 걸어서 가는 길과 대중교통 길을 받아 지도에 그리고, 편도 시간에 2를 곱하고 한 달 출근일 21.7일(주 5일 × 52주 ÷ 12)을 곱해 한 달 출퇴근 시간을 보여 드려요.',
  },
  {
    q: '집 위치는 정확한가요?',
    a: '신고된 동과 번지를 카카오맵에서 그때그때 찾아 찍어요. 번지가 없거나 찾지 못한 집은 동 중심에 찍고 카드에 표시해 둬요. 위치 결과는 저장하지 않아요.',
  },
]
