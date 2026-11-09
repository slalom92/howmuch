// 여자골프 선수 시즌 상금을 스코어카드 모양 PNG(1080×1350, 4:5)로 그린다.
// 그리기 도구와 테마 색은 유튜버 카드(lib/shareImage.js)와 같은 것을 쓴다. 이미지는 이용자 기기에서만 만든다.
import { CARD_W, CARD_H, themeColors, loadFonts, makeCanvas, toBlob, text, fitText, fillRound, footer } from '../../lib/shareImage.js'

// 금액 쓰기 (KlpgaApp 의 krw 와 같은 규칙)
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
  if (v >= 1e4 && v < 1e6) {
    const chun = Math.round(v / 1e3)
    const man = Math.floor(chun / 10)
    return `${man}만${chun % 10 ? ` ${chun % 10}천` : ''} 원`
  }
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString('ko-KR')}만 원`
  return `${Math.round(v).toLocaleString('ko-KR')}원`
}

// 카드 위쪽: 그린 위 깃발과 홀컵
function flag(ctx, x, y, c) {
  ctx.save()
  ctx.strokeStyle = c.onInk
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y + 64)
  ctx.lineTo(x, y)
  ctx.stroke()
  ctx.fillStyle = c.seal
  ctx.beginPath()
  ctx.moveTo(x + 2, y)
  ctx.lineTo(x + 44, y + 13)
  ctx.lineTo(x + 2, y + 26)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 0.35
  ctx.fillStyle = c.onInk
  ctx.beginPath()
  ctx.ellipse(x, y + 66, 18, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export async function drawScorecard(pr) {
  const { T, player, b, perEvent, perStroke, workerYears, rank } = pr
  const { SEASON, TOUR_DAYS } = T
  const c = themeColors()
  const prize = `${player.rounded ? '약 ' : ''}${krw(b.year)}`
  const years = workerYears < 10 ? Math.round(workerYears * 10) / 10 : Math.round(workerYears)
  // 출전 대회 수를 알면 '대회 하나에'와 '1타에'(72타 × 라운드 수)를 넣는다
  const cells = perEvent
    ? [
        ['대회 하나에', krw(perEvent)],
        [`1타에 (${T.PAR}타×${T.ROUNDS}R)`, krw(perStroke)],
        [`투어 하루 (${TOUR_DAYS}일)`, krw(b.tourDay)],
        ['하루', krw(b.day)],
        ['1초', krw(b.second)],
        ['직장인 연봉', `${years}년 치`],
      ]
    : [
        ['한 달', krw(b.month)],
        [`투어 하루 (${TOUR_DAYS}일)`, krw(b.tourDay)],
        ['하루', krw(b.day)],
        ['1시간', krw(b.hour)],
        ['1초', krw(b.second)],
        ['직장인 연봉', `${years}년 치`],
      ]
  const headline = `직장인 평균 연봉(4,500만 원) ${years}년 치를 한 시즌에 벌었어요`
  const note = perEvent
    ? `1타는 한 대회 ${T.PAR}타 × ${T.ROUNDS}라운드로, 하루·1초는 365일로 나눴어요`
    : '투어 하루는 개막전~최종전 날짜, 하루·1초는 365일로 나눴어요'
  const dollars = player.usd ? `${player.rounded ? '약 ' : ''}$${player.usd.toLocaleString('en-US')}` : ''
  const tags = [dollars, player.wins ? `${player.wins}승` : '', ...player.titles].filter(Boolean).join(' · ')
  const sub = `${SEASON} ${T.text.org} 투어 · ${player.team} · 상금 ${rank}위`

  await loadFonts([player.name, sub, prize, headline, note, tags, ...cells.flat(), `${SEASON} 상금 선수 이름으로 찾기 언론 보도 시즌 최종 상금 후원 계약금 제외 투어 하루는 개막전~최종전 날짜, 하루·1초는 365일로 나눴어요 승 상금왕 대상 신인상 다승왕 최저타수상 제네시스 KPGA KLPGA PGA 페덱스컵 우승 한국 선수 최초 1천만 달러 약 $0123456789, ${T.text.card}`])
  const [canvas, ctx] = makeCanvas()

  ctx.fillStyle = c.desk
  ctx.fillRect(0, 0, CARD_W, CARD_H)

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

  const ix = px + 56
  const iw = pw - 112
  flag(ctx, px + pw - 110, py + 52, c)

  ctx.globalAlpha = 0.72
  fitText(ctx, sub, ix, py + 96, iw - 120, { size: 30, min: 20, weight: 500, color: c.onInk })
  ctx.globalAlpha = 1
  fitText(ctx, player.name, ix, py + 228, iw - 120, { size: 132, min: 80, weight: 700, color: c.onInk })

  ctx.globalAlpha = 0.72
  const lw = text(ctx, `${SEASON} 상금`, ix, py + 330, { size: 32, weight: 500, color: c.onInk })
  ctx.globalAlpha = 1
  fitText(ctx, prize, ix + lw + 24, py + 334, iw - lw - 24, { size: 88, min: 54, weight: 700, color: c.onInk })

  // 스코어카드 칸 (3 × 2)
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
    fitText(ctx, k, x + 26, y + 58, cw - 52, { size: 28, min: 18, weight: 600, color: last ? c.onSeal : c.onInk })
    ctx.globalAlpha = 1
    fitText(ctx, v, x + 26, y + 150, cw - 52, { size: 54, min: 28, weight: 700, color: last ? c.onSeal : c.onInk })
  })

  ctx.globalAlpha = 0.6
  fitText(ctx, note, ix, py + ph - 38, iw, { size: 24, min: 18, weight: 400, color: c.onInk })
  ctx.globalAlpha = 1

  const sy = py + ph + 96
  fitText(ctx, headline, px + 8, sy, pw - 16, { size: 40, min: 28, weight: 700, color: c.ink })
  if (tags) {
    ctx.font = '700 28px "IBM Plex Sans KR", sans-serif'
    const tw = Math.min(pw, ctx.measureText(tags).width + 52)
    fillRound(ctx, px + 8, sy + 30, tw, 56, 28, c.sealTint)
    fitText(ctx, tags, px + 32, sy + 69, tw - 48, { size: 28, min: 20, weight: 700, color: c.seal })
  }

  footer(ctx, c, CARD_H - 104, '선수 이름으로 찾기', [T.text.card, '후원 계약금 제외'])
  return toBlob(canvas)
}
