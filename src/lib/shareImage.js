// 결과 카드를 PNG 이미지로 그린다 (인스타그램·카카오톡에 올리기 좋은 1080×1350, 4:5)
// - 브라우저 캔버스에 직접 그려서 외부 라이브러리 없이 동작한다 (아이폰 Safari 포함).
// - 색은 지금 고른 테마의 CSS 변수를 그대로 읽는다.
// - 유튜버 프로필 사진은 YouTube 이미지 서버에서 그대로 불러와 자르기만 하고, 못 불러오면 첫 글자로 대신한다.
// - 이미지는 이용자 기기에서만 만들어지고 서버에 저장하지 않는다.

import { RPM, PERIODS, monthlyRevenue } from './calc.js'
import { won, count, ratioText } from './format.js'
import { COMPARE } from './compare.js'
import { roleOf, hash, ymd, employeeNo, companyLabel, waGwa } from './badge.js'

export const CARD_W = 1080
export const CARD_H = 1350
const SITE = 'donmeter.com'
const FONT = '"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif'
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
const PERIOD_TITLE = { day: '하루 예상 수익', week: '한 주 예상 수익', month: '한 달 예상 수익', year: '1년 예상 수익' }

// ---------------------------------------------------------------- 준비
function themeColors() {
  const cs = getComputedStyle(document.documentElement)
  const v = (k, d) => cs.getPropertyValue(`--${k}`).trim() || d
  return {
    desk: v('desk', '#e7ebf0'),
    paper: v('paper', '#ffffff'),
    tint: v('paper-tint', '#f4f6f9'),
    ink: v('ink', '#1a2238'),
    muted: v('muted', '#5f6880'),
    rule: v('rule', '#cfd6e0'),
    bar: v('bar', '#a7b0c0'),
    seal: v('seal', '#c2362b'),
    sealTint: v('seal-tint', '#fbeceb'),
    onInk: v('on-ink', '#ffffff'),
    onSeal: v('on-seal', '#ffffff'),
    shadow: `rgba(${v('shadow-rgb', '26, 34, 56')}, 0.28)`,
  }
}

// 웹 글꼴은 쓰는 글자만 그때그때 내려받으므로, 그릴 글자를 미리 불러 둔다
async function loadFonts(texts) {
  if (!document.fonts?.load) return
  const sample = [...new Set(texts.join('') + '0123456789,.·~원만억')].join('')
  try {
    await Promise.race([
      Promise.all([400, 500, 600, 700].map((w) => document.fonts.load(`${w} 40px "IBM Plex Sans KR"`, sample))),
      new Promise((r) => setTimeout(r, 3000)),
    ])
  } catch {
    /* 글꼴을 못 불러오면 기본 글꼴로 그린다 */
  }
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'
    const done = (ok) => resolve(ok ? img : null)
    img.onload = () => done(true)
    img.onerror = () => done(false)
    setTimeout(() => done(img.complete && img.naturalWidth > 0), 4000)
    img.src = src
  })
}

function makeCanvas() {
  const c = document.createElement('canvas')
  c.width = CARD_W
  c.height = CARD_H
  const ctx = c.getContext('2d')
  ctx.textBaseline = 'alphabetic'
  return [c, ctx]
}

function toBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지를 만들지 못했어요.'))), 'image/png')
    } catch (e) {
      reject(e)
    }
  })
}

// ---------------------------------------------------------------- 그리기 도구
const font = (size, weight = 400, family = FONT) => `${weight} ${size}px ${family}`

function text(ctx, str, x, y, { size = 32, weight = 400, color, align = 'left', family = FONT } = {}) {
  ctx.font = font(size, weight, family)
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(str, x, y)
  return ctx.measureText(str).width
}

// 너비에 맞게 글자 크기를 줄이고, 그래도 넘치면 말줄임
function fitText(ctx, str, x, y, maxW, { size, min = size * 0.6, weight = 700, color, align = 'left', family = FONT }) {
  let s = size
  ctx.font = font(s, weight, family)
  while (ctx.measureText(str).width > maxW && s > min) {
    s -= 2
    ctx.font = font(s, weight, family)
  }
  let out = str
  if (ctx.measureText(out).width > maxW) {
    const chars = [...str]
    while (chars.length > 1 && ctx.measureText(chars.join('') + '…').width > maxW) chars.pop()
    out = chars.join('') + '…'
  }
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(out, x, y)
  return s
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function fillRound(ctx, x, y, w, h, r, color) {
  roundRect(ctx, x, y, w, h, r)
  ctx.fillStyle = color
  ctx.fill()
}

function dashed(ctx, x1, y, x2, color, width = 3, dash = [12, 10]) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.setLineDash(dash)
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
  ctx.restore()
}

// 원 안에 사진 (정사각형으로 가운데 자르기). 사진이 없으면 첫 글자
function photo(ctx, img, title, cx, cy, size, c, { round = true, radius = 24 } = {}) {
  ctx.save()
  if (round) {
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
  } else {
    roundRect(ctx, cx - size / 2, cy - size / 2, size, size, radius)
  }
  ctx.clip()
  if (img) {
    const s = Math.min(img.naturalWidth, img.naturalHeight)
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, cx - size / 2, cy - size / 2, size, size)
  } else {
    ctx.fillStyle = c.muted
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size)
    text(ctx, [...title][0] || '?', cx, cy + size * 0.17, { size: size * 0.46, weight: 700, color: c.onInk, align: 'center' })
  }
  ctx.restore()
}

// 비스듬히 찍은 "추정" 도장
function stamp(ctx, cx, cy, c, { size = 46, label = '추정', angle = -0.2 } = {}) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.font = font(size, 700)
  const w = ctx.measureText(label).width + size * 0.9
  const h = size * 1.6
  ctx.globalAlpha = 0.9
  roundRect(ctx, -w / 2, -h / 2, w, h, size * 0.3)
  ctx.strokeStyle = c.seal
  ctx.lineWidth = size * 0.11
  ctx.stroke()
  roundRect(ctx, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, size * 0.2)
  ctx.lineWidth = size * 0.04
  ctx.stroke()
  text(ctx, label, 0, size * 0.36, { size, weight: 700, color: c.seal, align: 'center' })
  ctx.restore()
}

// 사이트 로고 (동그라미 안 원화 기호)
function brand(ctx, x, y, c, color = c.seal, textColor = c.ink, size = 40) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = size * 0.1
  ctx.beginPath()
  ctx.arc(x + size / 2, y - size * 0.36, size * 0.42, 0, Math.PI * 2)
  ctx.stroke()
  text(ctx, '₩', x + size / 2, y - size * 0.18, { size: size * 0.5, weight: 700, color, align: 'center' })
  ctx.restore()
  return size + 12 + text(ctx, '돈미터', x + size + 12, y - size * 0.18, { size: size * 0.78, weight: 700, color: textColor })
}

// 종이 위쪽 톱니 가장자리 (명세서를 뜯어낸 느낌)
function perforation(ctx, x, y, w, color) {
  ctx.save()
  ctx.fillStyle = color
  const r = 9
  for (let px = x + r * 2; px < x + w - r; px += r * 3.2) {
    ctx.beginPath()
    ctx.arc(px, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function footer(ctx, c, y, line1, line2) {
  brand(ctx, 90, y, c, c.seal, c.ink, 46)
  const w = text(ctx, SITE, 90, y + 48, { size: 30, weight: 700, color: c.ink })
  text(ctx, line1, 90 + w + 18, y + 48, { size: 26, weight: 500, color: c.muted })
  if (line2[0]) text(ctx, line2[0], CARD_W - 90, y - 6, { size: 21, color: c.muted, align: 'right' })
  text(ctx, line2[1], CARD_W - 90, y + 44, { size: 21, color: c.muted, align: 'right' })
}

// 받침이 있으면 '이', 없으면 '가'
function iGa(word) {
  const last = [...word.replace(/[\s)\]]+$/, '')].pop() || ''
  if (last < '가' || last > '힣') return `${word}이(가)`
  return word + ((last.charCodeAt(0) - 0xac00) % 28 ? '이' : '가')
}

// ---------------------------------------------------------------- 카드 1: 급여명세서
export async function drawPayslip({ channel, analysis, period = 'month', tier = 'mid' }) {
  const c = themeColors()
  const f = PERIODS[period].factor
  const total = monthlyRevenue(analysis, tier).total
  const amount = won(total * f)
  const low = won(monthlyRevenue(analysis, 'low').total * f)
  const high = won(monthlyRevenue(analysis, 'high').total * f)
  const avg = COMPARE.find((x) => x.id === 'avg')
  const ratio = total > 0 && total / avg.monthly < 0.01 ? '1% 미만' : ratioText(total, avg.monthly)
  const uploads = analysis.long.uploadsPerMonth + analysis.short.uploadsPerMonth
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  const facts = [
    channel.hiddenSubscribers ? '구독자 비공개' : `구독자 ${count(channel.subscribers)}명`,
    `월 업로드 ${uploads.toFixed(1)}편`,
  ].join('   ')
  const cmp1 = '한 달 수익은 직장인 평균 월급'
  const cmp2 = `(${won(avg.monthly)})의 `

  await loadFonts([channel.title, channel.handle || '', amount, low, high, ratio, facts, today, cmp1, cmp2, '유튜브 급여명세서 지급일 광고 단가 보수적 높게 기준 1년이면 약 유튜버 이름으로 검색해 보세요 공개 데이터로 계산한 추정치예요 실제 수익과 다를 수 있어요 프로필 사진 YouTube'])
  const img = await loadImage(channel.thumbnail)
  const [canvas, ctx] = makeCanvas()

  // 바탕과 종이
  ctx.fillStyle = c.desk
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  const px = 60, py = 56, pw = CARD_W - 120, ph = 1060
  ctx.save()
  ctx.shadowColor = c.shadow
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 18
  fillRound(ctx, px, py, pw, ph, 26, c.paper)
  ctx.restore()

  // 머리띠
  ctx.save()
  roundRect(ctx, px, py, pw, ph, 26)
  ctx.clip()
  ctx.fillStyle = c.ink
  ctx.fillRect(px, py, pw, 132)
  ctx.restore()
  perforation(ctx, px, py + 132, pw, c.paper)
  text(ctx, '유튜브 급여명세서', px + 48, py + 82, { size: 44, weight: 700, color: c.onInk })
  text(ctx, `${today} 조회`, px + pw - 48, py + 80, { size: 26, weight: 500, color: c.onInk, align: 'right' })

  // 누구
  const avY = py + 270
  photo(ctx, img, channel.title, px + 48 + 84, avY, 168, c)
  ctx.strokeStyle = c.rule
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(px + 48 + 84, avY, 86, 0, Math.PI * 2)
  ctx.stroke()
  const nx = px + 48 + 168 + 36
  const nw = px + pw - 48 - nx
  fitText(ctx, channel.title, nx, avY - 14, nw, { size: 64, min: 40, weight: 700, color: c.ink })
  if (channel.handle) fitText(ctx, channel.handle, nx, avY + 34, nw, { size: 30, min: 22, weight: 500, color: c.muted })
  text(ctx, facts, nx, avY + (channel.handle ? 82 : 40), { size: 28, weight: 500, color: c.ink })

  dashed(ctx, px + 48, py + 420, px + pw - 48, c.bar)

  // 금액
  text(ctx, PERIOD_TITLE[period], px + 48, py + 500, { size: 38, weight: 600, color: c.muted })
  const amtSize = fitText(ctx, amount, px + 44, py + 650, pw - 300, { size: 150, min: 90, weight: 700, color: c.ink })
  ctx.font = font(amtSize, 700)
  const amtW = Math.min(ctx.measureText(amount).width, pw - 300)
  stamp(ctx, px + 44 + amtW + 110, py + 585, c, { size: 44 })
  text(ctx, `보수적 ${low} ~ 높게 ${high}`, px + 48, py + 712, { size: 30, weight: 500, color: c.muted })
  text(ctx, `광고 단가 '${RPM[tier].label}' 기준`, px + pw - 48, py + 712, { size: 26, color: c.muted, align: 'right' })

  // 비교
  const bx = px + 48, by = py + 770, bw = pw - 96, bh = 200
  fillRound(ctx, bx, by, bw, bh, 20, c.tint)
  text(ctx, cmp1, bx + 40, by + 78, { size: 36, weight: 500, color: c.ink })
  const w2 = text(ctx, cmp2, bx + 40, by + 140, { size: 36, weight: 500, color: c.ink })
  text(ctx, ratio, bx + 40 + w2, by + 142, { size: 54, weight: 700, color: c.seal })
  if (period !== 'year') {
    text(ctx, '1년이면 약', bx + bw - 40, by + 78, { size: 28, weight: 500, color: c.muted, align: 'right' })
    text(ctx, won(total * 12), bx + bw - 40, by + 140, { size: 44, weight: 700, color: c.ink, align: 'right' })
  }

  // 종이 아래 안내
  text(ctx, '공개 데이터로 계산한 추정치예요. 실제 수익과 다를 수 있어요.', px + 48, py + ph - 40, { size: 24, color: c.muted })

  footer(ctx, c, CARD_H - 104, '유튜버 이름으로 검색해 보세요', img ? ['프로필 사진 · YouTube', '광고 수익만 계산 (협찬·후원 제외)'] : ['', '광고 수익만 계산 (협찬·후원 제외)'])
  return toBlob(canvas)
}

// ---------------------------------------------------------------- 카드 2: 가상 사원증
export async function drawBadge({ channel, company, place }) {
  const c = themeColors()
  const { name: companyName, initial } = companyLabel(company)
  const role = roleOf(place)
  const empNo = employeeNo(channel)
  const opened = channel.createdAt ? `${ymd(channel.createdAt)} 유튜브 채널` : ''
  const headlineOf = (t, cut = false) => `${t}${cut ? '…' : ''}${iGa(t).slice(t.length)} ${companyName}에 다닌다면`
  const headline = headlineOf(channel.title)
  const note = `재미로 만든 가상 카드 · ${waGwa(companyName)} 관련 없음`

  await loadFonts([channel.title, companyName, initial, role.grade, role.title, role.years, empNo, opened, headline, note, '가상 사원증 소속 유튜브콘텐츠사업부 연차 사번 개설 사진 YouTube 추정 내 회사로 계산해 보기'])
  const img = await loadImage(channel.thumbnail)
  const [canvas, ctx] = makeCanvas()

  ctx.fillStyle = c.desk
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  // 위쪽 제목
  {
    // 너무 길면 채널 이름 쪽을 줄여서 회사 이름은 남긴다
    let s = 46
    let line = headline
    ctx.font = font(s, 700)
    while (ctx.measureText(line).width > CARD_W - 160 && s > 34) ctx.font = font((s -= 2), 700)
    const chars = [...channel.title]
    while (ctx.measureText(line).width > CARD_W - 160 && chars.length > 2) {
      chars.pop()
      line = headlineOf(chars.join('').trimEnd(), true)
    }
    text(ctx, line, CARD_W / 2, 92, { size: s, weight: 700, color: c.ink, align: 'center' })
  }

  // 목걸이 줄
  const cx = CARD_W / 2
  const bw = 600, bh = 960, bx = cx - bw / 2, by = 184
  const headH = 150
  ctx.save()
  ctx.strokeStyle = c.seal
  ctx.lineWidth = 34
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - 210, 122)
  ctx.lineTo(cx - 34, by + 6)
  ctx.moveTo(cx + 210, 122)
  ctx.lineTo(cx + 34, by + 6)
  ctx.stroke()
  ctx.restore()

  // 카드
  ctx.save()
  ctx.shadowColor = c.shadow
  ctx.shadowBlur = 50
  ctx.shadowOffsetY = 24
  fillRound(ctx, bx, by, bw, bh, 40, c.paper)
  ctx.restore()
  ctx.save()
  roundRect(ctx, bx, by, bw, bh, 40)
  ctx.clip()

  // 워터마크
  ctx.save()
  ctx.translate(cx, by + bh / 2)
  ctx.rotate(-0.42)
  ctx.globalAlpha = 0.045
  for (let i = -6; i <= 6; i++) text(ctx, '가상 사원증  가상 사원증  가상 사원증', 0, i * 96, { size: 44, weight: 700, color: c.ink, align: 'center' })
  ctx.restore()

  // 머리 띠
  ctx.fillStyle = c.ink
  ctx.fillRect(bx, by, bw, headH)
  ctx.restore()

  // 집게
  fillRound(ctx, cx - 56, by - 30, 112, 64, 14, c.tint)
  ctx.strokeStyle = c.ink
  ctx.lineWidth = 6
  roundRect(ctx, cx - 56, by - 30, 112, 64, 14)
  ctx.stroke()

  // 회사
  fillRound(ctx, bx + 44, by + 56, 76, 76, 18, c.seal)
  text(ctx, initial, bx + 82, by + 110, { size: 44, weight: 700, color: c.onSeal, align: 'center' })
  fitText(ctx, companyName, bx + 140, by + 96, bw - 190, { size: 40, min: 26, weight: 700, color: c.onInk })
  text(ctx, '가상 사원증', bx + 140, by + 132, { size: 24, weight: 600, color: c.onInk })

  // 사진
  const ps = 236
  const pcy = by + headH + 36 + ps / 2
  photo(ctx, img, channel.title, cx, pcy, ps, c, { round: false, radius: 28 })
  ctx.strokeStyle = c.rule
  ctx.lineWidth = 4
  roundRect(ctx, cx - ps / 2, pcy - ps / 2, ps, ps, 28)
  ctx.stroke()
  if (img) text(ctx, '사진 · YouTube', cx, pcy + ps / 2 + 30, { size: 20, color: c.muted, align: 'center' })

  // 이름과 직책
  let y = pcy + ps / 2 + 92
  fitText(ctx, channel.title, cx, y, bw - 80, { size: 52, min: 32, weight: 700, color: c.ink, align: 'center' })
  y += 68
  ctx.font = font(34, 700)
  const gw = ctx.measureText(role.grade).width + 44
  ctx.font = font(34, 600)
  const tw = ctx.measureText(role.title).width + 44
  const rx = cx - (gw + 14 + tw) / 2
  fillRound(ctx, rx, y - 42, gw, 58, 29, c.seal)
  text(ctx, role.grade, rx + gw / 2, y, { size: 34, weight: 700, color: c.onSeal, align: 'center' })
  ctx.strokeStyle = c.ink
  ctx.lineWidth = 3
  roundRect(ctx, rx + gw + 14, y - 42, tw, 58, 29)
  ctx.stroke()
  text(ctx, role.title, rx + gw + 14 + tw / 2, y, { size: 34, weight: 600, color: c.ink, align: 'center' })

  // 정보 표
  y += 40
  const rows = [
    ['소속', '유튜브콘텐츠사업부'],
    ['연차', role.years],
    ['사번', empNo, true],
    ...(opened ? [['개설', opened]] : []),
  ]
  for (const [k, v, mono] of rows) {
    dashed(ctx, bx + 50, y, bx + bw - 50, c.rule, 2, [6, 6])
    y += 38
    text(ctx, k, bx + 56, y, { size: 26, weight: 600, color: c.muted })
    fitText(ctx, v, bx + bw - 56, y, bw - 220, { size: 26, min: 18, weight: 500, color: c.ink, align: 'right', family: mono ? MONO : FONT })
    y += 16
  }

  // 바코드와 도장
  let h = hash(channel.id)
  let x = bx + 56
  const barY = by + bh - 92
  ctx.fillStyle = c.ink
  while (x < bx + 56 + 280) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
    const w = 3 + (h % 3) * 2
    ctx.fillRect(x, barY, w, 46)
    x += w + 3 + ((h >>> 4) % 3) * 2
  }
  stamp(ctx, bx + bw - 120, barY + 24, c, { size: 34, angle: -0.25 })

  // 아래 안내
  text(ctx, note, cx, by + bh + 44, { size: 24, color: c.muted, align: 'center' })
  footer(ctx, c, CARD_H - 96, '내 회사로 바꿔 계산해 보세요', img ? ['프로필 사진 · YouTube', '실제 사원증·신분증으로 쓸 수 없어요'] : ['', '실제 사원증·신분증으로 쓸 수 없어요'])
  return toBlob(canvas)
}

// 다른 계산기의 공유 카드(예: 프로야구 선수 연봉 전광판)에서 같은 그리기 도구를 쓴다
export { themeColors, loadFonts, makeCanvas, toBlob, text, fitText, roundRect, fillRound, dashed, stamp, brand, footer }
