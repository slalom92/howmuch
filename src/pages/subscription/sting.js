// 월 구독료 계산기의 긁는 한 줄 (도구는 src/lib/sting.js)
import { lines, wonText, yearsText, pctText, bigTime } from '../../lib/sting.js'

const n = (v) => Math.floor(v).toLocaleString('ko-KR')

// 아무것도 고르지 않았을 때: 구독 0개를 놀리는 한 줄
const NETFLIX_YEAR = 13500 * 12 // 넷플릭스 스탠다드 1년
const YT_YEAR = 14900 * 12 // 유튜브 프리미엄 1년

function emptyStings(r) {
  return lines(
    `구독 **0개**. 지상파 방송만 보는구나? 리모컨이 제일 알뜰한 구독이에요`,
    `음악 안 좋아해? 유튜브 프리미엄도 없으면 광고를 **1년에 ${wonText(YT_YEAR)}어치** 참고 보는 중이에요`,
    `영화 안 좋아해? 드라마도 안 봐? 넷플릭스 스탠다드 1년 **${wonText(NETFLIX_YEAR)}**을 통째로 아꼈어요`,
    `배달앱 멤버십도 없다니, 배달팁은 그때그때 내는 쪽이군요`,
    `챗GPT도 없이 일한다고요? 손으로 다 하는 **진짜 장인**이에요`,
    `매달 자동이체 **0원**, 월급 ${wonText(r.pay)}이 고스란히 남아요. 심심하면 돈미터라도 구독할래요? 여긴 **평생 0원**이에요`,
  )
}

// 고른 건 있는데 비어 있는 분류가 있으면 하나만 콕 집는다
function missingLine(r) {
  const has = (cat) => r.items.some((i) => i.cat === cat)
  const ytPremium = r.items.some((i) => i.id === 'youtube' && i.tier.id === 'pre')
  if (!has('ott')) return '영상 구독은 하나도 없네요. **지상파 방송만 보는구나?**'
  if (!has('music') && !ytPremium) return '음악 구독은 **0원**. 음악 안 좋아해?'
  if (!has('ai')) return 'AI 구독은 없네요. 아직 **챗GPT 없이** 일하는 중이군요'
  return null
}

export function subscriptionStings(r) {
  if (!r.count) return emptyStings(r)
  const top = r.top
  const car = r.tenCar
  const morning = r.cars.find((c) => c.id === 'morning')
  const catSum = (cat) => r.items.filter((i) => i.cat === cat).reduce((a, b) => a + b.price, 0)
  const fit = catSum('fit')
  const rental = catSum('rental')
  return lines(
    `구독료만 한 달 **${wonText(r.monthly)}**. 1년이면 **${wonText(r.yearly)}**이 자동이체로 빠져나가요`,
    `월급의 **${pctText(r.share)}**가 로그인하는 값이에요. 월급날마다 **${bigTime(r.hours)}**은 구독료 벌려고 일해요`,
    r.chicken >= 1
      ? `1년 구독료면 치킨 **${n(r.chicken)}마리**, 라면이면 **${n(r.ramen)}봉지**예요`
      : `1년 구독료면 라면 **${n(r.ramen)}봉지**예요`,
    car
      ? `10년 동안 안 쓰고 모으면 **${car.name}** 중고차를 사요. 지금은 매달 화면으로 사라지는 중이에요`
      : morning && `구독 끊고 모으면 **${yearsText(morning.years)}** 뒤에 5년 된 중고 모닝을 사요`,
    top && r.count > 1 && `제일 비싼 건 **${top.name}** ${top.tier.label}, 혼자서 구독료의 **${pctText(top.price / r.monthly)}**를 먹어요`,
    `하루로 치면 **${wonText(r.daily)}**. 안 보는 날에도 꼬박꼬박 나가요`,
    fit > 0 && `운동 회원권만 한 달 **${wonText(fit)}**. 이번 달 몇 번 갔는지 세어 보면 한 번 가는 값이 나와요`,
    rental > 0 && `렌탈료만 한 달 **${wonText(rental)}**. 약정이 끝나기 전까지는 렌탈 회사 물건이에요`,
    missingLine(r),
  )
}

// 맨 위 배너 후보: 처음 들어올 때 하나를 고른다
export function subscriptionHero(r) {
  if (!r.count)
    return [
      { big: '0원', cap: '지상파 방송만 보는구나?' },
      { big: '0원', cap: '음악 안 좋아해?' },
      { big: '0원', cap: '영화 안 좋아해?' },
      { big: '0원', cap: '드라마 안 좋아해?' },
      { big: '구독 0개', cap: '돈미터라도 구독할래?' },
      { big: wonText(NETFLIX_YEAR), cap: '넷플릭스 1년 아낀 돈' },
    ]
  const morning = r.cars.find((c) => c.id === 'morning')
  return [
    { big: wonText(r.yearly), cap: '1년 동안 자동이체로 나가는 돈' },
    { big: pctText(r.share), cap: '구독료로 사라지는 월급' },
    r.chicken >= 1 && { big: `${n(r.chicken)}마리`, cap: '1년 구독료 = 치킨' },
    { big: bigTime(r.yearHours), cap: '1년 구독료 벌려고 일하는 시간' },
    morning && morning.years && { big: yearsText(morning.years), cap: '구독료 모아 5년 된 중고 모닝' },
  ]
}
