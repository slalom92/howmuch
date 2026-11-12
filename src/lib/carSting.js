// 차값 긁는 한 줄: "지금 연봉에 탈 수 있는 차", "지금 타는 차 내 연봉에 맞아?"
// - 기준: 흔히 권하는 '차값은 세전 연봉의 50% 이내' (겟차 등 재무 가이드)
// - 차값: src/pages/car/cars.js 의 2023년 당시 신차 가격 (없거나 참고값인 차는 뺀다). 지어낸 숫자는 쓰지 않는다
import { CARS } from '../pages/car/cars.js'
import { wonText, josa, pick } from './sting.js'

export const CAR_RATIO = 0.5

const priced = CARS.filter((c) => c.newPrice && !c.approx).sort((a, b) => a.newPrice - b.newPrice)
const won = (man) => man * 10000
const needPay = (car) => won(car.newPrice) / CAR_RATIO // 이 차가 연봉 절반이 되려면 필요한 연봉

// 연봉 절반으로 살 수 있는 가장 비싼 새 차, 그 바로 위 차
export function carFit(salary) {
  const budget = salary.gross * CAR_RATIO
  const fit = priced.filter((c) => won(c.newPrice) <= budget).at(-1) || null
  const next = priced.find((c) => won(c.newPrice) > budget) || null
  return { budget, fit, next }
}

// 내 연봉으로는 버거운 차 하나 (페이지마다 salt 를 달리 줘서 다른 차가 나오게)
export function carOver(salary, salt = 2) {
  // 살짝 넘는 차는 덜 긁히니, 필요한 연봉이 지금보다 15% 이상 많은 차부터 고른다
  const far = priced.filter((c) => needPay(c) > salary.gross * 1.15)
  const over = far.length ? far : priced.filter((c) => needPay(c) > salary.gross)
  return pick(over.length ? over : priced.slice(-1), salt)
}

export function carStings(salary, salt = 2) {
  const { fit, next } = carFit(salary)
  const cheapUsed = [...CARS].filter((c) => won(c.used) <= salary.gross * CAR_RATIO).sort((a, b) => b.used - a.used)[0]
  const canBuy = fit
    ? `연봉 절반 기준, 지금 연봉에 탈 수 있는 새 차는 **${fit.model}**(${fit.newPrice.toLocaleString('ko-KR')}만 원)까지${next ? `. ${josa(next.model, '은', '는')} 연봉 **${wonText(needPay(next))}**은 돼야 해요` : ''}`
    : `연봉 절반 기준으로는 제일 싼 새 차 ${priced[0].model}도 못 사요${cheapUsed ? `. 3년 된 중고 **${cheapUsed.model}**(${cheapUsed.used.toLocaleString('ko-KR')}만 원)부터예요` : ''}`
  const car = carOver(salary, salt)
  const gap = needPay(car) - salary.gross
  const yours = `지금 타는 ${car.model}, 내 연봉에 맞아? 차값이 연봉 절반이 되려면 연봉 **${wonText(needPay(car))}**. 지금보다 **${wonText(gap)}** 더 벌어야 해요`
  return [canBuy, gap > 0 && yours].filter(Boolean)
}

// 맨 위 배너 후보: "9,208만 원" / "그랜저 타려면 필요한 연봉"
export function carHero(salary, salt = 2) {
  const car = carOver(salary, salt)
  return { big: wonText(needPay(car)), cap: `${car.model} 타려면 필요한 연봉` }
}
