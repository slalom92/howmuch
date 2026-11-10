import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { loadCorps, searchCorps, loadCompany, loadBenchmarks } from '../lib/company.js'
import { placeInCompany } from '../lib/career.js'
import { monthlyRevenue } from '../lib/calc.js'
import { SIZE_AVG, INDUSTRIES } from '../lib/benchmarks.js'
import { won } from '../lib/format.js'
import { track } from '../lib/analytics.js'
import CareerCurve from './CareerCurve.jsx'
import EmployeeBadge from './EmployeeBadge.jsx'
import ImageShare from './ImageShare.jsx'
import SourceTag from './SourceTag.jsx'

const SIZES = ['대기업', '중견', '중소']

// 버튼 한 번으로 고르는 상장사 (code 는 전자공시 DART 고유번호). 비교 화면이 열릴 때마다 4곳을 무작위로 보여 준다.
const PICKS = [
  { code: '00126380', name: '삼성전자' },
  { code: '00164779', name: 'SK하이닉스' },
  { code: '00164742', name: '현대자동차' },
  { code: '00106641', name: '기아' },
  { code: '00266961', name: 'NAVER' },
  { code: '00258801', name: '카카오' },
  { code: '00401731', name: 'LG전자' },
  { code: '00413046', name: '셀트리온' },
  { code: '00877059', name: '삼성바이오로직스' },
  { code: '00356361', name: 'LG화학' },
  { code: '00126362', name: '삼성SDI' },
  { code: '00164788', name: '현대모비스' },
  { code: '00159193', name: '한국전력공사' },
  { code: '00190321', name: 'KT' },
  { code: '00159023', name: 'SK텔레콤' },
  { code: '00113526', name: '대한항공' },
  { code: '00635134', name: 'CJ제일제당' },
  { code: '01204056', name: '하이브' },
  { code: '00261443', name: '엔씨소프트' },
  { code: '00760971', name: '크래프톤' },
  { code: '00583424', name: '아모레퍼시픽' },
  { code: '01515323', name: 'LG에너지솔루션' },
  { code: '00126566', name: '한화에어로스페이스' },
  { code: '00872984', name: '이마트' },
  { code: '00108241', name: '농심' },
  { code: '01238169', name: '오리온' },
  { code: '00904672', name: '넷마블' },
  { code: '01133217', name: '카카오뱅크' },
  { code: '00105873', name: 'LG디스플레이' },
  { code: '00126371', name: '삼성전기' },
  { code: '00126186', name: '삼성에스디에스' },
  { code: '00164645', name: 'HMM' },
  { code: '00138279', name: 'S-Oil' },
  { code: '01390344', name: 'HD현대중공업' },
]

// 목록에서 n곳을 무작위로 (except 에 있던 회사는 되도록 빼고)
function sample(n, except = []) {
  const skip = new Set(except.map((c) => c.code))
  const pool = PICKS.filter((c) => !skip.has(c.code))
  const src = pool.length >= n ? pool : PICKS
  const a = [...src]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

function CompanyPicks({ onPick, disabled, current }) {
  const [list, setList] = useState(() => sample(4))
  return (
    <p className="search__examples co-picks">
      <span id="co-picks-label">이런 회사는 어때요?</span>
      {list.map((c) => (
        <button
          key={c.code}
          type="button"
          className="chip"
          aria-describedby="co-picks-label"
          aria-pressed={current === c.code}
          disabled={disabled}
          onClick={() => onPick(c)}
        >
          {c.name}
        </button>
      ))}
      <button type="button" className="linkish co-picks__more" disabled={disabled} onClick={() => setList((l) => sample(4, l))}>
        다른 회사
      </button>
    </p>
  )
}

function CompanySearch({ onPick, disabled }) {
  const id = useId()
  const [q, setQ] = useState('')
  const [corps, setCorps] = useState(null)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const results = useMemo(() => (corps ? searchCorps(corps, q) : []), [corps, q])

  const ensure = () => {
    if (corps || err) return
    loadCorps()
      .then(setCorps)
      .catch((e) => setErr(e.message))
  }

  const pick = (c) => {
    setQ(c.name)
    setOpen(false)
    onPick(c)
  }

  const onKey = (e) => {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(results[active])
    } else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="co-search">
      <label htmlFor={id} className="sr-only">
        회사 이름
      </label>
      <input
        id={id}
        className="co-search__input"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={`${id}-list`}
        aria-activedescendant={open && results[active] ? `${id}-${active}` : undefined}
        aria-autocomplete="list"
        placeholder="회사 이름 (상장사)"
        value={q}
        disabled={disabled}
        autoComplete="off"
        onFocus={() => {
          ensure()
          setOpen(true)
        }}
        onChange={(e) => {
          ensure()
          setQ(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKey}
      />
      {open && q && (
        <ul id={`${id}-list`} role="listbox" className="co-search__list">
          {!corps && !err && <li className="co-search__empty">회사 목록을 불러오는 중입니다.</li>}
          {err && <li className="co-search__empty">{err}</li>}
          {corps && !results.length && <li className="co-search__empty">상장사 중에 없는 이름입니다. 아래에서 회사 규모로 비교해 보세요.</li>}
          {results.map((c, i) => (
            <li
              key={c.code}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`co-search__item${i === active ? ' is-active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(c)
              }}
              onMouseEnter={() => setActive(i)}
            >
              {c.name}
              <span className="co-search__code">{c.stock}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ManualPick({ onPick }) {
  const [size, setSize] = useState('중소')
  const [industry, setIndustry] = useState('')
  const [bench, setBench] = useState(null)

  useEffect(() => {
    loadBenchmarks()
      .then(setBench)
      .catch(() => setBench(null))
  }, [])

  const apply = () => {
    const ind = industry && bench?.industry?.[industry]
    const monthly = ind || (bench?.size?.[size] || SIZE_AVG[size]).monthly
    onPick({
      manual: true,
      name: ind ? `${INDUSTRIES[industry]} 평균` : (bench?.size?.[size] || SIZE_AVG[size]).label,
      size,
      avgSalary: monthly * 12,
      avgTenure: null,
      source: ind ? bench.industrySource : '국가데이터처·CEO스코어 규모별 평균 임금',
    })
  }

  return (
    <div className="manual">
      <div className="manual__row">
        <span className="manual__label" id="size-label">
          회사 규모
        </span>
        <div className="seg" role="radiogroup" aria-labelledby="size-label">
          {SIZES.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={size === s} className={`seg__opt${size === s ? ' is-on' : ''}`} onClick={() => setSize(s)}>
              {s === '중견' ? '중견기업' : s === '대기업' ? '대기업' : '중소기업'}
            </button>
          ))}
        </div>
      </div>
      <div className="manual__row">
        <label className="manual__label" htmlFor="industry">
          업종 (선택)
        </label>
        <select id="industry" className="manual__select" value={industry} onChange={(e) => setIndustry(e.target.value)}>
          <option value="">업종 평균은 쓰지 않음</option>
          {Object.entries(INDUSTRIES).map(([k, v]) => (
            <option key={k} value={k} disabled={bench && !bench.industry?.[k]}>
              {v}
              {bench && !bench.industry?.[k] ? ' (통계 없음)' : ''}
            </option>
          ))}
        </select>
      </div>
      <button type="button" className="manual__apply" onClick={apply}>
        이 기준으로 비교
      </button>
    </div>
  )
}

export default function CompanyCompare({ channel, analysis, tier, company, setCompany }) {
  const [status, setStatus] = useState(company ? 'done' : 'idle')
  const [error, setError] = useState('')
  const [manual, setManual] = useState(false)
  const cardRef = useRef(null)

  const annual = monthlyRevenue(analysis, tier).total * 12
  const result = useMemo(() => (company?.avgSalary ? placeInCompany(company, annual) : null), [company, annual])

  useEffect(() => {
    if (result && company) {
      track('compare_company', { company_name: company.name, placement: result.place.text, source: company.manual ? 'manual' : 'dart' })
    }
    // 회사가 바뀔 때만 기록
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.code, company?.name])

  const pickCorp = async (c) => {
    setStatus('loading')
    setError('')
    try {
      const data = await loadCompany(c.code)
      setCompany(data)
      setStatus('done')
      requestAnimationFrame(() => cardRef.current?.focus())
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }

  const pickManual = (data) => {
    setCompany(data)
    setStatus('done')
    requestAnimationFrame(() => cardRef.current?.focus())
  }

  // 사다리에 유튜버 위치 끼워 넣기 (연봉 오름차순)
  const rows = result
    ? [...result.ladder, { me: true, rank: channel.title, salary: annual }].sort((a, b) => a.salary - b.salary)
    : []

  return (
    <section className="hire" aria-labelledby="hire-title">
      <h2 id="hire-title" className="hire__title">
        우리 회사에 다닌다면?
      </h2>
      <p className="hire__lede">회사 이름을 넣으면 그 회사 연봉으로 {channel.title}의 직급과 연차를 맞춰 봅니다.</p>

      <CompanySearch onPick={pickCorp} disabled={status === 'loading'} />
      <CompanyPicks onPick={pickCorp} disabled={status === 'loading'} current={company?.code} />
      <button type="button" className="linkish" aria-expanded={manual} onClick={() => setManual((m) => !m)}>
        {manual ? '회사 규모 비교 닫기' : '목록에 없나요? 회사 규모로 비교하기'}
      </button>
      {manual && <ManualPick onPick={pickManual} />}

      <div aria-live="polite">
        {status === 'loading' && <p className="notice">전자공시에서 회사의 최근 사업보고서를 불러오는 중입니다.</p>}
        {status === 'error' && <p className="notice notice--error">{error}</p>}
      </div>

      {status !== 'loading' && company && result && (
        <article className="order" ref={cardRef} tabIndex={-1} aria-labelledby="order-title">
          <header className="order__head">
            <p className="order__kind" id="order-title">
              가상 인사발령 <SourceTag />
            </p>
            <p className="order__org">{company.name}</p>
          </header>

          <dl className="order__main">
            <div>
              <dt>성명</dt>
              <dd>{channel.title}</dd>
            </div>
            <div>
              <dt>발령</dt>
              <dd className="order__rank">
                {result.place.text}
                <span className="seal seal--small" aria-hidden="true">
                  추정
                </span>
              </dd>
            </div>
            {result.place.sub && (
              <div>
                <dt>연차</dt>
                <dd>{result.place.sub}</dd>
              </div>
            )}
            <div>
              <dt>연봉 환산</dt>
              <dd>{won(annual)}</dd>
            </div>
          </dl>

          <CareerCurve curve={result.curve} annual={annual} place={result.place} channelTitle={channel.title} companyName={company.stockName || company.name} />

          <table className="ladder">
            <caption>{company.name} 직급별 추정 연봉</caption>
            <thead>
              <tr>
                <th scope="col">직급</th>
                <th scope="col">시작 연차</th>
                <th scope="col" className="num">
                  연봉
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.rank} className={r.me ? 'is-me' : r.exec ? 'is-exec' : ''}>
                  <th scope="row">{r.me ? `${r.rank} (유튜브)` : r.rank}</th>
                  <td>{r.me ? '' : r.fromYear ? `${r.fromYear}년차~` : '공시 평균'}</td>
                  <td className="num">{won(r.salary)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="order__facts">
            <li>
              회사 평균 연봉 <strong>{won(company.avgSalary)}</strong>
            </li>
            {company.avgTenure ? (
              <li>
                평균 근속 <strong>{company.avgTenure}년</strong>
              </li>
            ) : (
              <li>평균 근속 정보가 없어 {result.tenureUsed}년으로 가정</li>
            )}
            {company.employees ? (
              <li>
                직원 <strong>{company.employees.toLocaleString('ko-KR')}명</strong>
              </li>
            ) : null}
          </ul>
          <p className="order__note">
            출처: {company.source}. 유튜버 수익과 직급은 돈미터가 계산한 추정치로 Google·YouTube가 발표하거나 승인한 수치가 아닙니다. 직급별 연봉은 회사 평균 연봉과 근속연수에 일반적인 승진 시점과 직급별 연봉 차이를 적용한 추정치로, 실제 회사의 연봉 테이블과 다릅니다.
          </p>
        </article>
      )}

      {status !== 'loading' && company && result && (
        <section className="badge-section" aria-labelledby="badge-title">
          <h3 className="badge-section__title" id="badge-title">
            사원증도 나왔어요
          </h3>
          <p className="badge-section__lede">{channel.title}의 {company.stockName || company.name} 가상 사원증이에요.</p>
          <EmployeeBadge channel={channel} company={company} place={result.place} />
          <ImageShare variant="badge" channel={channel} company={company} place={result.place} />
        </section>
      )}
    </section>
  )
}
