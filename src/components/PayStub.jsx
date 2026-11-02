import Avatar from './Avatar.jsx'
import { RPM, PERIODS, monthlyRevenue, overallAvgViews } from '../lib/calc.js'
import { won, count } from '../lib/format.js'

const TODAY = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
const PERIOD_TITLE ={ day: '하루 예상 수익', week: '한 주 예상 수익', month: '한 달 예상 수익', year: '1년 예상 수익' }

function Segmented({ name, value, options, onChange }) {
  return (
    <div className="seg" role="radiogroup" aria-label={name}>
      {options.map(([k, label]) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={value === k}
          className={`seg__opt${value === k ? ' is-on' : ''}`}
          onClick={() => onChange(k)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function PayStub({ channel, analysis, period, setPeriod, tier, setTier }) {
  const f = PERIODS[period].factor
  const rev = monthlyRevenue(analysis, tier)
  const low = monthlyRevenue(analysis, 'low').total * f
  const high = monthlyRevenue(analysis, 'high').total * f
  const r = RPM[tier]
  const { long, short } = analysis

  const rows = []
  if (long.count > 0)
    rows.push({
      name: '롱폼 광고 수익',
      basis: `평균 ${count(long.avgViews)}회 × 월 ${long.uploadsPerMonth.toFixed(1)}편 × 1,000회당 ${r.long.toLocaleString('ko-KR')}원`,
      amount: rev.long * f,
    })
  if (short.count > 0)
    rows.push({
      name: '쇼츠 수익 배분',
      basis: `평균 ${count(short.avgViews)}회 × 월 ${short.uploadsPerMonth.toFixed(1)}편 × 1,000회당 ${r.short.toLocaleString('ko-KR')}원`,
      amount: rev.short * f,
    })

  const warnings = []
  if (analysis.sampleSize < 5) warnings.push('최근 영상이 적어 추정이 부정확할 수 있습니다.')
  if (analysis.lastUploadDays != null && analysis.lastUploadDays > 60)
    warnings.push(`마지막 업로드가 ${analysis.lastUploadDays}일 전이라 새 영상 수익이 거의 잡히지 않습니다.`)

  return (
    <article className="stub" aria-labelledby="stub-title">
      <header className="stub__head">
        <div className="stub__doc">
          <p className="stub__kind" id="stub-title">
            유튜브 급여명세서
          </p>
          <p className="stub__date">{TODAY} 조회</p>
        </div>
        <div className="stub__who">
          <Avatar channel={channel} size={52} />
          <div>
            <h2 className="stub__name">{channel.title}</h2>
            {channel.handle && <p className="stub__handle">{channel.handle}</p>}
          </div>
        </div>
        <dl className="stub__facts">
          <div>
            <dt>구독자</dt>
            <dd>{channel.hiddenSubscribers ? '비공개' : `${count(channel.subscribers)}명`}</dd>
          </div>
          <div>
            <dt>최근 영상 평균 조회수</dt>
            <dd>{count(overallAvgViews(analysis))}회</dd>
          </div>
          <div>
            <dt>업로드</dt>
            <dd>월 {(long.uploadsPerMonth + short.uploadsPerMonth).toFixed(1)}편</dd>
          </div>
          <div>
            <dt>전체 영상</dt>
            <dd>{channel.videoCount.toLocaleString('ko-KR')}개</dd>
          </div>
        </dl>
      </header>

      <div className="stub__controls">
        <Segmented
          name="기간"
          value={period}
          onChange={setPeriod}
          options={Object.entries(PERIODS).map(([k, v]) => [k, v.label])}
        />
        <div className="stub__rpm">
          <span aria-hidden="true">광고 단가</span>
          <Segmented
            name="광고 단가 가정"
            value={tier}
            onChange={setTier}
            options={Object.entries(RPM).map(([k, v]) => [k, v.label])}
          />
        </div>
      </div>

      <table className="stub__table">
        <thead>
          <tr>
            <th scope="col">지급 항목</th>
            <th scope="col" className="col-basis">
              산출 근거
            </th>
            <th scope="col" className="num">
              금액
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.name}>
                <th scope="row">
                  {row.name}
                  <span className="basis-mobile">{row.basis}</span>
                </th>
                <td className="col-basis">{row.basis}</td>
                <td className="num">{won(row.amount)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="stub__empty">
                최근 공개 영상이 없어 수익을 계산할 수 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="stub__total">
        <div>
          <p className="stub__total-label">{PERIOD_TITLE[period]}</p>
          <p className="stub__range">
            보수적 {won(low)} ~ 높게 {won(high)}
          </p>
        </div>
        <p className="stub__total-amount">
          {won(rev.total * f)}
          <span className="seal" aria-hidden="true">
            추정
          </span>
        </p>
      </div>

      {warnings.length > 0 && (
        <ul className="stub__warn">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </article>
  )
}
