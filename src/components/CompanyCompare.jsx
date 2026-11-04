import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { loadCorps, searchCorps, loadCompany, loadBenchmarks } from '../lib/company.js'
import { placeInCompany } from '../lib/career.js'
import { monthlyRevenue } from '../lib/calc.js'
import { SIZE_AVG, INDUSTRIES } from '../lib/benchmarks.js'
import { won } from '../lib/format.js'
import { track } from '../lib/analytics.js'
import CareerCurve from './CareerCurve.jsx'
import EmployeeBadge from './EmployeeBadge.jsx'

const SIZES = ['대기업', '중견', '중소']

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
              가상 인사발령
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
            출처: {company.source}. 직급별 연봉은 회사 평균 연봉과 근속연수에 일반적인 승진 시점과 직급별 연봉 차이를 적용한 추정치로, 실제 회사의 연봉 테이블과 다릅니다.
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
        </section>
      )}
    </section>
  )
}
