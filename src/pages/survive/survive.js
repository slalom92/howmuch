// 월급 버티기 계산기: 연봉과 생활 방식을 고르면 "월급 한 번으로 며칠 버티는지" 보여 준다
//
// - 사용자는 숫자를 직접 쓰지 않고 연봉(대표 값)과 생활 방식만 고른다.
// - 월급은 실수령액 ÷ 12. 생활비는 국가데이터처 '2025 통계로 보는 1인가구'의 2024년 1인 가구 월평균 소비지출(168만 9천 원, 12개 비목).
// - 하루 생활비 = 한 달 생활비 ÷ 30.42일(365 ÷ 12). 버티는 날 = 월급 ÷ 하루 생활비 (소수점 아래 버림).
import { SALARIES, PAY_SOURCES } from '../../lib/salary.js'

export { SALARIES }

export const DAYS_PER_MONTH = 365 / 12
export const PAYDAY = 25 // 달력에 쓰는 월급날

export const DEFAULTS = { pay: '4500', s: 'avg' }

export const SOURCES = {
  ...PAY_SOURCES,
  oneperson: { label: '국가데이터처, 2025 통계로 보는 1인가구 (2024년 1인 가구 월평균 소비지출 비목별)', url: 'https://mods.go.kr/board.es?act=view&bid=10820&list_no=442130&mid=a10301010000' },
  rent: { label: '머니투데이, 다방여지도 2026년 6월 서울 원룸 평균 월세 (보증금 1,000만 원 기준)', url: 'https://www.mt.co.kr/estate/2026/07/28/2026072808575932587' },
  minliving: { label: '인천광역시, 2026년 1인 가구 생계급여 지급기준 820,556원 (기준 중위소득 32%)', url: 'https://www.incheon.go.kr/welfare/WE010101' },
  minliving27: { label: '뉴시스, 2027년 기준 중위소득과 급여별 선정기준 (중앙생활보장위원회 의결)', url: 'https://www.newsis.com/view/NISX20260728_0003726406' },
}

// 2024년 1인 가구 월평균 소비지출 (원). 이름은 알아보기 쉽게, stat 은 통계표의 비목 이름.
// group: 집 / 먹기 / 생활 (월급 봉투 막대의 세 칸)
export const CATEGORIES = [
  { id: 'housing', name: '집', stat: '주거·수도·광열', hint: '월세, 관리비, 전기·가스·수도', amount: 311000, group: 'home' },
  { id: 'dining', name: '외식·배달', stat: '음식·숙박', hint: '식당, 배달, 카페, 숙박', amount: 307000, group: 'food' },
  { id: 'grocery', name: '장보기', stat: '식료품·비주류음료', hint: '집에서 먹는 음식과 음료', amount: 230000, group: 'food' },
  { id: 'transport', name: '교통', stat: '교통·운송', hint: '대중교통, 기름값, 차', amount: 180000, group: 'life' },
  { id: 'etc', name: '미용·보험 등', stat: '기타 상품·서비스', hint: '미용, 보험, 경조사 물품 등', amount: 129000, group: 'life' },
  { id: 'health', name: '병원·약', stat: '보건', hint: '진료비, 약값, 안경', amount: 122000, group: 'life' },
  { id: 'culture', name: '취미·문화', stat: '오락·문화', hint: '공연, 여행, 운동, 반려동물', amount: 106000, group: 'life' },
  { id: 'telecom', name: '휴대폰·인터넷', stat: '정보통신', hint: '통신 요금, 기기', amount: 100000, group: 'life' },
  { id: 'clothes', name: '옷·신발', stat: '의류·신발', hint: '', amount: 80000, group: 'life' },
  { id: 'household', name: '생활용품', stat: '가정용품·가사서비스', hint: '가구, 세제, 청소', amount: 66000, group: 'life' },
  { id: 'drink', name: '술·담배', stat: '주류·담배', hint: '', amount: 35000, group: 'food' },
  { id: 'edu', name: '교육', stat: '교육', hint: '학원, 강의', amount: 24000, group: 'life' },
]

export const AVG_TOTAL = 1689000 // 통계표의 합계 (비목을 더하면 반올림 때문에 1,690,000)
export const SEOUL_RENT = 640000
export const MIN_LIVING = 820556 // 2026년 1인 가구 생계급여 지급기준 = 최저보장수준
export const MIN_LIVING_2027 = 875533

export const GROUPS = [
  { id: 'home', name: '집' },
  { id: 'food', name: '먹고 마시기' },
  { id: 'life', name: '그 밖의 생활' },
]

export const STYLES = [
  { id: 'avg', label: '1인 가구 평균', note: '월 169만' },
  { id: 'seoul', label: '서울 원룸 자취', note: '월세 64만' },
  { id: 'min', label: '최소 생활', note: '월 82만' },
]

export const STYLE_TEXT = {
  avg: '1인 가구 평균처럼 쓰면',
  seoul: '서울 원룸에 월세로 살면',
  min: '최소 생활비로만 살면',
}

// 생활 방식별 한 달 지출 (비목별)
export function spendingOf(style) {
  if (style === 'seoul') {
    return CATEGORIES.map((c) =>
      c.id === 'housing' ? { ...c, name: '월세', stat: '서울 원룸 평균 월세', hint: '관리비·공과금 빼고', amount: SEOUL_RENT } : c,
    )
  }
  if (style === 'min') {
    // 최저보장수준은 합계만 있어서, 1인 가구 평균 비중대로 나눈다
    const sum = CATEGORIES.reduce((a, c) => a + c.amount, 0)
    return CATEGORIES.map((c) => ({ ...c, amount: Math.round((MIN_LIVING * c.amount) / sum) }))
  }
  return CATEGORIES
}

export const totalOf = (style) => (style === 'avg' ? AVG_TOTAL : style === 'min' ? MIN_LIVING : spendingOf(style).reduce((a, c) => a + c.amount, 0))

export const salaryOf = (id) => SALARIES.find((s) => s.id === id) || SALARIES.find((s) => s.id === DEFAULTS.pay)

export function normalize(st) {
  return {
    pay: SALARIES.some((x) => x.id === st.pay) ? st.pay : DEFAULTS.pay,
    s: STYLES.some((x) => x.id === st.s) ? st.s : DEFAULTS.s,
  }
}

export function fromSearch(search) {
  const p = new URLSearchParams(search || '')
  return normalize({ pay: p.get('pay'), s: p.get('s') })
}

export function toSearch(st) {
  const p = new URLSearchParams()
  if (st.pay !== DEFAULTS.pay) p.set('pay', st.pay)
  if (st.s !== DEFAULTS.s) p.set('s', st.s)
  const q = p.toString()
  return q ? `?${q}` : ''
}

// 월급 하나와 생활 방식 하나 → 버티는 날, 남는 돈
export function lastOf(monthly, style) {
  const spend = totalOf(style)
  const daily = spend / DAYS_PER_MONTH
  return { spend, daily, days: Math.floor(monthly / daily), left: monthly - spend }
}

export function calculate(state) {
  const st = normalize(state)
  const salary = salaryOf(st.pay)
  const monthly = salary.net / 12
  const items = spendingOf(st.s).map((c) => ({ ...c, share: c.amount / monthly, daily: c.amount / DAYS_PER_MONTH }))
  const { spend, daily, days, left } = lastOf(monthly, st.s)
  const groups = GROUPS.map((g) => {
    const amount = items.filter((c) => c.group === g.id).reduce((a, c) => a + c.amount, 0)
    return { ...g, amount, share: amount / monthly }
  })
  return {
    state: st,
    salary,
    monthly,
    spend,
    daily,
    days,
    left,
    items,
    groups,
    styles: STYLES.map((x) => ({ ...x, ...lastOf(monthly, x.id) })),
    ladder: SALARIES.map((x) => ({ ...x, monthly: x.net / 12, ...lastOf(x.net / 12, st.s) })),
  }
}

// 날 수 → "58일", "1달 28일" (한 달 = 30일로 끊어 읽기 쉽게)
export function daysText(days) {
  return `${days.toLocaleString('ko-KR')}일`
}

export function monthsText(days) {
  if (days < 30) return `${days}일`
  const m = Math.floor(days / 30)
  const d = days % 30
  return d ? `${m}달 ${d}일` : `${m}달`
}

// 원 → "5만 5,523원", "169만 원", "3,800원"
export function won(v) {
  const n = Math.round(v)
  const sign = n < 0 ? '-' : ''
  const a = Math.abs(n)
  if (a < 100000) return `${sign}${a.toLocaleString('ko-KR')}원`
  if (a >= 1000000) return `${sign}${Math.round(a / 10000).toLocaleString('ko-KR')}만 원`
  const man = Math.floor(a / 10000)
  const rest = a % 10000
  return rest ? `${sign}${man}만 ${rest.toLocaleString('ko-KR')}원` : `${sign}${man}만 원`
}

export const pct = (v) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`

// 오늘 기준으로 가장 최근 월급날(25일) → 버틴 마지막 날. 화면에서만 쓴다 (미리 그린 HTML 에는 날짜를 넣지 않는다)
export function lastDayFrom(today, days) {
  const y = today.getFullYear()
  const m = today.getMonth()
  const pay = today.getDate() >= PAYDAY ? new Date(y, m, PAYDAY) : new Date(y, m - 1, PAYDAY)
  const end = new Date(pay)
  end.setDate(end.getDate() + days - 1)
  return { pay, end }
}

export const dateText = (d, withYear) => `${withYear ? `${d.getFullYear()}년 ` : ''}${d.getMonth() + 1}월 ${d.getDate()}일`

// 질문과 답은 survive/index.html 의 FAQ 구조화 데이터와 같게 유지한다
export const FAQ = [
  {
    q: '버티는 날은 어떻게 계산했나요?',
    a: '고른 연봉의 실수령액을 12로 나눠 한 달 월급을 구하고, 한 달 생활비를 30.42일(365일 ÷ 12)로 나눈 하루 생활비로 월급을 나눴어요. 소수점 아래는 버렸어요. 월급이 생활비보다 많으면 30일을 넘겨 다음 달까지 버틸 수 있다는 뜻이에요.',
  },
  {
    q: '1인 가구 평균 생활비는 어디서 왔나요?',
    a: "국가데이터처가 2025년 12월 발표한 '2025 통계로 보는 1인가구'에 실린 2024년 1인 가구 월평균 소비지출 168만 9천 원과 12개 비목별 금액이에요. 세금, 4대보험, 대출 이자처럼 소비가 아닌 지출은 들어 있지 않고, 70세 이상 1인 가구도 함께 평균을 낸 값이에요.",
  },
  {
    q: '서울 원룸 자취는 무엇이 다른가요?',
    a: '1인 가구 평균의 집 항목(주거·수도·광열 31만 1천 원) 대신 다방이 국토교통부 실거래가로 낸 2026년 6월 서울 원룸 평균 월세 64만 원(보증금 1,000만 원 기준)을 넣었어요. 관리비와 전기·가스 요금은 들어 있지 않아서 실제로는 조금 더 들 수 있어요.',
  },
  {
    q: '최소 생활은 무엇을 기준으로 했나요?',
    a: '2026년 1인 가구 생계급여 지급기준 820,556원이에요. 기준 중위소득의 32%로, 나라가 보장하는 최저 생활 수준이에요. 비목별 금액은 1인 가구 평균 비중대로 나눈 값이에요. 2027년 1월부터는 875,533원으로 올라요.',
  },
  {
    q: '달력의 날짜는 무엇인가요?',
    a: '월급날을 매달 25일로 잡고, 오늘에서 가장 가까운 지난 25일에 월급을 받았다고 할 때 그 월급으로 며칠까지 버티는지 보여 드려요. 회사마다 월급날이 다르니 날 수를 기준으로 보세요.',
  },
]
