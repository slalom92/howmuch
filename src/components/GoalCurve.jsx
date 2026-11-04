import { useEffect, useState } from 'react'
import { monthsToReach, subsAtMonth, subsLabel } from '../lib/goal.js'

// 구독자 성장 곡선 (세로축 로그 눈금)
// - 남색 실선: 평균 성장 곡선, 빨간 점: 지금 내 위치
// - 빨간 점선: 검색한 유튜버가 실제로 걸린 속도
// - 옅은 띠: 내 위치에서 그 유튜버 구독자까지 평균적으로 걸리는 구간
const SIZES = {
  wide: { W: 640, H: 300, PAD: { l: 52, r: 24, t: 28, b: 44 } },
  narrow: { W: 340, H: 270, PAD: { l: 38, r: 12, t: 26, b: 42 } },
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

function yearStep(maxYears, narrow) {
  const want = narrow ? 4 : 6
  for (const s of [1, 2, 5, 10, 20, 50, 100, 200, 500]) if (maxYears / s <= want) return s
  return 1000
}

export default function GoalCurve({ mySubs, targetSubs, ageMonths, channelTitle, avgLabel }) {
  const narrow = useNarrow()
  const { W, H, PAD } = SIZES[narrow ? 'narrow' : 'wide']

  const myM = monthsToReach(mySubs)
  const goalM = monthsToReach(targetSubs)
  const xMaxM = Math.max(goalM, ageMonths || 0, myM, 12) * 1.08
  const yTop = Math.ceil(Math.log10(Math.max(targetSubs, mySubs, 10)) + 0.15)
  const ln = (s) => Math.log10(Math.max(1, s))
  const sx = (m) => PAD.l + (m / xMaxM) * (W - PAD.l - PAD.r)
  const sy = (s) => H - PAD.b - (ln(s) / yTop) * (H - PAD.t - PAD.b)

  const N = 80
  const avgPath = Array.from({ length: N + 1 }, (_, i) => {
    const m = (xMaxM * i) / N
    return `${i ? 'L' : 'M'}${sx(m).toFixed(1)} ${sy(Math.min(subsAtMonth(m), 10 ** yTop)).toFixed(1)}`
  }).join('')

  // 그 유튜버 속도: 같은 곡선 모양을 가로로 늘이거나 줄여 (개설 후 경과 개월, 지금 구독자)에 맞춘다
  const k = ageMonths && goalM > 0 ? goalM / ageMonths : null
  const pacePath = k
    ? Array.from({ length: N + 1 }, (_, i) => {
        const m = (ageMonths * i) / N
        return `${i ? 'L' : 'M'}${sx(m).toFixed(1)} ${sy(subsAtMonth(m * k)).toFixed(1)}`
      }).join('')
    : null

  const yTicks = Array.from({ length: yTop + 1 }, (_, i) => 10 ** i).filter((v) => v >= 10 || v === 1)
  const maxYears = xMaxM / 12
  const step = yearStep(maxYears, narrow)
  const xTicks = []
  for (let y = 0; y <= maxYears; y += step) xTicks.push(y)

  const ahead = mySubs >= targetSubs
  const short = (t, n) => (t.length > n ? t.slice(0, n) + '…' : t)
  const nameMax = narrow ? 6 : 10
  // 이름표가 오른쪽 끝을 넘지 않게
  const paceTagX = ageMonths ? Math.min(sx(ageMonths), W - PAD.r - 4) : 0

  return (
    <figure className="goal-curve">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`구독자 성장 곡선. 지금 구독자 ${mySubs.toLocaleString('ko-KR')}명에서 ${channelTitle}의 구독자 ${targetSubs.toLocaleString('ko-KR')}명까지 평균 ${avgLabel}.`}
      >
        {/* 평균적으로 걸리는 구간 */}
        {!ahead && (
          <g>
            <rect x={sx(myM)} y={PAD.t} width={Math.max(2, sx(goalM) - sx(myM))} height={H - PAD.t - PAD.b} style={{ fill: 'var(--seal-tint)' }} />
            <text x={(sx(myM) + sx(goalM)) / 2} y={PAD.t - 8} textAnchor="middle" className="goal-curve__span">
              평균 {avgLabel}
            </text>
          </g>
        )}

        {/* 눈금 */}
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} strokeWidth={v === 1 ? 1.4 : 0.8} strokeDasharray={v === 1 ? undefined : '3 4'} style={{ stroke: 'var(--rule)' }} />
            <text x={PAD.l - 6} y={sy(v) + 4} textAnchor="end" className="curve__tick">
              {v === 1 ? '0' : subsLabel(v)}
            </text>
          </g>
        ))}
        {xTicks.map((y) => (
          <text key={y} x={sx(y * 12)} y={H - PAD.b + 18} textAnchor="middle" className="curve__tick">
            {y ? `${y.toLocaleString('ko-KR')}년` : '시작'}
          </text>
        ))}

        {/* 목표 구독자 가로선 */}
        <line x1={PAD.l} x2={W - PAD.r} y1={sy(targetSubs)} y2={sy(targetSubs)} strokeWidth="1" strokeDasharray="2 3" opacity="0.7" style={{ stroke: 'var(--seal)' }} />

        {/* 평균 곡선 */}
        <path d={avgPath} fill="none" strokeWidth="2.6" strokeLinejoin="round" style={{ stroke: 'var(--ink)' }} />

        {/* 그 유튜버 실제 속도 */}
        {pacePath && (
          <g>
            <path d={pacePath} fill="none" strokeWidth="2" strokeDasharray="7 5" style={{ stroke: 'var(--seal)' }} />
            <circle cx={sx(ageMonths)} cy={sy(targetSubs)} r="6" strokeWidth="2" style={{ fill: 'var(--seal)', stroke: 'var(--paper)' }} />
            <text x={paceTagX} y={sy(targetSubs) - 12} textAnchor={sx(ageMonths) > W * 0.7 ? 'end' : 'middle'} className="goal-curve__them">
              {short(channelTitle, nameMax)}
            </text>
          </g>
        )}
        {!pacePath && (
          <text x={W - PAD.r} y={sy(targetSubs) - 8} textAnchor="end" className="goal-curve__them">
            {short(channelTitle, nameMax)} {subsLabel(targetSubs)}
          </text>
        )}

        {/* 평균 곡선 위 목표 지점 */}
        {!ahead && <circle cx={sx(goalM)} cy={sy(targetSubs)} r="4.5" strokeWidth="2" style={{ fill: 'var(--paper)', stroke: 'var(--ink)' }} />}

        {/* 지금 나 */}
        <line x1={sx(myM)} x2={sx(myM)} y1={sy(mySubs)} y2={sy(1)} strokeWidth="1.2" style={{ stroke: 'var(--seal)' }} />
        <circle cx={sx(myM)} cy={sy(mySubs)} r="7" strokeWidth="2.5" style={{ fill: 'var(--seal)', stroke: 'var(--paper)' }} />
        <g transform={`translate(${Math.max(PAD.l + 22, sx(myM))} ${sy(mySubs)})`}>
          <rect x="-22" y="10" width="44" height="22" rx="4" style={{ fill: 'var(--ink)' }} />
          <text x="0" y="25" textAnchor="middle" className="curve__me curve__me--ink">
            나
          </text>
        </g>
      </svg>
      <figcaption>
        굵은 선은 구독자 수에 도달하기까지 걸리는 평균 기간{pacePath ? `, 빨간 점선은 채널 개설 후 ${channelTitle}의 실제 성장 속도` : ''}입니다. 세로축은 10배 간격입니다.
      </figcaption>
    </figure>
  )
}
