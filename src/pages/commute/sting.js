// 직주근접 계산기의 긁는 한 줄 (도구는 src/lib/sting.js)
import { lines, workText, wonText, yearsText, hourlyOf, bigTime } from '../../lib/sting.js'
import { man, monthMinutes, hourText } from './commute.js'
import { carStings } from '../../lib/carSting.js'

// sum: 결과 요약, routeSec: 고른 집에서 역까지 가장 빠른 길(초, 없으면 0)
export function commuteStings({ sum, state, station, salary, routeSec }) {
  if (!sum.count) return []
  const h = hourlyOf(salary, 'net')
  const workDays = sum.cost / (h * 8)
  const diff = sum.near ? sum.near.inner - sum.near.outer : 0
  const monthMin = routeSec ? monthMinutes(routeSec) : 0
  return lines(
    workDays >= 1
      ? `${station.name}역 근처 한 달 집값 **${wonText(sum.cost)}**. 매달 **${Math.round(workDays)}일**은 집주인을 위해 출근해요`
      : `${station.name}역 근처 한 달 집값 **${wonText(sum.cost)}**. 매달 **${workText(sum.cost / h)}**은 집주인을 위해 일해요`,
    diff > 0 && `역 500m 안이면 한 달 **${wonText(diff)}** 더, 1년이면 **${wonText(diff * 12)}**. 아침잠 몇 분의 값이에요`,
    state.k === 'jeonse'
      ? `전세 **${man(sum.price)} 원**, 월급을 한 푼도 안 쓰고 **${yearsText((sum.price * 10000) / salary.net)}** 모아야 해요`
      : `보증금 **${man(sum.deposit)} 원**만 모으는 데도 월급 **${workText((sum.deposit * 10000) / h)}** 치예요`,
    monthMin > 0 && `${station.name}역까지 한 달 출퇴근 **${hourText(monthMin)}**. 1년이면 **${((monthMin * 12) / 60 / 24).toFixed(1)}일**을 꼬박 길에서 보내요`,
    ...carStings(salary, 5),
  )
}

// 맨 위 배너 후보: 처음 들어올 때 하나를 고른다 (자료를 찾기 전에는 "?일" / "매달 집주인 위해 출근")
export function commuteHero({ sum, state, salary, ready }) {
  if (!ready || !sum.count) return [{ big: '?일', cap: '매달 집주인 위해 출근' }]
  const h = hourlyOf(salary, 'net')
  const diff = sum.near ? sum.near.inner - sum.near.outer : 0
  return [
    { big: bigTime(sum.cost / h), cap: '매달 집주인 위해 출근' },
    diff > 0 && { big: wonText(diff * 12), cap: '역 500m 안 1년 웃돈' },
    state.k === 'jeonse'
      ? { big: yearsText((sum.price * 10000) / salary.net), cap: '월급 다 모아야 전세금' }
      : sum.deposit > 0 && { big: bigTime((sum.deposit * 10000) / h), cap: '일해야 보증금' },
  ]
}
