import { useEffect, useState } from 'react'
import { won } from '../lib/format.js'

// 연차별 추정 연봉 곡선 + 유튜버 연수익 가로선
// 가로축: 입사 연차, 세로축: 연봉. 직급 구간은 옅은 띠로 나눈다.
// 좁은 화면에서는 좌표계 자체를 작게 잡아 글자가 줄어들지 않게 한다.
const SIZES = {
  wide: { W: 640, H: 280, PAD: { l: 64, r: 20, t: 24, b: 50 }, tag: 168, name: 8 },
  narrow: { W: 340, H: 250, PAD: { l: 40, r: 8, t: 22, b: 46 }, tag: 132, name: 5 },
}
const NARROW = '(max-width: 600px)'

function useNarrow() {
  const [n, setN] = useState(() => window.matchMedia(NARROW).matches)
  useEffect(() => {
    const mq = window.matchMedia(NARROW)
    const on = () => setN(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return n
}

function niceStep(max) {
  const raw = max / 4
  const p = 10 ** Math.floor(Math.log10(raw))
  const n = raw / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

function axisWon(v) {
  if (v >= 1e8) return `${(v / 1e8).toFixed(v % 1e8 ? 1 : 0)}억`
  return `${Math.round(v / 1e4).toLocaleString('ko-KR')}만`
}

export default function CareerCurve({ curve, annual, place, channelTitle, companyName }) {
  const narrow = useNarrow()
  const { W, H, PAD, tag, name } = SIZES[narrow ? 'narrow' : 'wide']
  const xMax = Math.ceil(curve.exec + 1)
  const top = curve.points[curve.points.length - 1][1]
  // 유튜버 선이 너무 높으면 그래프 위로 빼고 화살표로 표시한다
  const yMaxRaw = annual <= top * 1.6 ? Math.max(top, annual) * 1.12 : top * 1.25
  const step = niceStep(yMaxRaw)
  const yMax = Math.ceil(yMaxRaw / step) * step
  const sx = (y) => PAD.l + (y / xMax) * (W - PAD.l - PAD.r)
  const sy = (v) => H - PAD.b - (v / yMax) * (H - PAD.t - PAD.b)

  const pts = [...curve.points, [xMax, top]]
  const line = pts.map(([y, v], i) => `${i ? 'L' : 'M'}${sx(y).toFixed(1)} ${sy(v).toFixed(1)}`).join('')
  const area = `${line}L${sx(xMax)} ${sy(0)}L${sx(0)} ${sy(0)}Z`

  const above = annual > yMax
  const below = place.kind === 'below'
  const lineY = above ? PAD.t - 2 : sy(annual)
  // 곡선과 만나는 연차
  let meet = null
  if (place.kind === 'staff') {
    for (let i = 1; i < curve.points.length; i++) {
      const [y0, v0] = curve.points[i - 1]
      const [y1, v1] = curve.points[i]
      if (annual >= v0 && annual <= v1) {
        meet = y0 + ((y1 - y0) * (annual - v0)) / (v1 - v0)
        break
      }
    }
  }

  const labelLeft = !above && (meet == null ? place.kind !== 'below' && annual < top : sx(meet) > W / 2)

  const yTicks = []
  for (let v = 0; v <= yMax + 1; v += step) yTicks.push(v)
  const xTicks = (narrow ? [0, 10, 20] : [0, 5, 10, 15, 20]).filter((x) => x <= xMax)

  return (
    <figure className="curve">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${companyName} 연차별 추정 연봉 곡선과 ${channelTitle}의 연 수익 비교. ${place.text}.`}>
        {/* 직급 띠 */}
        {curve.ranks.map((r, i) => (
          <g key={r.rank}>
            <rect x={sx(r.from)} y={PAD.t} width={sx(r.to) - sx(r.from)} height={H - PAD.t - PAD.b} style={{ fill: i % 2 ? 'var(--paper-tint)' : 'var(--paper)' }} />
            {sx(r.to) - sx(r.from) > (narrow ? 22 : 30) && (
              <text x={(sx(r.from) + sx(r.to)) / 2} y={H - PAD.b + 36} textAnchor="middle" className="curve__rank">
                {r.rank}
              </text>
            )}
          </g>
        ))}
        <rect x={sx(curve.exec)} y={PAD.t} width={sx(xMax) - sx(curve.exec)} height={H - PAD.t - PAD.b} opacity="0.7" style={{ fill: 'var(--seal-tint)' }} />
        <text x={(sx(curve.exec) + sx(xMax)) / 2} y={H - PAD.b + 36} textAnchor="middle" className="curve__rank">
          임원
        </text>

        {/* 눈금 */}
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} strokeWidth={v ? 0.8 : 1.4} strokeDasharray={v ? '3 4' : undefined} style={{ stroke: 'var(--rule)' }} />
            <text x={PAD.l - 8} y={sy(v) + 4} textAnchor="end" className="curve__tick">
              {v ? axisWon(v) : '0'}
            </text>
          </g>
        ))}
        {xTicks.map((x) => (
          <text key={x} x={sx(x)} y={H - PAD.b + 17} textAnchor="middle" className="curve__tick">
            {x ? `${x}년` : '입사'}
          </text>
        ))}

        {/* 연봉 곡선 */}
        <path d={area} opacity="0.05" style={{ fill: 'var(--ink)' }} />
        <path d={line} fill="none" strokeWidth="2.6" strokeLinejoin="round" style={{ stroke: 'var(--ink)' }} />
        {curve.points.slice(0, -1).map(([y, v]) => (
          <circle key={y} cx={sx(y)} cy={sy(v)} r="3.2" strokeWidth="1.8" style={{ fill: 'var(--paper)', stroke: 'var(--ink)' }} />
        ))}

        {/* 평균 근속 표시 */}
        <line x1={sx(curve.tenure)} x2={sx(curve.tenure)} y1={sy(0)} y2={PAD.t} strokeWidth="1" strokeDasharray="2 3" style={{ stroke: 'var(--bar)' }} />
        <text x={sx(curve.tenure) + 4} y={PAD.t + 12} className="curve__tick">
          {narrow ? '평균' : '평균 근속'}
        </text>

        {/* 유튜버 연수익 */}
        <line x1={PAD.l} x2={W - PAD.r} y1={lineY} y2={lineY} strokeWidth="2" strokeDasharray="7 5" style={{ stroke: 'var(--seal)' }} />
        {/* 이름표는 곡선과 겹치지 않게: 만나는 점이 오른쪽이면 왼쪽 끝에, 아니면 오른쪽 끝에 */}
        <g transform={`translate(${labelLeft ? PAD.l + tag + 6 : W - PAD.r} ${lineY})`}>
          <rect x={-tag} y={above ? 4 : -28} width={tag} height="22" rx="4" style={{ fill: 'var(--seal)' }} />
          <text x={-tag / 2} y={above ? 19 : -13} textAnchor="middle" className="curve__me">
            {above ? '▲ ' : ''}
            {channelTitle.length > name ? channelTitle.slice(0, name) + '…' : channelTitle} {won(annual)}
          </text>
        </g>
        {meet != null && (
          <g>
            <line x1={sx(meet)} x2={sx(meet)} y1={sy(annual)} y2={sy(0)} strokeWidth="1.2" style={{ stroke: 'var(--seal)' }} />
            <circle cx={sx(meet)} cy={sy(annual)} r="7" strokeWidth="2.5" style={{ fill: 'var(--seal)', stroke: 'var(--paper)' }} />
          </g>
        )}
        {below && <circle cx={sx(0)} cy={sy(annual)} r="6" strokeWidth="2" style={{ fill: 'var(--seal)', stroke: 'var(--paper)' }} />}
      </svg>
      <figcaption>
        굵은 선은 {companyName}의 연차별 추정 연봉, 빨간 점선은 {channelTitle}의 연 수익입니다.
      </figcaption>
    </figure>
  )
}
