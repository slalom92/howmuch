// 월 구독료 계산기의 긁는 한 줄 (도구는 src/lib/sting.js)
import { lines, wonText, yearsText, pctText, bigTime } from '../../lib/sting.js'

const n = (v) => Math.floor(v).toLocaleString('ko-KR')

export function subscriptionStings(r) {
  if (!r.count) return []
  const top = r.top
  const car = r.tenCar
  const casper = r.cars.find((c) => c.id === 'casper')
  return lines(
    `구독료만 한 달 **${wonText(r.monthly)}**. 1년이면 **${wonText(r.yearly)}**이 자동이체로 빠져나가요`,
    `월급의 **${pctText(r.share)}**가 로그인하는 값이에요. 월급날마다 **${bigTime(r.hours)}**은 구독료 벌려고 일해요`,
    r.chicken >= 1
      ? `1년 구독료면 치킨 **${n(r.chicken)}마리**, 라면이면 **${n(r.ramen)}봉지**예요`
      : `1년 구독료면 라면 **${n(r.ramen)}봉지**예요`,
    car
      ? `10년 동안 안 쓰고 모으면 **${car.name}** 중고차를 사요. 지금은 매달 화면으로 사라지는 중이에요`
      : casper && `이 구독료로 캐스퍼 중고차를 사려면 **${yearsText(casper.years)}** 모아야 해요`,
    top && r.count > 1 && `제일 비싼 건 **${top.name}** ${top.tier.label}, 혼자서 구독료의 **${pctText(top.price / r.monthly)}**를 먹어요`,
    `하루로 치면 **${wonText(r.daily)}**. 안 보는 날에도 꼬박꼬박 나가요`,
  )
}

// 맨 위 배너 후보: 처음 들어올 때 하나를 고른다
export function subscriptionHero(r) {
  if (!r.count) return []
  const casper = r.cars.find((c) => c.id === 'casper')
  return [
    { big: wonText(r.yearly), cap: '1년 동안 자동이체로 나가는 돈' },
    { big: pctText(r.share), cap: '구독료로 사라지는 월급' },
    r.chicken >= 1 && { big: `${n(r.chicken)}마리`, cap: '1년 구독료 = 치킨' },
    { big: bigTime(r.yearHours), cap: '1년 구독료 벌려고 일하는 시간' },
    casper && casper.years && { big: yearsText(casper.years), cap: '구독료 모아 캐스퍼까지' },
  ]
}
