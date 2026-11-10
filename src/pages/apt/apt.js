// 연봉 모아 집 사기: 고르는 값과 계산
// 아파트 자료: apt-data.json(시도 목록) + public/data/apt/<시도코드>.json(시도별 단지). 만드는 법은 scripts/build-apt.mjs
//
// - 사용자는 숫자를 직접 쓰지 않고 연봉·기간·면적·지역(시도, 시군구)을 고른다 (콘텐츠 입력은 대표 값 고르기만).
// - "한 푼도 안 쓰고 모으면": 1년 모으는 돈 = 실수령 연봉(기본) 또는 세전 연봉. 이자, 집값 변동, 대출, 취득세는 넣지 않는다.
import DATA from './apt-data.json'
import { SALARIES, PAY_SOURCES } from '../../lib/salary.js'

export { DATA }

export const SOURCES = {
  molit: { label: '공공데이터포털, 국토교통부_아파트 매매 실거래가 상세 자료', url: 'https://www.data.go.kr/data/15126468/openapi.do' },
  kakao: { label: '카카오맵 (단지 위치)', url: 'https://map.kakao.com/' },
  ...PAY_SOURCES,
  worker: { label: '국가데이터처, 2024년 임금근로일자리 소득 (월평균 375만 원)', url: 'https://kostat.go.kr/' },
}

// 세전 연봉과 2026년 연 실수령액 (존버 계산기와 같이 쓴다: src/lib/salary.js)
export { SALARIES }

export const YEARS = [5, 10, 20, 30]

export const AREAS = [
  { id: '84', label: '84㎡', note: '흔히 34평' },
  { id: '59', label: '59㎡', note: '흔히 24·25평' },
]

export const BASES = [
  { id: 'net', label: '실수령' },
  { id: 'gross', label: '세전 연봉' },
]

export const DEFAULTS = { pay: '4500', y: 20, a: '84', sido: '11', sgg: 'all', b: 'net' }

// 시도 고르기: apt-data.json(목록)에 있는 시도만. 처음에는 서울(11), 없으면 첫 시도
export const SIDO = DATA.sido || []
const DEFAULT_SIDO = SIDO.some((s) => s.code === '11') ? '11' : SIDO[0]?.code || '11'
DEFAULTS.sido = DEFAULT_SIDO
export const sidoOf = (code) => SIDO.find((s) => s.code === code) || null

// 시도 파일(public/data/apt/<코드>.json)의 한 줄 → 객체
// [이름, 시군구 번호, 동, 준공연도, 84 가격(만원, 최근 가중 중간값), 84 건수, 84 최근월, 59 가격, 59 건수, 59 최근월, 지번]
const parsed = new WeakMap()
export function aptsOf(file) {
  if (!file) return []
  if (parsed.has(file)) return parsed.get(file)
  const list = file.apts.map(([name, sgg, dong, built, p84, n84, l84, p59, n59, l59, jibun], i) => ({
    id: i,
    name,
    sgg: file.sgg[sgg]?.code,
    sggName: file.sgg[sgg]?.name || '',
    full: file.sgg[sgg]?.full || '',
    dong,
    jibun: jibun || '',
    built: built || null,
    84: p84 ? { price: p84 * 10000, n: n84, last: l84 } : null,
    59: p59 ? { price: p59 * 10000, n: n59, last: l59 } : null,
  }))
  parsed.set(file, list)
  return list
}

// 시도 파일 불러오기 (한 번 불러온 것은 다시 받지 않는다)
const files = new Map()
export function loadSido(code) {
  if (!files.has(code)) {
    files.set(
      code,
      fetch(`/data/apt/${code}.json`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      }).catch((e) => {
        files.delete(code)
        throw e
      }),
    )
  }
  return files.get(code)
}

export const salaryOf = (id) => SALARIES.find((s) => s.id === id) || SALARIES.find((s) => s.id === DEFAULTS.pay)

export function normalize(s) {
  const sido = sidoOf(s.sido) ? s.sido : DEFAULTS.sido
  const sggs = sidoOf(sido)?.sgg || []
  return {
    pay: SALARIES.some((x) => x.id === s.pay) ? s.pay : DEFAULTS.pay,
    y: YEARS.includes(Number(s.y)) ? Number(s.y) : DEFAULTS.y,
    a: AREAS.some((x) => x.id === s.a) ? s.a : DEFAULTS.a,
    sido,
    sgg: sggs.some((g) => g.code === s.sgg) ? s.sgg : 'all',
    b: BASES.some((x) => x.id === s.b) ? s.b : DEFAULTS.b,
  }
}

export const fromSearch = (search) => {
  const q = new URLSearchParams(search)
  return normalize({ pay: q.get('pay'), y: q.get('y'), a: q.get('a'), sido: q.get('sido'), sgg: q.get('sgg') || 'all', b: q.get('b') })
}

export const toSearch = (s) => {
  const q = new URLSearchParams()
  for (const k of ['pay', 'y', 'a', 'sido', 'sgg', 'b']) if (String(s[k]) !== String(k === 'sgg' ? 'all' : DEFAULTS[k])) q.set(k, s[k])
  return q.toString()
}

// 지역 이름: "서울", "서울 강남구"
export function placeName(state) {
  const sd = sidoOf(state.sido)
  if (!sd) return ''
  const g = state.sgg !== 'all' && sd.sgg.find((x) => x.code === state.sgg)
  return g ? `${sd.short} ${g.name}` : sd.short
}

// 모은 돈 (자료 없이도 계산된다)
export function budgetOf(state) {
  const s = normalize(state)
  const salary = salaryOf(s.pay)
  const yearly = s.b === 'net' ? salary.net : salary.gross
  return { state: s, salary, yearly, budget: yearly * s.y }
}

// 고른 조건으로 살 수 있는 단지 (고가 순) + 요약. file 은 고른 시도 파일 (아직 없으면 null)
export function calculate(state, file) {
  const base = budgetOf(state)
  const { state: s, yearly, budget } = base
  const pool = file && file.code === s.sido ? aptsOf(file).filter((a) => a[s.a] && (s.sgg === 'all' || a.sgg === s.sgg)) : []
  const yearsFor = (a) => a[s.a].price / yearly
  const fits = pool.filter((a) => a[s.a].price <= budget).sort((x, y) => y[s.a].price - x[s.a].price)
  const cheapest = pool.reduce((m, a) => (!m || a[s.a].price < m[s.a].price ? a : m), null)
  const ladder = [5, 10, 15, 20, 30, 40].map((n) => ({ years: n, count: pool.filter((a) => a[s.a].price <= yearly * n).length }))
  return { ...base, ready: Boolean(file && file.code === s.sido), place: placeName(s), pool, fits, cheapest, ladder, yearsFor }
}

// ---------- 내 주변 먼저 ----------
// 두 점 사이 거리(km)
export function km([lat1, lng1], [lat2, lng2]) {
  const r = (d) => (d * Math.PI) / 180
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

// 내 위치에서 가까운 시군구부터, 같은 시군구 안에서는 고가 순. centers: { 시군구코드: [위도, 경도] } (화면에서 그때그때 찾은 값)
export function sortNear(list, here, centers, area) {
  const d = {}
  for (const [code, c] of Object.entries(centers)) d[code] = km(here, c)
  return [...list].sort((x, y) => (d[x.sgg] ?? 9999) - (d[y.sgg] ?? 9999) || y[area].price - x[area].price)
}

// 질문과 답은 apt/index.html 의 FAQ 구조화 데이터와 같게 유지한다 (scripts 로 만들어 붙인다)
export const FAQ = [
  {
    q: '아파트 가격은 어디서 가져왔나요?',
    a: '국토교통부가 공공데이터포털에 공개하는 아파트 매매 실거래가 자료를 받아, 단지마다 최근 1년 동안 같은 면적으로 거래된 값의 중간값을 냈어요. 최근 거래일수록 무게를 더 둬서, 3개월 전 거래는 이번 달 거래의 절반, 6개월 전 거래는 4분의 1만큼만 반영해요. 계약이 해제된 거래와 직거래는 뺐어요. 실제 매물 호가와는 다를 수 있어요.',
  },
  {
    q: '84㎡, 59㎡는 몇 평인가요?',
    a: '전용면적이에요. 전용 84㎡는 흔히 34평(국민평형), 59㎡는 24·25평이라고 불러요. 계산에는 전용 83~86㎡, 58~61㎡ 거래를 각각 넣었어요.',
  },
  {
    q: '실수령과 세전 연봉은 무엇이 다른가요?',
    a: '세전 연봉에서 4대보험과 소득세를 뺀 돈이 실수령액이에요. 2026년 연봉 실수령액표(본인 1명, 비과세 식대 월 20만 원 기준)를 썼고, 1억이 넘는 연봉은 같은 기준에 국세청 간이세액표를 적용해 계산했어요. 한 푼도 안 쓰고 모은다면 실제로 쌓이는 돈은 실수령액이라서 기본으로 실수령을 골라 두었어요.',
  },
  {
    q: '이자나 집값 오르는 것도 넣었나요?',
    a: '아니요. 모으는 동안의 이자, 앞으로의 집값 변동, 대출, 취득세와 중개 수수료는 넣지 않았어요. 지금 연봉과 지금 집값으로만 본 단순 계산이에요.',
  },
  {
    q: '내 주변 먼저는 어떻게 정하나요?',
    a: '버튼을 누르면 브라우저가 위치 권한을 물어요. 허용하면 카카오맵으로 내가 있는 시도와 시군구를 확인하고, 그 시도의 시군구를 내 위치에서 가까운 순서로 늘어놓아요. 같은 시군구 안에서는 고가 순이에요. 위치는 지역을 찾는 데만 쓰고 돈미터 서버로 보내거나 저장하지 않아요.',
  },
  {
    q: '지도 위치는 정확한가요?',
    a: '단지를 누르는 순간 카카오맵에서 지번 주소로 위치를 찾아 보여 드려요. 주소로 찾지 못하면 단지 이름으로 찾고, 그래도 없으면 동 중심을 보여 드려요. 찾은 위치는 저장하지 않아요.',
  },
  {
    q: '찾는 아파트가 없어요.',
    a: '최근 1년 동안 고른 면적으로 거래가 한 번도 없었던 단지는 가격을 낼 수 없어서 빠져요. 거래가 1~2건뿐인 단지는 거래 적음으로 표시했어요.',
  },
]
