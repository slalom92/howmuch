// 연봉 모아 집 사기 (/apt/): 연봉·기간·면적·지역을 고르면, 한 푼도 안 쓰고 모았을 때 살 수 있는 서울 아파트를 실거래가로 보여 준다
import { useEffect, useMemo, useRef, useState } from 'react'
import AdSlot from '../../components/AdSlot.jsx'
import ShareBar from '../../components/ShareBar.jsx'
import { BrandMark } from '../../components/Art.jsx'
import { useGrowOnView, CountUp } from '../../components/Motion.jsx'
import SiteMenu from '../../components/SiteMenu.jsx'
import FloatingSwitch from '../../components/FloatingSwitch.jsx'
import { track } from '../../lib/analytics.js'
import { FOOTER_MENU, MENU, APT, YOUTUBER, KBO, KLPGA } from '../../lib/menu.js'
import { DATA, SALARIES, YEARS, AREAS, BASES, SOURCES, calculate, fromSearch, toSearch } from './apt.js'
import AptGuide from './AptGuide.jsx'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

const APT_ITEMS = MENU.slice(0, 9)
const APT_MENU = [
  { href: YOUTUBER, label: '유튜버 수익 계산기' },
  { href: APT, label: '연봉 모아 집 사기' },
  { href: KBO, label: '프로야구 선수 연봉' },
  { href: KLPGA, label: '골프 선수 상금' },
]

const PAGE = 12

// 원 → "7억 8,234만 원", "3,912만 원"
export function man(v) {
  const m = Math.round(v / 1e4)
  const eok = Math.floor(m / 1e4)
  const rest = m % 1e4
  if (!eok) return `${rest.toLocaleString('ko-KR')}만 원`
  return rest ? `${eok}억 ${rest.toLocaleString('ko-KR')}만 원` : `${eok}억 원`
}

// 18.3 → "18년 4개월"
export function yearsText(y) {
  const months = Math.ceil(y * 12)
  const yy = Math.floor(months / 12)
  const mm = months % 12
  if (!yy) return `${mm}개월`
  return mm ? `${yy}년 ${mm}개월` : `${yy}년`
}

const ym = (s) => (s ? s.replace('-', '.') : '')

function Choices({ legend, name, options, value, onChange }) {
  return (
    <fieldset className="apt-q">
      <legend className="apt-q__legend">{legend}</legend>
      <div className="apt-q__opts">
        {options.map((o) => {
          const on = String(value) === String(o.id)
          return (
            <label key={o.id} className={`apt-opt${on ? ' is-on' : ''}`}>
              <input type="radio" className="sr-only" name={name} value={o.id} checked={on} onChange={() => onChange(o.id)} />
              {o.label}
              {o.note && <small>{o.note}</small>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

// 적금 통장: 1년에 모으는 돈 × 기간 = 모인 돈
function Passbook({ r }) {
  const { state: s, salary, yearly, budget, fits, pool } = r
  const area = AREAS.find((a) => a.id === s.a)
  const where = s.gu === 'all' ? DATA.region : `${DATA.region} ${s.gu}`
  return (
    <div className="apt-book">
      <p className="apt-book__bank" aria-hidden="true">
        돈미터 내집마련 통장
      </p>
      <dl className="apt-book__rows">
        <div>
          <dt>1년에 모으는 돈</dt>
          <dd>
            {man(yearly)}
            <small>{s.b === 'net' ? `연봉 ${salary.label} 원의 실수령액` : `세전 연봉 그대로`}</small>
          </dd>
        </div>
        <div>
          <dt>모으는 기간</dt>
          <dd>{s.y}년, 한 푼도 안 쓰고</dd>
        </div>
        <div className="apt-book__total">
          <dt>모인 돈</dt>
          <dd>
            <CountUp value={budget} format={man} />
          </dd>
        </div>
      </dl>
      <p className="apt-book__result">
        {pool.length && !fits.length ? (
          <>
            {where} 전용 {area.label} 아파트 {pool.length.toLocaleString('ko-KR')}곳 중 아직 살 수 있는 곳이 없어요.
          </>
        ) : pool.length ? (
          <>
            {where} 전용 {area.label} 아파트 <strong>{pool.length.toLocaleString('ko-KR')}곳</strong> 중{' '}
            <strong className="apt-book__count">{fits.length.toLocaleString('ko-KR')}곳</strong>을 살 수 있어요 ({Math.max(1, Math.round((fits.length / pool.length) * 100))}%).
          </>
        ) : (
          <>
            {where}에는 최근 1년 동안 전용 {area.label} 거래가 있는 아파트가 없어요.
          </>
        )}
      </p>
    </div>
  )
}

// 몇 년 모으면 몇 곳? (막대가 화면에 들어오면 자란다)
function Ladder({ r }) {
  const growRef = useGrowOnView()
  const max = Math.max(1, r.pool.length)
  if (!r.pool.length) return null
  return (
    <section className="kbo-card" aria-labelledby="apt-ladder">
      <h2 className="kbo-card__title" id="apt-ladder">
        몇 년 모으면 몇 곳?
      </h2>
      <ul className="apt-ladder" ref={growRef}>
        {r.ladder.map((l, i) => (
          <li key={l.years} className={l.years === r.state.y ? 'is-me' : undefined} style={{ '--i': i }}>
            <span className="apt-ladder__label">{l.years}년</span>
            <span className="apt-ladder__track" aria-hidden="true">
              <span className="apt-ladder__fill" style={{ width: `${Math.max(0.8, (l.count / max) * 100)}%` }} />
            </span>
            <span className="apt-ladder__value">
              {l.count.toLocaleString('ko-KR')}곳 <em>{Math.round((l.count / max) * 100)}%</em>
            </span>
          </li>
        ))}
      </ul>
      <p className="kbo-card__note">
        {DATA.region}
        {r.state.gu === 'all' ? '' : ` ${r.state.gu}`}에서 최근 1년 동안 전용 {r.state.a}㎡ 거래가 있었던 아파트 {r.pool.length.toLocaleString('ko-KR')}곳 기준이에요.
      </p>
    </section>
  )
}

// 부동산 유리창에 붙은 매물표처럼
function Listing({ a, r }) {
  const d = a[r.state.a]
  const y = r.yearsFor(a)
  return (
    <li className="apt-card">
      <p className="apt-card__where">
        {a.gu} {a.dong}
        {a.built ? ` · ${a.built}년 준공` : ''}
      </p>
      <h3 className="apt-card__name">{a.name}</h3>
      <p className="apt-card__price">
        <span className="apt-card__tag">매매</span>
        {man(d.price)}
      </p>
      <p className="apt-card__years">
        <strong>{yearsText(y)}</strong> 모으면 살 수 있어요
      </p>
      <p className="apt-card__meta">
        전용 {r.state.a}㎡ 거래 {d.n}건의 중간값 · 최근 {ym(d.last)}
        {d.n < 3 && <span className="apt-card__few">거래 적음</span>}
      </p>
    </li>
  )
}

function Window({ r }) {
  const [shown, setShown] = useState(PAGE)
  const key = `${r.state.pay}-${r.state.y}-${r.state.a}-${r.state.gu}-${r.state.b}`
  useEffect(() => setShown(PAGE), [key])
  if (!r.pool.length) return null
  if (!r.fits.length) {
    const c = r.cheapest
    return (
      <section className="apt-window" aria-labelledby="apt-window-title">
        <h2 className="apt-window__title" id="apt-window-title">
          아직 살 수 있는 곳이 없어요
        </h2>
        <p className="apt-window__lede">
          가장 싼 곳도 <strong>{yearsText(r.yearsFor(c))}</strong> 모아야 해요. 기간을 늘리거나 면적, 지역을 바꿔 보세요.
        </p>
        <ul className="apt-cards">
          <Listing a={c} r={r} />
        </ul>
      </section>
    )
  }
  return (
    <section className="apt-window" aria-labelledby="apt-window-title">
      <h2 className="apt-window__title" id="apt-window-title">
        모은 돈으로 살 수 있는 가장 비싼 곳부터
      </h2>
      <p className="apt-window__lede">
        {man(r.budget)} 안에서 최근 1년 거래가(중간값)가 높은 순서예요.
      </p>
      <ul className="apt-cards">
        {r.fits.slice(0, shown).map((a) => (
          <Listing key={a.id} a={a} r={r} />
        ))}
      </ul>
      {shown < r.fits.length && (
        <button
          type="button"
          className="apt-more"
          onClick={() => {
            setShown((n) => n + PAGE)
            track('apt_more', { shown })
          }}
        >
          {Math.min(PAGE, r.fits.length - shown)}곳 더 보기 <span>({shown.toLocaleString('ko-KR')} / {r.fits.length.toLocaleString('ko-KR')})</span>
        </button>
      )}
    </section>
  )
}

export default function AptApp({ initialSearch = '' }) {
  const [state, setState] = useState(() => fromSearch(typeof window === 'undefined' ? initialSearch : window.location.search))
  const r = useMemo(() => calculate(state), [state])
  const set = (k) => (v) => {
    setState((s) => ({ ...s, [k]: v }))
    track('apt_pick', { [k]: v })
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    url.search = toSearch(r.state)
    if (url.href !== window.location.href) window.history.replaceState(null, '', url)
  }, [r.state])

  useEffect(() => {
    const onPop = () => setState(fromSearch(window.location.search))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const share = useMemo(() => {
    if (typeof window === 'undefined') return null
    const url = new URL(APT, window.location.origin)
    url.search = toSearch(r.state)
    const where = r.state.gu === 'all' ? DATA.region : `${DATA.region} ${r.state.gu}`
    return {
      url: url.toString(),
      text: `연봉 ${r.salary.label} 원, ${r.state.y}년 모으면 ${where} ${r.state.a}㎡ 아파트 ${r.fits.length.toLocaleString('ko-KR')}곳 | 돈미터`,
    }
  }, [r])

  const empty = !DATA.apts.length

  // 통장(결과)을 지나 아래로 내려간 뒤에만 다른 계산기 바로가기를 띄운다 (고르는 칸을 가리지 않게)
  const resultRef = useRef(null)
  const [pastResult, setPastResult] = useState(false)
  useEffect(() => {
    const el = resultRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setPastResult(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="page">
      <header className="masthead">
        <a className="brand" href="/">
          <BrandMark />
          돈미터
        </a>
        <nav className="topnav" aria-label="주요 메뉴">
          <SiteMenu current={APT} items={APT_ITEMS} links={APT_MENU} />
          <button type="button" className="theme-pick__toggle" data-theme-toggle aria-expanded="false" aria-controls="theme-menu" aria-label="화면 색 바꾸기">
            <span className="theme-pick__dot" aria-hidden="true" />
            테마
          </button>
        </nav>
      </header>

      <AdSlot variant="top" slot={SLOTS.top} />

      <main className="main">
        <section className="hero apt-hero">
          <div className="hero__text">
            <h1 className="hero__title">연봉 모아 집 사기</h1>
            <p className="hero__lede">
              연봉과 모으는 기간만 고르면, 한 푼도 안 쓰고 모았을 때 살 수 있는 {DATA.region} 아파트를 국토교통부 실거래가로 찾아 드려요.
            </p>
          </div>
        </section>

        <form className="apt-form" onSubmit={(e) => e.preventDefault()} aria-label="연봉과 모으는 조건">
          <Choices legend="연봉 (세전)" name="pay" options={SALARIES} value={state.pay} onChange={set('pay')} />
          <Choices legend="몇 년 모을까요?" name="y" options={YEARS.map((y) => ({ id: y, label: `${y}년` }))} value={state.y} onChange={(v) => set('y')(Number(v))} />
          <Choices legend="아파트 크기 (전용면적)" name="a" options={AREAS} value={state.a} onChange={set('a')} />
          <div className="apt-form__row">
            <Choices legend="1년에 모으는 돈" name="b" options={BASES} value={state.b} onChange={set('b')} />
            <div className="apt-q">
              <label className="apt-q__legend" htmlFor="apt-gu">
                지역
              </label>
              <select id="apt-gu" className="apt-select" value={state.gu} onChange={(e) => set('gu')(e.target.value)}>
                <option value="all">{DATA.region} 전체</option>
                {DATA.gu.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {empty ? (
          <p className="apt-empty" role="status">
            아파트 실거래 자료를 아직 만들지 않았어요. <code>npm run apt</code> 로 자료를 만든 뒤 다시 빌드해 주세요.
          </p>
        ) : (
          <div className="apt-result">
            <div ref={resultRef} aria-live="polite">
              <Passbook r={r} />
            </div>
            <Ladder r={r} />
            <Window r={r} />
          </div>
        )}

        {share && !empty && <ShareBar url={share.url} text={share.text} sub="링크를 받은 사람도 같은 조건의 결과를 보고, 자기 연봉으로 바꿔 볼 수 있어요." />}

        <AdSlot variant="inline" slot={SLOTS.inline} />

        <AptGuide />
      </main>

      <footer className="footer">
        <ul className="footer__links">
          {FOOTER_MENU.map((m) => (
            <li key={m.href}>
              <a href={m.href}>{m.label}</a>
            </li>
          ))}
        </ul>
        <p>
          아파트 가격은 {SOURCES.molit.label.replace('공공데이터포털, ', '')}를 돈미터가 단지별로 정리한 참고 자료예요. 실제 매물 가격, 대출, 세금은 들어 있지 않아요.
        </p>
      </footer>

      <FloatingSwitch current={APT} hidden={!pastResult} />
      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}

