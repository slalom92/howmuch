import SourceTag from './SourceTag.jsx'
import { COMPARE, COMPARE_SOURCES } from '../lib/compare.js'
import { PERIODS, monthlyRevenue } from '../lib/calc.js'
import { won, ratioText } from '../lib/format.js'
import { IconVideo, IconClock, IconShop, IconPerson, IconTower } from './Art.jsx'

const ICONS = { me: IconVideo, min: IconClock, sme: IconShop, avg: IconPerson, big: IconTower }

const PERIOD_WORD = { day: '하루', week: '한 주', month: '한 달', year: '1년' }

export default function CompareChart({ channel, analysis, period, tier }) {
  const f = PERIODS[period].factor
  const mid = monthlyRevenue(analysis, tier).total * f
  const low = monthlyRevenue(analysis, 'low').total * f
  const high = monthlyRevenue(analysis, 'high').total * f

  const rows = [
    { id: 'me', label: channel.title, value: mid, low, high, me: true },
    ...COMPARE.map((c) => ({ id: c.id, label: c.label, note: c.note, value: c.monthly * f })),
  ].sort((a, b) => b.value - a.value)

  const max = Math.max(...rows.map((r) => r.high ?? r.value), 1)
  const pct = (v) => `${Math.max(0.6, (v / max) * 100)}%`
  const avg = COMPARE.find((c) => c.id === 'avg').monthly * f

  return (
    <section className="compare" aria-labelledby="compare-title">
      <h2 id="compare-title" className="compare__title">
        직장인 평균의 <strong>{ratioText(mid, avg)}</strong>
      </h2>
      <p className="compare__sub">
        <SourceTag /> {PERIOD_WORD[period]} 기준으로 비교했습니다. 유튜버 수익은 돈미터 추정치, 직장인 소득은 공식 통계의 세전 월급을 같은 기간으로 환산한 값입니다.
      </p>

      <ol className="bars">
        {rows.map((r) => (
          <li key={r.id} className={`bars__row${r.me ? ' is-me' : ''}`}>
            <span className="bars__label">
              {(() => {
                const I = ICONS[r.id]
                return I ? <I /> : null
              })()}
              <span className="bars__name">{r.label}</span>
              {r.note && <span className="bars__note">{r.note}</span>}
            </span>
            <span className="bars__track">
              {r.me && (
                <span
                  className="bars__range"
                  style={{ left: pct(r.low), width: `calc(${pct(r.high)} - ${pct(r.low)})` }}
                  title={`보수적 ${won(r.low)} ~ 높게 ${won(r.high)}`}
                />
              )}
              <span className="bars__fill" style={{ width: pct(r.value) }} />
            </span>
            <span className="bars__value">{won(r.value)}</span>
          </li>
        ))}
      </ol>
      <p className="compare__legend">
        <span className="legend-range" aria-hidden="true" /> 채널 막대 뒤 옅은 구간은 광고 단가를 보수적~높게 잡았을 때의 범위입니다.
      </p>
      <ul className="sources">
        {COMPARE_SOURCES.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </section>
  )
}
