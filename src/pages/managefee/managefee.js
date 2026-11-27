// 관리비 계산기 (/manage-fee/): 집 형태·크기·지역·이번 달 관리비를 고르면 같은 조건 평균과 비교하고,
// 1년·10년 누적, 연 8%로 굴렸다면 얼마였는지, 줄이면 얼마가 남는지 보여 준다.
// 입력은 모두 대표값 칩이다 (정확한 금액을 받지 않는다).
import { CHICKEN, carFor, SOURCES as SUB_SOURCES } from '../subscription/subscription.js'

export const AS_OF = '2026년 11월 27일'
export { CHICKEN }

export const SOURCES = {
  kapt: {
    label: '한국아파트신문, K-apt 2025년 9월~2026년 9월 아파트 평균 관리비 ㎡당 2,957원과 시도별 값 (한국부동산원 자료, 2026년 10월 28일)',
    url: 'https://www.hapt.co.kr/news/articleView.html?idxno=169820',
  },
  winter: {
    label: '한국경제, K-apt 2026년 1월 전국 아파트 관리비 ㎡당 3,343원 (2026년 3월 4일)',
    url: 'https://www.hankyung.com/article/202603048067i',
  },
  oneroom: {
    label: '경향신문, 다방 2026년 7월 서울 10개 대학가 원룸(전용 33㎡ 이하) 평균 관리비 8만 4,000원 (2026년 8월 11일)',
    url: 'https://www.khan.co.kr/article/202608111728001',
  },
  officetel: {
    label: '미주중앙일보, 다방 2026년 8월 19일 기준 서울 대학가 오피스텔 평균 관리비 약 11만 4,000원 (2026년 8월 24일)',
    url: 'https://www.koreadaily.com/article/20260824130043596',
  },
  chicken: SUB_SOURCES.chicken,
}

// 집 형태
export const TYPES = [
  { id: 'apt', label: '아파트' },
  { id: 'officetel', label: '오피스텔' },
  { id: 'oneroom', label: '원룸·빌라' },
]

// 아파트 지역: K-apt ㎡당(전용면적) 1년 평균. 기사에 값이 없는 시도는 '전국 평균'으로 비교한다
export const REGIONS = [
  { id: 'all', label: '전국 평균', perM2: 2957 },
  { id: 'seoul', label: '서울', perM2: 3411 },
  { id: 'gyeonggi', label: '경기', perM2: 3451 },
  { id: 'incheon', label: '인천', perM2: 3129 },
  { id: 'sejong', label: '세종', perM2: 3768 },
  { id: 'daejeon', label: '대전', perM2: 2957 },
  { id: 'chungbuk', label: '충북', perM2: 2886 },
  { id: 'chungnam', label: '충남', perM2: 2825 },
  { id: 'daegu', label: '대구', perM2: 2652 },
  { id: 'gangwon', label: '강원', perM2: 2636 },
  { id: 'gyeongnam', label: '경남', perM2: 2301 },
]

// 아파트 크기: 전용면적. 평형(공급면적)은 전용의 약 1.33배로 어림
export const AREAS = [39, 49, 59, 74, 84, 101, 114, 135].map((m2) => ({
  id: String(m2),
  m2,
  label: `${m2}㎡`,
  note: `약 ${Math.round((m2 / 0.75) / 3.3058)}평형`,
}))

// 계절: 1년 평균과 1월(난방) 고지서. 1월 가중치 = 2026년 1월 전국 3,343원 ÷ 1년 평균 2,957원
export const NATION_YEAR = 2957
export const NATION_JAN = 3343
export const SEASONS = [
  { id: 'avg', label: '보통 달', note: '1년 평균', w: 1 },
  { id: 'winter', label: '겨울', note: '1월 고지서', w: NATION_JAN / NATION_YEAR },
]

// 오피스텔·원룸은 지역·크기 구분 자료가 없어 서울 대학가 소형 평균 하나로 비교한다
export const SMALL_AVG = { officetel: 114000, oneroom: 84000 }

const FEES_APT = [100000, 150000, 200000, 250000, 300000, 350000, 400000, 500000, 600000, 800000]
const FEES_SMALL = [50000, 70000, 100000, 120000, 150000, 200000, 250000, 300000]
export const feeOptions = (type) => (type === 'apt' ? FEES_APT : FEES_SMALL).map((v) => ({ id: String(v), v, label: `${v / 10000}만` }))
const DEFAULT_FEE = { apt: 250000, officetel: 150000, oneroom: 100000 }

// 줄이면? (만 원)
export const CUTS = [10000, 30000, 50000, 100000].map((v) => ({ id: String(v), v, label: `${v / 10000}만 원` }))

export const GROWTH = 0.03 // 관리비 상승률 가정 (연)
export const RETURN = 0.08 // 투자 수익률 가정 (연, 월 복리)

export const DEFAULTS = { type: 'apt', area: '59', region: 'seoul', season: 'avg', fee: '250000', cut: '30000' }

const has = (list, id) => list.some((o) => o.id === id)
export function normalize(st) {
  const type = has(TYPES, st.type) ? st.type : DEFAULTS.type
  const fees = feeOptions(type)
  return {
    type,
    area: has(AREAS, st.area) ? st.area : DEFAULTS.area,
    region: has(REGIONS, st.region) ? st.region : DEFAULTS.region,
    season: has(SEASONS, st.season) ? st.season : DEFAULTS.season,
    fee: has(fees, st.fee) ? st.fee : String(DEFAULT_FEE[type]),
    cut: has(CUTS, st.cut) ? st.cut : DEFAULTS.cut,
  }
}

// 형태를 바꾸면 관리비 칩 목록이 바뀌므로 기본값으로
export const defaultFee = (type) => String(DEFAULT_FEE[type])

export function fromSearch(search) {
  const q = new URLSearchParams(search || '')
  const st = {}
  for (const k of Object.keys(DEFAULTS)) if (q.has(k)) st[k] = q.get(k)
  return normalize({ ...DEFAULTS, ...st })
}

export function toSearch(st) {
  const s = normalize(st)
  const q = new URLSearchParams()
  q.set('type', s.type)
  if (s.type === 'apt') {
    q.set('area', s.area)
    q.set('region', s.region)
    q.set('season', s.season)
  }
  q.set('fee', s.fee)
  q.set('cut', s.cut)
  return `?${q.toString()}`
}

// 등급: 평균 대비 초과율
export const GRADES = [
  { id: 'saver', max: -0.15, label: '관리비 방어 만렙', tone: 'good' },
  { id: 'normal', max: 0.1, label: '딱 평균', tone: 'mid' },
  { id: 'over', max: 0.3, label: '평균보다 조금 더', tone: 'warn' },
  { id: 'bomb', max: Infinity, label: '관리비 폭탄 경보', tone: 'bad' },
]

// n년 동안 낸 관리비 (매년 GROWTH 만큼 오른다고 가정)
export const cumulative = (monthly, years, g = GROWTH) => {
  let t = 0
  for (let y = 0; y < years; y++) t += monthly * 12 * Math.pow(1 + g, y)
  return t
}
// 매달 같은 돈을 연 r 로 (월 복리) years 년 굴렸을 때
export const futureValue = (monthly, years, r = RETURN) => {
  const i = r / 12
  return monthly * ((Math.pow(1 + i, years * 12) - 1) / i)
}

export function calculate(state) {
  const st = normalize(state)
  const type = TYPES.find((t) => t.id === st.type)
  const fee = Number(st.fee)
  const area = AREAS.find((a) => a.id === st.area)
  const region = REGIONS.find((r) => r.id === st.region)
  const season = SEASONS.find((s) => s.id === st.season)
  const apt = st.type === 'apt'
  const avg = apt ? Math.round((region.perM2 * area.m2 * season.w) / 100) * 100 : SMALL_AVG[st.type]
  const basis = apt ? `${region.label} 아파트 전용 ${area.m2}㎡ ${season.id === 'winter' ? '1월' : '평균'}` : st.type === 'officetel' ? '서울 대학가 오피스텔 평균' : '서울 대학가 원룸 평균'
  const diff = fee - avg
  const rate = diff / avg
  const grade = GRADES.find((g) => rate <= g.max)
  const cut = Number(st.cut)
  const y10 = cumulative(fee, 10)
  return {
    state: st,
    type,
    apt,
    area,
    region,
    season,
    fee,
    avg,
    basis,
    diff,
    rate,
    grade,
    yearly: fee * 12,
    y1: cumulative(fee, 1),
    y5: cumulative(fee, 5),
    y10,
    fv10: futureValue(fee, 10),
    extraYear: Math.max(0, diff) * 12,
    extra10: Math.max(0, diff) * 120,
    chicken: (fee * 12) / CHICKEN,
    car10: carFor(y10),
    perM2: apt ? Math.round(fee / area.m2) : null,
    cut,
    cut10: cut * 120,
    cutFv10: futureValue(cut, 10),
  }
}

export const won = (v) => `${Math.round(v).toLocaleString('ko-KR')}원`
export const signedPct = (v) => `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`

export const FAQ = [
  {
    q: '평균 관리비는 어디서 가져왔나요?',
    a: '아파트는 공동주택관리정보시스템(K-apt)에 공개된 2025년 9월부터 2026년 9월까지의 관리비를 한국부동산원이 집계한 값이에요. 전국 평균은 전용면적 1㎡당 2,957원이고, 서울은 3,411원, 경기는 3,451원이에요. 여기에 고른 전용면적을 곱했어요.',
  },
  {
    q: '겨울은 왜 더 비싸게 나오나요?',
    a: '난방비 때문이에요. K-apt 기준 2026년 1월 전국 아파트 관리비는 ㎡당 3,343원으로 1년 평균보다 약 13% 높았어요. 겨울을 고르면 고른 지역 평균에 이 비율을 곱해 비교해요.',
  },
  {
    q: '오피스텔과 원룸은 왜 지역과 크기를 고를 수 없나요?',
    a: '오피스텔과 원룸·빌라는 대부분 K-apt 공개 대상이 아니라서 지역·크기별 공식 평균이 없어요. 그래서 부동산 플랫폼 다방이 집계한 서울 대학가 전용 33㎡ 이하 매물 평균(원룸 8만 4,000원, 오피스텔 약 11만 4,000원)과 비교해요.',
  },
  {
    q: '평형은 어떻게 계산했나요?',
    a: '관리비 평균은 전용면적 기준이에요. 칩 옆의 평형은 공급면적이 전용면적의 약 1.33배라고 보고 어림한 값이라 실제 단지와 1~2평 다를 수 있어요.',
  },
  {
    q: '10년 누적과 투자 수익은 어떻게 계산했나요?',
    a: '누적액은 관리비가 매년 3%씩 오른다고 가정해 더했어요. 투자했다면은 매달 관리비만큼을 연 8%(월 복리)로 10년 동안 굴렸다고 가정한 값이에요. 실제 관리비 인상률과 투자 수익은 이와 다를 수 있어요.',
  },
  {
    q: '내 관리비를 정확히 넣을 수는 없나요?',
    a: '돈미터는 정확한 금액 대신 가까운 대표값을 칩으로 고르게 해요. 고지서 금액과 가장 가까운 칩을 고르면 충분히 비교할 수 있어요.',
  },
]
