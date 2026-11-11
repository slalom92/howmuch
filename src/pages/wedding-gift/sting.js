// 축의금 계산기의 긁는 한 줄 (도구는 src/lib/sting.js)
import { lines, workText, wonText, pctText, hourlyOf, bigTime } from '../../lib/sting.js'

export function giftStings(result, salary) {
  const amt = result.amount
  const h = hourlyOf(salary, 'net')
  const month = salary.net / 12
  const m = result.meal
  return lines(
    `축의금 **${wonText(amt)}** = 내 **${workText(amt / h)}** 노동. 본식은 30분이면 끝나요`,
    m &&
      (m.balance >= 0
        ? `식대 **${wonText(m.total)}** 빼면 진짜 축하하는 돈은 **${wonText(m.balance)}**`
        : `식대가 축의금보다 **${wonText(-m.balance)}** 비싸요. 축하하러 가서 적자 보는 중`),
    `올해 결혼식 다섯 번만 가도 **${wonText(amt * 5)}**. 내 월급의 **${pctText((amt * 5) / month)}**가 봉투로 사라져요`,
  )
}

// 맨 위 배너: "6.4시간" / "일해야 축의금 10만 원"
export function giftHero(result, salary) {
  return { big: bigTime(result.amount / hourlyOf(salary, 'net')), cap: `일해야 축의금 ${wonText(result.amount)}` }
}
