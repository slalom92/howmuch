// 존버 계산기의 긁는 한 줄 (도구는 src/lib/sting.js)
import { lines, wonText, yearsText, pctText } from '../../lib/sting.js'
import { lastOf } from './survive.js'

const GOAL = 100000000 // 1억
const CHICKEN = 23000 // BBQ 황금올리브 (월급 분당 계산기와 같은 값)

export function surviveStings(r) {
  const st = r.state
  const yearsTo = (left) => (left > 0 ? GOAL / (left * 12) : null)
  const now = yearsTo(r.left)
  const onRamen = st.a.f === 'ramen'
  const ramen = lastOf(r.monthly, st.s, { ...st.a, f: 'ramen' }, st.r)
  const ry = yearsTo(ramen.left)
  const chicken = Math.floor(r.left / CHICKEN)

  let goal
  if (onRamen) goal = now ? `세 끼 라면만 먹는데도 1억까지 **${yearsText(now)}**` : '세 끼 라면만 먹어도 **1억은 못 모아요**. 월급이 생활비를 못 따라가요'
  else if (now) goal = `이렇게 살면 1억까지 **${yearsText(now)}**${ry ? `. 세 끼 라면만 먹어 봤자 **${yearsText(ry)}**` : ''}`
  else goal = `이렇게 살면 **1억은 못 모아요**${ry ? `. 세 끼 라면만 먹으면 그나마 **${yearsText(ry)}**` : '. 세 끼 라면만 먹어도 못 모아요'}`

  return lines(
    r.days < 30
      ? `월급날 **${30 - r.days}일 전**부터 통장이 텅 비어요. 남은 날은 정신력으로 버텨야 해요`
      : `월급 한 번으로 **${r.days}일** 버텨요. 남는 ${r.days - 30}일치를 1년 모아 봐야 겨우 **${wonText(r.left * 12)}**`,
    goal,
    r.left > 0
      ? chicken >= 1
        ? `한 달 아끼고 남는 돈 **${wonText(r.left)}** = 치킨 **${chicken}마리**. 이게 내 저축이에요`
        : `한 달 남는 돈 **${wonText(r.left)}**. 치킨 한 마리도 못 사요`
      : `매달 **${wonText(-r.left)}**씩 모자라요. 다음 달 월급으로 이번 달을 막는 중이에요`,
    `월급의 **${pctText(r.spend / r.monthly)}**가 그냥 살아 있는 값으로 나가요`,
  )
}

// 맨 위 배너 후보: 처음 들어올 때 하나를 고른다 ("D-2" / "월급날 전에 통장 0원", "5.3년" / "이렇게 살면 1억까지" ...)
export function surviveHero(r) {
  const st = r.state
  const ramen = st.a.f === 'ramen' ? null : lastOf(r.monthly, st.s, { ...st.a, f: 'ramen' }, st.r)
  const chicken = Math.floor(r.left / CHICKEN)
  return [
    r.days < 30 ? { big: `D-${30 - r.days}`, cap: '월급날 전에 통장 0원' } : { big: `${r.days}일`, cap: '월급 한 번으로 존버' },
    r.left > 0 ? { big: yearsText(GOAL / (r.left * 12)), cap: '이렇게 살면 1억까지' } : { big: wonText(-r.left), cap: '매달 모자라는 돈' },
    ramen && ramen.left > 0 && { big: yearsText(GOAL / (ramen.left * 12)), cap: '세 끼 라면만 먹어도 1억까지' },
    { big: pctText(r.spend / r.monthly), cap: '숨만 쉬어도 나가는 월급' },
    chicken >= 1 && { big: `${chicken.toLocaleString('ko-KR')}마리`, cap: '한 달 아껴 남는 돈 = 치킨' },
  ]
}
