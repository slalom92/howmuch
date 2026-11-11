// 연봉 모아 집 사기의 긁는 한 줄 (도구는 src/lib/sting.js)
import { lines, yearsText, pctText, sinceText, pick } from '../../lib/sting.js'

export function aptStings(r) {
  if (!r.ready || !r.pool.length) return []
  const a = r.state.a
  if (r.yearly <= 0) return lines(`생활비 빼면 남는 돈이 없어서 **${r.place} 아파트는 영원히 못 사요**. 아끼기를 골라 다시 계산해 보세요`)
  const Y = (apt) => apt[a].price / r.yearly
  const sorted = [...r.pool].sort((x, y) => x[a].price - y[a].price)
  const low = sorted[0]
  const top = sorted.at(-1)
  const mid = sorted[Math.floor(sorted.length / 2)]
  const nameOf = (apt) => apt.name.replace(/\s*\([^)]*\)$/, '') // "현대14차(203,204동)" → "현대14차"
  const how = r.state.b === 'left' ? '생활비만 쓰고' : '한 푼도 안 쓰고'
  const midY = Y(mid)
  const midTail = midY < 15 ? '그동안 집값이 가만히 있어 준다면요' : midY <= 30 ? '지금 신입이 부장 될 때쯤이에요' : midY <= 60 ? '정년퇴직 선물로 받으면 딱이에요' : '증손주 대에 이사 가요'
  const within30 = r.pool.filter((x) => Y(x) <= 30).length / r.pool.length
  return lines(
    `${r.place}에서 제일 비싼 ${nameOf(top)}, ${how} 모아도 **${yearsText(Y(top))}**. **${sinceText(Y(top))}** 모았어야 지금 살 수 있어요`,
    `제일 싼 ${nameOf(low)}도 **${yearsText(Y(low))}**. 그것도 ${how} 모았을 때 얘기예요`,
    `${r.place} ${a}㎡ 아파트 딱 중간 값까지 **${yearsText(midY)}**. ${midTail}`,
    within30 === 0
      ? `직장 30년을 꽉 채워 다녀도 ${r.place} 아파트는 **한 곳도** 못 사요`
      : within30 < 0.01
        ? `직장 30년을 꽉 채워 다녀도 ${r.place} 아파트 중 **1%도 안 되는** 곳만 내 거예요`
        : `직장 30년을 꽉 채워 다녀도 ${r.place} 아파트 중 **${pctText(within30)}**만 내 거예요`,
  )
}

// 맨 위 배너 후보: 처음 들어올 때 하나를 고른다.
// 비싼 단지는 늘 1등만 나오면 식상하니, 고른 지역에서 비싼 순 20곳 중 한 곳을 따로 굴려 고른다
export function aptHero(r) {
  const what = r.state.b === 'left' ? '남는 돈으로' : '내 월급으로'
  if (!r.ready || !r.pool.length) return [{ big: '?년', cap: `${what} 내 집` }]
  const a = r.state.a
  if (r.yearly <= 0) return [{ big: '∞년', cap: `${what} ${r.place} 아파트` }]
  const Y = (apt) => apt[a].price / r.yearly
  const nameOf = (apt) => apt.name.replace(/\s*\([^)]*\)$/, '')
  const sorted = [...r.pool].sort((x, y) => y[a].price - x[a].price)
  const pricey = pick(sorted.slice(0, 20), 1)
  const low = sorted.at(-1)
  const mid = sorted[Math.floor(sorted.length / 2)]
  const within30 = r.pool.filter((x) => Y(x) <= 30).length / r.pool.length
  return [
    { big: yearsText(Y(pricey)), cap: `${what} ${nameOf(pricey)}` },
    { big: yearsText(Y(low)), cap: `${r.place} 제일 싼 ${nameOf(low)}도` },
    { big: yearsText(Y(mid)), cap: `${r.place} 딱 중간 아파트까지` },
    { big: within30 > 0 && within30 < 0.01 ? '1% 미만' : pctText(within30), cap: `30년 모아 살 수 있는 ${r.place} 아파트` },
  ]
}
