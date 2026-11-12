// 자차 계산기의 긁는 한 줄 (도구는 src/lib/sting.js)
import { lines, workText, wonText, pctText, josa, bigTime, timesText } from '../../lib/sting.js'
import { carStings } from '../../lib/carSting.js'
import { carName } from './car.js'

export function carPageStings(r) {
  const name = carName(r.car)
  const by = r.judgeBy === 'new' ? '새 차 값' : '3년 된 중고 값'
  return lines(
    r.ok
      ? `${josa(name, '은', '는')} ${by}이 연봉의 **${pctText(r.ratio)}**. 연봉 절반 기준 안이에요. 대신 유지비는 따로예요`
      : `${josa(name, '이', '가')} 내 연봉에 맞으려면 연봉 **${wonText(r.needPay)}**. 지금보다 **${wonText(r.gap)}** 더 벌어야 해요. 지금 월급은 한 푼도 안 쓰고 모아도 **${workText(r.judge / r.hourly)}** 걸려요`,
    r.lost && `3년 남짓 타면 **${wonText(r.lost)}** 증발. 내 월급 **${r.lostMonths.toFixed(1).replace(/\.0$/, '')}달 치**가 차 가치로 녹았어요`,
    r.lost && `사라진 돈 ${wonText(r.lost)}, 벌려면 하루 8시간씩 **${Math.round(r.lostHours / 8).toLocaleString('ko-KR')}일** 출근해야 해요`,
    r.priceHours && `${name} 새 차 = 내 **${workText(r.priceHours)}** 노동. 월급을 한 푼도 안 쓰고 모았을 때 얘기예요`,
    `3년 된 중고로 사도 **${workText(r.usedHours)}** 일해야 해요`,
    !r.ok && r.judge / r.budget >= 1.5 && `연봉 절반 한도의 **${timesText(r.judge / r.budget)}**짜리 차예요`,
    ...carStings(r.salary, 6).slice(0, 1),
  )
}

// 맨 위 배너 후보
export function carPageHero(r) {
  // 후보는 늘 네 개, 모두 지금 고른 차 이야기다 (차를 바꾸면 같은 자리 문구가 그 차 숫자로 바뀐다)
  const name = r.car.model
  const months = (v) => `${v.toFixed(1).replace(/\.0$/, '')}달`
  return [
    r.ok
      ? { big: pctText(r.ratio), cap: `${name} = 내 연봉의` }
      : { big: wonText(r.needPay), cap: `${name} 타려면 필요한 연봉` },
    r.lost
      ? { big: wonText(r.lost), cap: `3년 타면 증발한 ${name} 값` }
      : { big: wonText(r.used), cap: `지금 ${name} 중고 시세` },
    r.lost
      ? { big: months(r.lostMonths), cap: `${name} 3년에 녹은 월급` }
      : { big: months(r.used / r.month), cap: `월급 모아 ${name} 중고` },
    r.priceHours
      ? { big: bigTime(r.priceHours), cap: `한 푼도 안 쓰고 모아야 ${name}` }
      : { big: bigTime(r.usedHours), cap: `한 푼도 안 쓰고 모아야 ${name} 중고` },
  ]
}
