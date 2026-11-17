// 주식 물타기 계산기의 긁는 한 줄 (도구는 src/lib/sting.js)
// 한국 증시는 오르면 빨강, 내리면 파랑이다.
import { lines, wonText, josa } from '../../lib/sting.js'
import { displayName, signPct, pctPlain, qtyText, monthsText } from './stock.js'

const daysText = (d) => `${d.toLocaleString('ko-KR')}일`

export function stockStings(r) {
  if (!r.ready) return []
  const name = displayName(r.name)
  if (r.flat) {
    return lines(
      `${josa(name, '은', '는')} 딱 본전. 그런데 수수료랑 세금 떼면 지금 팔아도 **${wonText(-r.net)}** 손해예요`,
      `본전에 팔면 남는 건 경험뿐. 거래세 **${wonText(r.sellTax)}**은 나라가 챙겨 가요`,
    )
  }
  if (r.loss) {
    const near = r.water[0]
    const five = r.water.find((w) => w.t === -0.05)
    return lines(
      near && `지금 넌 **${qtyText(near.shares)}** 더 사야 ${signPct(near.t, 0)}. 그 돈 **${wonText(near.costWithFee)}**, 월급 **${monthsText(near.costWithFee / r.monthly)}** 치예요`,
      `본전까지 주가가 **${signPct(r.rebound)}** 올라야 해요. ${pctPlain(-r.rate)} 빠졌다고 ${pctPlain(-r.rate)}만 오르면 되는 게 아니에요`,
      r.days > 0 ? `내 주식은 늘 파랗지. ${josa(name, '이', '가')} 파란불 켠 지 **${daysText(r.days)}**째예요` : `내 주식은 늘 파랗지. 평가 손실 **${wonText(-r.pl)}**`,
      `파랗게 증발한 돈 **${wonText(-r.pl)}**, 내 월급 **${monthsText(r.plMonths)}** 치예요`,
      r.chickens >= 2 && `이 손실이면 치킨 **${r.chickens.toLocaleString('ko-KR')}마리**. 차라리 먹을 걸 그랬어요`,
      five && five !== near && `${signPct(-0.05, 0)}까지라도 물타려면 **${qtyText(five.shares)}**, 월급 **${monthsText(five.costWithFee / r.monthly)}** 치를 더 부어야 해요`,
      `물타기로 본전은 못 만들어요. 아무리 사도 평균 단가는 지금 가격 **${wonText(r.cur)}** 아래로 안 내려가요`,
    )
  }
  return lines(
    `빨간 주식 좋아해? 곧 파래질 거야. 지금 팔면 손에 남는 돈 **${wonText(r.net)}**`,
    `세금·수수료 떼고 순익 **${wonText(r.net)}**. 주식이 내 월급 **${Math.max(1, Math.round(r.plDays)).toLocaleString('ko-KR')}일** 치를 벌었어요`,
    `지금 팔면 거래세만 **${wonText(r.sellTax)}**. 내 수익에 나라도 같이 웃어요`,
    r.annual != null && `${daysText(r.days)} 들고 **${signPct(r.rate)}**. 1년으로 치면 **${signPct(r.annual)}**, ${r.annual > 0.035 ? '예금 금리는 이겼네요' : '예금이랑 별 차이 없네요'}`,
    `${josa(name, '이', '가')} 빨간불일 때 못 팔면, 이 숫자는 그냥 화면 속 숫자예요`,
  )
}

// 맨 위 큰 배너 후보
export function stockHero(r) {
  if (!r.ready) return []
  const name = displayName(r.name)
  if (r.flat) {
    return [
      { big: wonText(-r.net), cap: '딱 본전인데 팔면 이만큼 손해' },
      { big: wonText(r.sellTax), cap: '팔면 나라가 가져가는 거래세' },
    ]
  }
  if (r.loss) {
    const near = r.water[0]
    return [
      near ? { big: qtyText(near.shares), cap: `지금 넌 이만큼 사야 ${signPct(near.t, 0)}` } : { big: signPct(r.rate), cap: `${name} 파란불` },
      { big: signPct(r.rebound), cap: '본전까지 올라야 하는 주가' },
      { big: wonText(-r.pl), cap: '파랗게 증발한 돈' },
      r.days > 0 ? { big: daysText(r.days), cap: `${name} 파란불 보유 중` } : { big: monthsText(r.plMonths), cap: '증발한 내 월급' },
    ]
  }
  return [
    { big: wonText(r.net), cap: '지금 팔면 손에 남는 돈' },
    { big: signPct(r.rate), cap: `${name} 빨간불` },
    { big: `${Math.max(1, Math.round(r.plDays)).toLocaleString('ko-KR')}일 치`, cap: '주식이 대신 번 내 월급' },
    { big: wonText(r.sellTax), cap: '팔면 나라가 가져가는 거래세' },
  ]
}
