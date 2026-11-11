// 월급 분당 계산기의 긁는 한 줄 (도구는 src/lib/sting.js)
import { lines, workText, wonText, bigTime } from '../../lib/sting.js'
import { PLAYERS } from '../kbo/kbo.js'

export function jonberStings(r) {
  const it = Object.fromEntries(r.items.map((x) => [x.id, x]))
  const h = r.hourly
  // 연봉이 가장 많은 타자 (안타 기록이 있는 선수)
  const bat = PLAYERS.find((p) => p.stats && p.stats.h > 0)
  const perHit = bat ? (bat.pay * 10000) / bat.stats.h : 0
  const coffees = Math.floor(h / it.americano.price)
  const rentDays = Math.max(1, Math.round(it.rent.hours / 8))
  return lines(
    `**${workText(it.chicken.hours)}** 일해야 겨우 치킨 한 마리. 배달비는 따로예요`,
    `서울 원룸 월세 내려고 매달 **${rentDays}일**은 집주인을 위해 출근해요`,
    `아이폰 18 프로 = **${workText(it.iphone.hours)}** 출근. 할부 끝날 즈음 새 아이폰이 나와요`,
    bat && `${bat.name} 선수는 안타 하나에 **${wonText(perHit)}**. 나는 그 돈 벌려면 **${workText(perHit / h)}**`,
    coffees >= 1
      ? `회의 1시간 동안 내가 버는 돈 **${wonText(h)}**. 그 회의, 아메리카노 ${coffees}잔짜리였어요`
      : `한 시간 꼬박 일해도 아메리카노 한 잔이 안 돼요. 시급 **${wonText(h)}**`,
    `이 페이지를 1분 보는 동안에도 **${wonText(r.perMinute)}** 벌었어요. 일하는 중이니 계속 보세요`,
  )
}

// 맨 위 배너 후보: "88분" / "일해야 치킨 한 마리" 같은 것 중 하나를 처음 들어올 때 고른다
export function jonberHero(r) {
  const it = Object.fromEntries(r.items.map((x) => [x.id, x]))
  const bat = PLAYERS.find((p) => p.stats && p.stats.h > 0)
  const t = (id, cap) => it[id] && { big: bigTime(it[id].hours), cap }
  return [
    t('chicken', '일해야 치킨 한 마리'),
    t('iphone', '일해야 아이폰 18 프로'),
    t('americano', '일해야 아메리카노 한 잔'),
    t('airpods', '일해야 에어팟 프로 3'),
    t('buffet', '일해야 호텔 뷔페 한 끼'),
    t('lotteworld', '일해야 롯데월드 하루'),
    it.rent && { big: `${Math.max(1, Math.round(it.rent.hours / 8))}일`, cap: '매달 월세 내려고 출근' },
    bat && { big: bigTime((bat.pay * 10000) / bat.stats.h / r.hourly), cap: `일해야 ${bat.name} 안타 하나` },
  ]
}
