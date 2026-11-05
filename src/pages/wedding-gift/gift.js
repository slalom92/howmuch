// 축의금 계산기: 데이터와 계산 (화면과 떼어 두어 테스트하기 쉽게 한다)
//
// 기준 자료 (2026년 11월 정리, 화면 아래 "출처"에도 같은 목록이 있다)
// - NH농협은행 축의금 이체 분석: 2025년 평균 11만 7천 원, 5만 원 비중 감소·10만 원 비중 증가
// - 신한은행 보통사람 금융생활 보고서: 참석 10만 원(67.4%), 불참 5만 원(52.8%), 호텔 예식 평균 12만 원
// - 인크루트(2025년 5월): 일로 엮인 동료 10만 원 60.1%, 5만 원 30.0%
// - 가연(2026년 8월): 친구 결혼식 참석 적정액 미혼 평균 13만 원, 기혼 평균 29만 원
// - 한국소비자원 참가격(2026년): 1인 식대 중간값 서울 약 8만 원, 경기·인천 6만 2천 원, 전국 6만 원,
//   서울 강남 평균 약 9만 원

export const NATIONAL_AVG = 117000 // 2025년 축의금 이체 평균 (NH농협은행)

// 봉투에 넣는 금액 단위 (4는 피하는 관습이 있어 40만 원은 건너뛴다)
export const STEPS = [30000, 50000, 100000, 150000, 200000, 300000, 500000, 700000, 1000000]

// 관계별 기준 금액: attend 직접 참석(1명), absent 봉투만, more 넉넉하게
export const RELATIONS = [
  { id: 'family', label: '가족·가까운 친척', attend: 300000, attendMore: 500000, absent: 200000, absentMore: 300000 },
  { id: 'bestie', label: '절친', attend: 200000, attendMore: 300000, absent: 100000, absentMore: 200000 },
  { id: 'friend', label: '친한 친구', attend: 100000, attendMore: 150000, absent: 50000, absentMore: 100000 },
  { id: 'classmate', label: '그냥 친구·동창', attend: 100000, attendMore: 100000, absent: 50000, absentMore: 50000 },
  { id: 'closeWork', label: '친한 직장 동료', attend: 100000, attendMore: 150000, absent: 50000, absentMore: 100000 },
  { id: 'work', label: '일로만 아는 동료', attend: 100000, attendMore: 100000, absent: 50000, absentMore: 50000 },
  { id: 'boss', label: '상사·거래처', attend: 100000, attendMore: 150000, absent: 50000, absentMore: 100000 },
  { id: 'distant', label: '얼굴만 아는 지인', attend: 50000, attendMore: 100000, absent: 30000, absentMore: 50000 },
]

// 웨딩홀 기준 1인 식대
export const REGIONS = [
  { id: 'gangnam', label: '서울 강남', meal: 90000 },
  { id: 'seoul', label: '서울 (강남 외)', meal: 80000 },
  { id: 'metro', label: '경기·인천', meal: 62000 },
  { id: 'local', label: '그 외 지역', meal: 50000 },
]

// 예식장 종류별 식대 배율
export const VENUES = [
  { id: 'hall', label: '웨딩홀', rate: 1 },
  { id: 'hotel', label: '호텔', rate: 1.6 },
  { id: 'small', label: '스몰웨딩·레스토랑', rate: 1.2 },
  { id: 'public', label: '공공·야외·교회', rate: 0.6 },
]

export const PARTY = [
  { id: 1, label: '혼자' },
  { id: 2, label: '2명' },
  { id: 3, label: '3명' },
  { id: 4, label: '4명 이상' },
]

// 내 결혼식 때 상대가 낸 금액 (0 = 없음·모름)
export const RECEIVED = [0, 50000, 100000, 150000, 200000, 300000, 500000]

export const DEFAULTS = { rel: 'friend', go: true, n: 1, venue: 'hall', region: 'seoul', got: 0 }

const byId = (list, id) => list.find((x) => String(x.id) === String(id))

// 금액 이상인 가장 가까운 봉투 단위
export function ceilStep(v) {
  return STEPS.find((s) => s >= v) ?? Math.ceil(v / 100000) * 100000
}

export function nextStep(v) {
  return STEPS.find((s) => s > v) ?? v + 500000
}

// 지폐 구성: 5만 원권 위주, 남는 금액은 1만 원권
export function bills(amount) {
  const big = Math.floor(amount / 50000)
  const small = Math.round((amount - big * 50000) / 10000)
  return { big, small }
}

export function normalize(input = {}) {
  const s = { ...DEFAULTS, ...input }
  if (!byId(RELATIONS, s.rel)) s.rel = DEFAULTS.rel
  if (!byId(VENUES, s.venue)) s.venue = DEFAULTS.venue
  if (!byId(REGIONS, s.region)) s.region = DEFAULTS.region
  s.n = Math.min(4, Math.max(1, parseInt(s.n, 10) || 1))
  s.go = s.go === true || s.go === '1' || s.go === 1
  s.got = RECEIVED.includes(Number(s.got)) ? Number(s.got) : 0
  return s
}

export function calculate(input) {
  const s = normalize(input)
  const rel = byId(RELATIONS, s.rel)
  const venue = byId(VENUES, s.venue)
  const region = byId(REGIONS, s.region)

  let amount = s.go ? rel.attend : rel.absent
  let more = s.go ? rel.attendMore : rel.absentMore
  const reasons = []

  let meal = null
  if (s.go) {
    const perHead = Math.round((region.meal * venue.rate) / 1000) * 1000
    const total = perHead * s.n
    meal = { perHead, total }
    // 식대의 90% 이상은 채운다 (딱 맞추면 금액이 너무 크게 뛰는 경우가 있어 조금 여유를 둔다)
    const floor = ceilStep(total * 0.9)
    if (floor > amount) {
      amount = floor
      reasons.push(s.n > 1 ? `${s.n}명 식대를 생각해 올렸어요` : '예식장 식대를 생각해 올렸어요')
    }
  }

  if (s.got > amount) {
    amount = ceilStep(s.got)
    reasons.push('내 결혼식 때 받은 만큼 맞췄어요')
  }

  if (more <= amount) more = nextStep(amount)

  let verdict
  if (meal) {
    const rate = amount / meal.total
    meal.rate = rate
    meal.balance = amount - meal.total
    if (rate >= 1.3) verdict = { key: 'great', title: '든든한 하객', text: '식대를 내고도 넉넉히 남아요. 신랑·신부가 오래 기억할 금액이에요.' }
    else if (rate >= 1) verdict = { key: 'ok', title: '식대 방어 성공', text: '밥값은 확실히 하고 축하까지 얹었어요.' }
    else if (rate >= 0.9) verdict = { key: 'tight', title: '아슬아슬 본전', text: '거의 식대만큼이에요. 넉넉한 금액도 한번 생각해 보세요.' }
    else verdict = { key: 'loss', title: '적자 하객 주의', text: '식대보다 적어요. 금액을 올리거나 봉투만 보내는 것도 방법이에요.' }
  } else {
    verdict = { key: 'absent', title: '봉투만 보낼 때 무난한 금액', text: '식사를 하지 않으니 참석할 때보다 가볍게 내는 경우가 많아요.' }
  }

  return {
    state: s,
    relation: rel,
    venue,
    region,
    amount,
    more,
    meal,
    reasons,
    verdict,
    bills: bills(amount),
    vsAvg: amount / NATIONAL_AVG,
  }
}

// 주소 ↔ 입력값
export function fromSearch(search) {
  const p = new URLSearchParams(search)
  const raw = {}
  for (const k of ['rel', 'n', 'venue', 'region', 'got']) if (p.has(k)) raw[k] = p.get(k)
  if (p.has('go')) raw.go = p.get('go') === '1'
  return normalize(raw)
}

export function toSearch(s) {
  const p = new URLSearchParams()
  p.set('rel', s.rel)
  p.set('go', s.go ? '1' : '0')
  if (s.go) {
    p.set('n', String(s.n))
    p.set('venue', s.venue)
    p.set('region', s.region)
  }
  if (s.got) p.set('got', String(s.got))
  return p.toString()
}
