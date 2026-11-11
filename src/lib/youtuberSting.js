// 유튜버 수익 계산기의 긁는 한 줄 (도구는 src/lib/sting.js). 수익은 추정치라 문장에도 '추정'을 붙인다
import { lines, workText, wonText, timesText, yearsText, pctText, hourlyOf } from './sting.js'
import { monthlyRevenue } from './calc.js'

export function youtuberStings({ channel, analysis, tier, salary }) {
  const m = monthlyRevenue(analysis, tier).total
  if (!m) return []
  const myMonth = salary.net / 12
  const h = hourlyOf(salary, 'net')
  const uploads = analysis.long.uploadsPerMonth + analysis.short.uploadsPerMonth
  const perVideo = uploads > 0 ? m / uploads : 0
  const name = channel.title
  return lines(
    m >= myMonth
      ? `${name} 한 달 추정 수익 **${wonText(m)}** = 내 월급의 **${timesText(m / myMonth)}**`
      : `${name} 한 달 추정 수익 **${wonText(m)}**. 이번 달은 내 월급이 이겼어요`,
    perVideo >= 10000 && `영상 하나 올릴 때마다 약 **${wonText(perVideo)}**. 나는 그 돈 벌려면 **${workText(perVideo / h)}**`,
    m * 12 >= salary.net && `${name}의 1년 추정 수익을 내 월급으로 모으려면 **${yearsText((m * 12) / salary.net)}**`,
  )
}

// 결과 위 배너: "12배" / "큰채널 한 달 vs 내 월급"
export function youtuberHero({ channel, analysis, tier, salary }) {
  const m = monthlyRevenue(analysis, tier).total
  if (!m) return { big: null }
  const x = m / (salary.net / 12)
  return { big: x >= 1 ? timesText(x) : pctText(x), cap: `${channel.title} 한 달 vs 내 월급` }
}
