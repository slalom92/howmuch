// 프로야구 선수 연봉의 긁는 한 줄 (도구는 src/lib/sting.js). 선수 연봉이 세전이라 내 연봉도 세전으로 맞춘다
import { lines, workText, wonText, hourlyOf, josa, bigTime, bigSec } from '../../lib/sting.js'

export function kboStings(pr, salary) {
  const p = pr.player
  const b = pr.b
  const h = hourlyOf(salary, 'gross')
  const rec = pr.rec?.items.find((x) => x.won)
  const games = salary.gross / b.game
  const inningsN = salary.gross / b.inning
  return lines(
    `${p.name} 선수가 1경기 뛰면 **${wonText(b.game)}**. 나는 그 돈 벌려면 **${workText(b.game / h)}**`,
    rec && `${p.name} 선수 ${rec.label} **${rec.approx ? '약 ' : ''}${wonText(rec.won)}**. 나는 그만큼 벌려면 **${workText(rec.won / h)}**`,
    games >= 1
      ? `내 1년 연봉, ${p.name} 선수는 **${games < 10 ? games.toFixed(1).replace(/\.0$/, '') : Math.round(games).toLocaleString('ko-KR')}경기**면 벌어요. 나는 1년 내내 출근하는데`
      : `내 1년 연봉, ${p.name} 선수는 **${Math.max(1, Math.round(inningsN))}이닝**이면 벌어요. 나는 1년 내내 출근하는데`,
    b.second * 5 >= 10 && `이 문장 읽는 5초 동안 ${p.name} 선수는 **${wonText(b.second * 5)}** 벌었어요`,
  )
}

// 맨 위 배너 후보: 처음 들어올 때 하나를 고른다 ("1.5경기" / "양의지가 내 연봉 버는 시간" ...)
export function kboHero(pr, salary) {
  const p = pr.player
  const h = hourlyOf(salary, 'gross')
  const games = salary.gross / pr.b.game
  const n = (x) => (x < 10 ? x.toFixed(1).replace(/\.0$/, '') : Math.round(x).toLocaleString('ko-KR'))
  const big = games >= 1 ? `${n(games)}경기` : `${n(salary.gross / pr.b.inning)}이닝`
  const rec = pr.rec?.items.find((x) => x.won)
  return [
    { big, cap: `${josa(p.name, '이', '가')} 내 연봉 버는 시간`, label: `${p.name} 선수가 내 1년 연봉을 버는 데 ${big}` },
    rec && { big: bigTime(rec.won / h), cap: `일해야 ${p.name} ${rec.label.replace(/에$/, '')}` },
    { big: bigTime(pr.b.game / h), cap: `일해야 ${p.name} 1경기` },
    pr.b.second > 0 && { big: bigSec(h / pr.b.second), cap: `${josa(p.name, '이', '가')} 내 시급 버는 시간` },
  ]
}
