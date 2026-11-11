// 골프 선수 상금의 긁는 한 줄 (KLPGA·KPGA·PGA·LPGA 같이 쓴다, 도구는 src/lib/sting.js). 상금이 세전이라 내 연봉도 세전
import { lines, workText, wonText, timesText, pctText, hourlyOf, bigTime, bigSec, josa } from '../../lib/sting.js'

export function golfStings(pr, salary) {
  const p = pr.player
  const b = pr.b
  const h = hourlyOf(salary, 'gross')
  const month = salary.gross / 12
  const vsYear = p.prize / salary.gross
  return lines(
    pr.perStroke && `${p.name} 선수 1타에 **${wonText(pr.perStroke)}**. 나는 **${workText(pr.perStroke / h)}** 일해야 한 타`,
    pr.perEvent &&
      (pr.perEvent >= month
        ? `대회 하나 나가면 **${wonText(pr.perEvent)}**. 내 월급의 **${timesText(pr.perEvent / month)}**예요`
        : `대회 하나 나가면 **${wonText(pr.perEvent)}**. 내 월급의 **${pctText(pr.perEvent / month)}**예요`),
    vsYear >= 1
      ? `한 시즌 상금이 내 연봉의 **${timesText(vsYear)}**. 골프채 14개로요`
      : `한 시즌 상금이 내 연봉의 **${pctText(vsYear)}**. 이번 시즌은 내가 이겼어요`,
    b.second * 5 >= 10 && `이 문장 읽는 5초 동안 ${p.name} 선수는 **${wonText(b.second * 5)}** 벌었어요`,
  )
}

// 맨 위 배너 후보: 처음 들어올 때 하나를 고른다 ("5일" / "일해야 김민솔 1타", "36배" / "김민솔 상금 vs 내 연봉" ...)
export function golfHero(pr, salary) {
  const p = pr.player
  const h = hourlyOf(salary, 'gross')
  const month = salary.gross / 12
  const x = p.prize / salary.gross
  return [
    pr.perStroke && { big: bigTime(pr.perStroke / h), cap: `일해야 ${p.name} 1타` },
    { big: x >= 1 ? timesText(x) : pctText(x), cap: `${p.name} 상금 vs 내 연봉` },
    pr.perEvent && { big: pr.perEvent >= month ? timesText(pr.perEvent / month) : pctText(pr.perEvent / month), cap: `${p.name} 대회 하나 vs 내 월급` },
    pr.perEvent && { big: bigTime(pr.perEvent / h), cap: `일해야 ${p.name} 대회 하나` },
    pr.b.second > 0 && { big: bigSec(h / pr.b.second), cap: `${josa(p.name, '이', '가')} 내 시급 버는 시간` },
  ]
}
