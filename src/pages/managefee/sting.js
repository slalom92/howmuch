// 관리비 계산기의 긁는 한 줄 (도구는 src/lib/sting.js)
import { lines, wonText, josa } from '../../lib/sting.js'

const n = (v) => Math.floor(v).toLocaleString('ko-KR')
const absWon = (v) => wonText(Math.abs(v))
// carFor 결과: 모닝만 2021년식, 나머지는 2023년식 중고 시세
export const carLabel = (c) => (c.id === 'morning' ? c.name : `2023년식 ${c.name}`)

export function manageFeeStings(r) {
  const over = r.diff > 0
  return lines(
    over
      ? `${r.basis}보다 매달 **${absWon(r.diff)}** 더 내요. 1년이면 **${wonText(r.extraYear)}**이 평균보다 더 나가요`
      : r.diff < 0
        ? `${r.basis}보다 매달 **${absWon(r.diff)}** 덜 내요. 관리비는 잘 막고 있어요`
        : `${r.basis}과 딱 같아요`,
    `관리비만 1년에 **${wonText(r.yearly)}**. 치킨으로 바꾸면 **${n(r.chicken)}마리**예요`,
    `10년이면 **${wonText(r.y10)}** (매년 3% 오른다고 치면)${r.car10 ? `. ${josa(carLabel(r.car10), '을', '를')} 중고로 살 수 있는 돈이에요` : ''}`,
    `이 돈을 10년 동안 연 8%로 굴렸다면 **${wonText(r.fv10)}**이 됐을 거예요`,
    r.apt && `우리 집은 전용 1㎡에 **${n(r.perM2)}원**. ${r.region.label} 평균은 ${n(Math.round(r.region.perM2 * r.season.w))}원이에요`,
  )
}

export function manageFeeHero(r) {
  const over = r.diff > 0
  return [
    over && { big: `+${absWon(r.diff)}`, cap: `${r.basis}보다 매달 더` },
    !over && r.diff < 0 && { big: `-${absWon(r.diff)}`, cap: `${r.basis}보다 매달 덜` },
    { big: wonText(r.yearly), cap: '1년 동안 나가는 관리비' },
    { big: wonText(r.y10), cap: '10년 동안 낼 관리비' },
    { big: wonText(r.fv10), cap: '10년 관리비를 연 8%로 굴렸다면' },
    r.chicken >= 1 && { big: `${n(r.chicken)}마리`, cap: '1년 관리비 = 치킨' },
  ]
}
