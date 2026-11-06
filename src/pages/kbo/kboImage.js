// 프로야구 선수 연봉을 전광판 모양 PNG(1080×1350, 4:5)로 그린다.
// 그리기 도구와 테마 색은 유튜버 카드(lib/shareImage.js)와 같은 것을 쓴다. 이미지는 이용자 기기에서만 만든다.
import { CARD_W, CARD_H, themeColors, loadFonts, makeCanvas, toBlob, text, fitText, fillRound, stamp, footer } from '../../lib/shareImage.js'
import { SEASON } from './kbo.js'

// 금액 쓰기 (KboApp 의 krw 와 같은 규칙)
function krw(n) {
  const v = Math.max(0, n)
  if (v >= 1e8) {
    let eok = Math.floor(v / 1e8)
    let man = Math.round((v - eok * 1e8) / 1e4)
    if (man >= 10000) {
      eok += 1
      man = 0
    }
    return `${eok.toLocaleString('ko-KR')}억${man ? ` ${man.toLocaleString('ko-KR')}만` : ''} 원`
  }
  // 100만 원 밑은 천 원 자리까지 ("11만 8천 원")
  if (v >= 1e4 && v < 1e6) {
    const chun = Math.round(v / 1e3)
    const man = Math.floor(chun / 10)
    return `${man}만${chun % 10 ? ` ${chun % 10}천` : ''} 원`
  }
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString('ko-KR')}만 원`
  return `${Math.round(v).toLocaleString('ko-KR')}원`
}

// 전광판 위쪽 전구 줄
function bulbs(ctx, x, y, w, color) {
  ctx.save()
  ctx.fillStyle = color
  for (let px = x + 22; px < x + w - 14; px += 26) {
    ctx.beginPath()
    ctx.arc(px, y, 4.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export async function drawScoreboard(pr) {
  const { player, team, b, change, gamesForWorkerYear: g } = pr
  const c = themeColors()
  const pay = krw(b.year)
  const games = g < 10 ? Math.round(g * 10) / 10 : Math.round(g)
  // 기록이 있으면 '1시간' 칸 대신 '안타 하나에' 또는 '공 하나에'를 넣는다
  const first = pr.rec?.items.find((it) => it.won !== null) || null
  const cells = [
    ['1경기', krw(b.game)],
    ['1이닝', krw(b.inning)],
    ['하루', krw(b.day)],
    first ? [first.approx ? `${first.label}(어림)` : first.label, krw(first.won)] : ['1시간', krw(b.hour)],
    ['1초', krw(b.second)],
    ['직장인 연봉 벌기', `${games}경기`],
  ]
  const headline = `직장인 평균 연봉(4,500만 원)을 ${games}경기 만에 벌어요`
  const changeText = change === null || player.approx ? '' : change === 0 ? '작년과 같은 연봉' : `작년보다 ${change > 0 ? '+' : ''}${Math.round(change * 1000) / 10}%`
  const sub = `${SEASON} ${team.full} ${player.pos}`

  await loadFonts([player.name, sub, pay, headline, changeText, ...cells.flat(), `${SEASON} 연봉 어림값 선수 이름으로 찾기 KBO·구단 발표 연봉 기준 계약금·옵션 제외 정규시즌 144경기, 경기당 9이닝, 1년 365일로 나눴어요 시간은 144경기·9이닝·365일, 기록은 정규시즌 기준 연봉 KBO·구단 발표, 기록 TVING 안타 하나에 공 하나에(어림) 홈런 타점 아웃 탈삼진 승리 세이브 홀드`])
  const [canvas, ctx] = makeCanvas()

  ctx.fillStyle = c.desk
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // 전광판
  const px = 70
  const py = 80
  const pw = CARD_W - 140
  const ph = 900
  ctx.save()
  ctx.shadowColor = c.shadow
  ctx.shadowBlur = 50
  ctx.shadowOffsetY = 22
  fillRound(ctx, px, py, pw, ph, 36, c.ink)
  ctx.restore()
  bulbs(ctx, px, py + 26, pw, c.seal)

  const ix = px + 56
  const iw = pw - 112
  ctx.globalAlpha = 0.72
  fitText(ctx, sub, ix, py + 104, iw, { size: 32, min: 22, weight: 500, color: c.onInk })
  ctx.globalAlpha = 1
  fitText(ctx, player.name, ix, py + 236, iw, { size: 132, min: 80, weight: 700, color: c.onInk })

  ctx.globalAlpha = 0.72
  const lw = text(ctx, `${SEASON} 연봉`, ix, py + 336, { size: 32, weight: 500, color: c.onInk })
  ctx.globalAlpha = 1
  fitText(ctx, pay, ix + lw + 24, py + 340, iw - lw - 24 - (player.approx ? 150 : 0), { size: 92, min: 56, weight: 700, color: c.onInk })
  if (player.approx) stamp(ctx, px + pw - 140, py + 320, c, { size: 30, label: '어림값', angle: -0.18 })

  // 시간 단위 칸 (3 × 2)
  const gx = ix
  const gy = py + 400
  const gap = 16
  const cw = (iw - gap * 2) / 3
  const chh = 200
  cells.forEach(([k, v], i) => {
    const x = gx + (i % 3) * (cw + gap)
    const y = gy + Math.floor(i / 3) * (chh + gap)
    const last = i === cells.length - 1
    ctx.save()
    ctx.globalAlpha = last ? 1 : 0.12
    fillRound(ctx, x, y, cw, chh, 18, last ? c.seal : c.paper)
    ctx.restore()
    ctx.globalAlpha = last ? 0.9 : 0.72
    fitText(ctx, k, x + 26, y + 58, cw - 52, { size: 28, min: 20, weight: 600, color: last ? c.onSeal : c.onInk })
    ctx.globalAlpha = 1
    fitText(ctx, v, x + 26, y + 150, cw - 52, { size: 54, min: 30, weight: 700, color: last ? c.onSeal : c.onInk })
  })

  // 전광판 아래 한 줄
  ctx.globalAlpha = 0.6
  text(ctx, first ? `시간은 144경기·9이닝·365일, 기록은 ${SEASON} 정규시즌 기준` : '정규시즌 144경기, 경기당 9이닝, 1년 365일로 나눴어요', ix, py + ph - 38, { size: 24, weight: 400, color: c.onInk })
  ctx.globalAlpha = 1

  // 요약
  const sy = py + ph + 96
  fitText(ctx, headline, px + 8, sy, pw - 16, { size: 42, min: 30, weight: 700, color: c.ink })
  if (changeText) {
    ctx.font = '700 28px "IBM Plex Sans KR", sans-serif'
    const tw = Math.min(pw, ctx.measureText(changeText).width + 52)
    fillRound(ctx, px + 8, sy + 30, tw, 56, 28, change > 0 ? c.sealTint : c.tint)
    fitText(ctx, changeText, px + 32, sy + 69, tw - 48, { size: 28, min: 20, weight: 700, color: change > 0 ? c.seal : c.muted })
  }

  footer(ctx, c, CARD_H - 104, '선수 이름으로 찾기', first ? ['연봉 KBO·구단 발표, 기록 TVING', '계약금·옵션 제외'] : ['KBO·구단 발표 연봉 기준', '계약금·옵션 제외'])
  return toBlob(canvas)
}
