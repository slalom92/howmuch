// 자차 계산기: 연봉과 차를 고르면 "내 연봉에 맞는 차인지", "3년 타면 얼마가 사라지는지"를 보여 준다
//
// - 사용자는 숫자를 직접 쓰지 않고 연봉(대표 값)과 차(목록)만 고른다.
// - 내 연봉에 맞는지: 흔히 권하는 "차값은 세전 연봉의 50% 이내" 기준 (src/lib/carSting.js 와 같은 기준)
// - 차값: 2023년 당시 신차 가격 / 지금 값: 엔카 2026년 10월 2023년식 시세 (src/pages/car/cars.js)
// - 몇 시간 일해야: 실수령 시급(한 달 실수령 ÷ 209시간) 기준
import { SALARIES, PAY_SOURCES } from '../../lib/salary.js'
import { HOURS_PER_MONTH } from '../../lib/sting.js'
import { CAR_RATIO } from '../../lib/carSting.js'
import { CARS, SRC, USED_AS_OF, depreciation } from './cars.js'

export { SALARIES, CARS, CAR_RATIO, USED_AS_OF }

export const DEFAULTS = { pay: '4500', car: 'grandeur' }

export const KINDS = [
  { id: 'kr', label: '국산차' },
  { id: 'im', label: '수입차' },
]

export const SOURCES = {
  ...PAY_SOURCES,
  ...SRC,
  ratio: { label: '겟차, 연봉별 자동차 추천 2026 (차량 가격은 연봉의 50% 이내 권장)', url: 'https://web.getcha.kr/blog/salary-based-car-recommendations-family-size-2026' },
}

export const salaryOf = (id) => SALARIES.find((s) => s.id === id) || SALARIES.find((s) => s.id === DEFAULTS.pay)
export const carOf = (id) => CARS.find((c) => c.id === id) || CARS.find((c) => c.id === DEFAULTS.car)

// 차 이름: "현대 그랜저" (차 이름에 회사가 이미 들어 있으면 그대로)
export const carName = (c) => (c.model.startsWith(c.maker) ? c.model : `${c.maker} ${c.model}`)

export function normalize(s) {
  return {
    pay: SALARIES.some((x) => x.id === s.pay) ? s.pay : DEFAULTS.pay,
    car: CARS.some((x) => x.id === s.car) ? s.car : DEFAULTS.car,
  }
}

export function fromSearch(search) {
  const p = new URLSearchParams(search || '')
  return normalize({ pay: p.get('pay'), car: p.get('car') })
}

export function toSearch(s) {
  const p = new URLSearchParams()
  if (s.pay !== DEFAULTS.pay) p.set('pay', s.pay)
  if (s.car !== DEFAULTS.car) p.set('car', s.car)
  const q = p.toString()
  return q ? `?${q}` : ''
}

const WON = 10000 // 데이터는 만 원 단위

export function calculate(state) {
  const s = normalize(state)
  const salary = salaryOf(s.pay)
  const car = carOf(s.car)
  const budget = salary.gross * CAR_RATIO // 연봉 절반 (원)
  const hourly = salary.net / 12 / HOURS_PER_MONTH // 실수령 시급
  const month = salary.net / 12 // 한 달 실수령
  const price = car.newPrice ? car.newPrice * WON : null // 2023년 신차 가격
  const used = car.used * WON // 지금 중고 시세
  // 판정은 신차 가격으로, 신차 가격을 모르는 차는 중고 시세로
  const judge = price ?? used
  const dep = depreciation(car)
  const lost = dep ? dep.lost * WON : null
  const ok = judge <= budget
  return {
    state: s,
    salary,
    car,
    budget,
    hourly,
    month,
    price,
    used,
    judge,
    judgeBy: price ? 'new' : 'used',
    ratio: judge / salary.gross, // 차값 = 연봉의 몇 %
    ok,
    needPay: judge / CAR_RATIO, // 연봉 절반이 되려면 필요한 연봉
    gap: judge / CAR_RATIO - salary.gross, // 그만큼 더 벌어야 (음수면 여유)
    lost, // 3년 남짓 타면 사라진 돈
    keep: dep ? dep.keep : null,
    lostHours: lost ? lost / hourly : null,
    lostMonths: lost ? lost / month : null,
    priceHours: price ? price / hourly : null,
    usedHours: used / hourly,
    fitsNew: CARS.filter((c) => c.newPrice && c.newPrice * WON <= budget).sort((a, b) => b.newPrice - a.newPrice),
    fitsUsed: CARS.filter((c) => c.used * WON <= budget && !(c.newPrice && c.newPrice * WON <= budget)).sort((a, b) => b.used - a.used),
    over: CARS.filter((c) => c.used * WON > budget).length,
  }
}

// 만 원 → "3,155만 원", "1억 2,940만 원"
export function manText(man) {
  const eok = Math.floor(man / 10000)
  const rest = Math.round(man % 10000)
  if (!eok) return `${rest.toLocaleString('ko-KR')}만 원`
  return rest ? `${eok}억 ${rest.toLocaleString('ko-KR')}만 원` : `${eok}억 원`
}

export const FAQ = [
  {
    q: '내 연봉에 맞는 차는 어떻게 정했나요?',
    a: '재무 가이드에서 흔히 권하는 "차값은 세전 연봉의 50% 이내" 기준을 썼어요. 연봉 4,500만 원이면 2,250만 원까지예요. 할부 이자, 보험료, 기름값 같은 유지비는 빠져 있어서 실제로는 이보다 넉넉하게 잡는 게 좋아요.',
  },
  {
    q: '차값은 언제 가격인가요?',
    a: '2023년식 차를 비교하므로 2023년 당시(또는 그 연식 출시 때) 제조사가 발표한 기본 트림 가격을 썼어요. 옵션, 할인, 취등록세는 빠져 있어요. 가격을 찾지 못한 차는 지어내지 않고, 지금 중고 시세로만 판정해요.',
  },
  {
    q: '중고 시세는 어디서 가져왔나요?',
    a: '엔카가 매달 공개하는 시세 보도자료(2026년 10월, 2023년식, 주행거리 6만km, 무사고 기준)의 숫자를 그대로 옮겼어요. 엔카 사이트를 따로 긁어 오지는 않았고, 실제 매물 가격은 옵션과 상태에 따라 달라요.',
  },
  {
    q: '3년 타면 사라진 돈은 무엇인가요?',
    a: '2023년 신차 가격에서 지금 중고 시세를 뺀 값이에요. 이 돈을 실수령 시급으로 나눠 몇 시간, 몇 달 일해야 버는 돈인지 보여 드려요. 세금과 유지비는 빠져 있어 실제로 쓴 돈은 더 많아요.',
  },
  {
    q: '입력한 정보는 저장되나요?',
    a: '숫자를 입력하지 않고 연봉과 차를 고르기만 해요. 고른 값은 주소창과 이 브라우저에만 남고, 돈미터 서버에는 저장하지 않아요.',
  },
]
