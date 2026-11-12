// 자차 계산기 (/car/): 연봉과 차를 고르면 내 연봉에 맞는 차인지, 3년 타면 얼마가 사라지는지 보여 준다
import { useEffect, useMemo, useRef, useState } from 'react'
import AdSlot, { AdRails } from '../../components/AdSlot.jsx'
import ShareBar from '../../components/ShareBar.jsx'
import { BrandMark } from '../../components/Art.jsx'
import { CountUp } from '../../components/Motion.jsx'
import SiteMenu from '../../components/SiteMenu.jsx'
import FooterLinks from '../../components/FooterLinks.jsx'
import FloatingSwitch from '../../components/FloatingSwitch.jsx'
import SocialLinks from '../../components/Social.jsx'
import { track } from '../../lib/analytics.js'
import Sting from '../../components/Sting.jsx'
import StingHero from '../../components/StingHero.jsx'
import { rememberPay, readPay, wonText, workText, pctText } from '../../lib/sting.js'
import { CAR } from '../../lib/menu.js'
import { SALARIES, CARS, KINDS, CAR_RATIO, USED_AS_OF, calculate, fromSearch, toSearch, carName, manText } from './car.js'
import { carPageStings, carPageHero } from './sting.js'
import CarGuide from './CarGuide.jsx'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  rail: import.meta.env.VITE_AD_SLOT_RAIL || import.meta.env.VITE_AD_SLOT_TOP,
  mid: import.meta.env.VITE_AD_SLOT_MID || import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

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

// 차 고르기: 국산차 / 수입차 탭 + 차 칩
function CarPicker({ value, onChange }) {
  const current = CARS.find((c) => c.id === value)
  const [kind, setKind] = useState(current?.kind || 'kr')
  useEffect(() => {
    if (current && current.kind !== kind) setKind(current.kind)
    // 다른 곳(목록 카드)에서 차를 바꾸면 탭도 따라간다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  const list = CARS.filter((c) => c.kind === kind)
  return (
    <fieldset className="apt-q cr-pick">
      <legend className="apt-q__legend">차 (2023년식)</legend>
      <div className="cr-tabs" role="tablist" aria-label="국산차, 수입차">
        {KINDS.map((k) => (
          <button key={k.id} type="button" role="tab" aria-selected={kind === k.id} className={`cr-tab${kind === k.id ? ' is-on' : ''}`} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <div className="apt-q__opts">
        {list.map((c) => {
          const on = c.id === value
          return (
            <label key={c.id} className={`apt-opt${on ? ' is-on' : ''}`}>
              <input type="radio" className="sr-only" name="car" value={c.id} checked={on} onChange={() => onChange(c.id)} />
              {c.model}
            </label>
          )
        })}
      </div>
      {current && (
        <p className="cr-pick__trim">
          {carName(current)} {current.gen && `(${current.gen})`} {current.trim}
        </p>
      )}
    </fieldset>
  )
}

// 내 연봉에 맞아? 차값과 연봉 절반 한도를 한 막대에
function Verdict({ r }) {
  const max = Math.max(r.judge, r.budget) * 1.08
  const by = r.judgeBy === 'new' ? '2023년 신차 가격' : '지금 중고 시세 (신차 가격 자료 없음)'
  return (
    <section className={`kbo-card cr-verdict${r.ok ? ' is-ok' : ' is-over'}`} aria-labelledby="cr-verdict-title">
      <p className="cr-verdict__kicker" id="cr-verdict-title">
        연봉 {r.salary.label} 원에 {r.car.model}, 맞아?
      </p>
      <p className="cr-verdict__main">{r.ok ? '연봉 절반 안이에요' : '연봉 절반을 넘어요'}</p>
      <p className="cr-verdict__sub">
        차값은 연봉의 <strong>{pctText(r.ratio)}</strong>
        {r.ok ? (
          <>, 한도까지 {manText(Math.round((r.budget - r.judge) / 10000))} 남아요</>
        ) : (
          <>
            . 맞추려면 연봉 <strong>{wonText(r.needPay)}</strong>
          </>
        )}
      </p>
      <div className="cr-meter" aria-hidden="true">
        <span className="cr-meter__bar" style={{ width: `${(r.judge / max) * 100}%` }} />
        <span className="cr-meter__line" style={{ left: `${(r.budget / max) * 100}%` }} />
      </div>
      <dl className="cr-verdict__grid">
        <div>
          <dt>차값</dt>
          <dd>{wonText(r.judge)}</dd>
        </div>
        <div>
          <dt>연봉 절반 한도</dt>
          <dd>{wonText(r.budget)}</dd>
        </div>
      </dl>
      <p className="cr-note">
        {by} 기준이에요. 기준: 차값은 세전 연봉의 {Math.round(CAR_RATIO * 100)}% 이내.
      </p>
    </section>
  )
}

// 3년 타면 사라진 돈: 신차 가격 → 지금 중고 시세
function Loss({ r }) {
  if (!r.lost) {
    return (
      <section className="kbo-card cr-loss" aria-labelledby="cr-loss-title">
        <h2 className="kbo-card__title" id="cr-loss-title">
          지금 중고 시세
        </h2>
        <p className="cr-loss__main">
          <strong>{wonText(r.used)}</strong>
        </p>
        <p className="cr-note">이 차는 2023년 신차 가격 자료를 찾지 못해 사라진 돈은 계산하지 않았어요. 3년 된 중고로 사도 {workText(r.usedHours)} 일해야 해요.</p>
      </section>
    )
  }
  return (
    <section className="kbo-card cr-loss" aria-labelledby="cr-loss-title">
      <h2 className="kbo-card__title" id="cr-loss-title">
        3년 타면 사라진 돈
      </h2>
      <p className="cr-loss__main">
        <strong>
          <CountUp value={r.lost} format={wonText} />
        </strong>
      </p>
      <div className="cr-bars" aria-hidden="true">
        <div className="cr-bars__row">
          <span>2023년 새 차</span>
          <span className="cr-bars__track">
            <span className="cr-bars__fill is-new" style={{ width: '100%' }} />
          </span>
          <b>{manText(r.car.newPrice)}</b>
        </div>
        <div className="cr-bars__row">
          <span>지금 중고</span>
          <span className="cr-bars__track">
            <span className="cr-bars__fill" style={{ width: `${r.keep * 100}%` }} />
          </span>
          <b>{manText(r.car.used)}</b>
        </div>
      </div>
      <dl className="cr-verdict__grid">
        <div>
          <dt>남은 가치</dt>
          <dd>{pctText(r.keep)}</dd>
        </div>
        <div>
          <dt>내 월급으로</dt>
          <dd>{r.lostMonths.toFixed(1).replace(/\.0$/, '')}달 치</dd>
        </div>
        <div>
          <dt>출근해야</dt>
          <dd>{Math.round(r.lostHours / 8).toLocaleString('ko-KR')}일</dd>
        </div>
      </dl>
      <p className="cr-note">
        중고 시세는 엔카 {USED_AS_OF.replace('-', '년 ')}월 기준(2023년식, 6만km, 무사고)이에요. 세금과 유지비는 빠져 있어요.
        {r.car.newNote && ` 신차 가격: ${r.car.newNote}.`}
      </p>
    </section>
  )
}

// 연봉 절반으로 탈 수 있는 차
function Fits({ r, onPick }) {
  const card = (c, mode) => (
    <li key={c.id}>
      <button type="button" className={`cr-fit${c.id === r.car.id ? ' is-on' : ''}`} onClick={() => onPick(c.id)} aria-pressed={c.id === r.car.id}>
        <span className="cr-fit__name">{c.model}</span>
        <span className="cr-fit__price">{manText(mode === 'new' ? c.newPrice : c.used)}</span>
      </button>
    </li>
  )
  return (
    <section className="kbo-card cr-fits" aria-labelledby="cr-fits-title">
      <h2 className="kbo-card__title" id="cr-fits-title">
        연봉 {r.salary.label} 원이면 탈 수 있는 차
      </h2>
      <p className="cr-note">연봉 절반, {wonText(r.budget)} 안에 들어오는 차예요. 누르면 위에서 바로 비교해요.</p>
      <h3 className="cr-fits__head">새 차로 ({r.fitsNew.length}대)</h3>
      {r.fitsNew.length ? <ul className="cr-fits__list">{r.fitsNew.map((c) => card(c, 'new'))}</ul> : <p className="cr-note">새 차로는 아직 한 대도 없어요.</p>}
      {r.fitsUsed.length > 0 && (
        <>
          <h3 className="cr-fits__head">3년 된 중고로 ({r.fitsUsed.length}대)</h3>
          <ul className="cr-fits__list">{r.fitsUsed.map((c) => card(c, 'used'))}</ul>
        </>
      )}
      {r.over > 0 && <p className="cr-note">나머지 {r.over}대는 중고로도 연봉 절반을 넘어요.</p>}
    </section>
  )
}

export default function CarApp({ initialSearch = '' }) {
  const [state, setState] = useState(() => fromSearch(typeof window === 'undefined' ? initialSearch : window.location.search))
  const r = useMemo(() => calculate(state), [state])
  const set = (k) => (v) => {
    setState((s) => ({ ...s, [k]: v }))
    if (k === 'pay') rememberPay(v)
    track('car_pick', { [k]: v })
  }

  // 주소에 연봉이 없으면 다른 계산기에서 고른 연봉을 이어 쓴다
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('pay')) return
    const pay = readPay()
    if (pay !== state.pay) setState((s) => ({ ...s, pay }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    const url = new URL(CAR, window.location.origin)
    url.search = toSearch(r.state)
    const verdict = r.ok ? `연봉의 ${pctText(r.ratio)}` : `연봉 ${wonText(r.needPay)}은 돼야`
    return {
      url: url.toString(),
      text: `연봉 ${r.salary.label} 원에 ${r.car.model}? ${verdict}${r.lost ? ` · 3년 타면 ${wonText(r.lost)} 증발` : ''} | 돈미터`,
    }
  }, [r])

  const pick = (id) => {
    set('car')(id)
    document.getElementById('cr-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
          <SiteMenu current={CAR} />
          <button type="button" className="theme-pick__toggle" data-theme-toggle aria-expanded="false" aria-controls="theme-menu" aria-label="화면 색 바꾸기">
            <span className="theme-pick__dot" aria-hidden="true" />
            테마
          </button>
        </nav>
      </header>

      <AdRails slot={SLOTS.rail} />

      <main className="main">
        <StingHero options={carPageHero(r)} />
        <section className="hero cr-hero">
          <div className="hero__text">
            <h1 className="hero__title">자차 계산기</h1>
            <p className="hero__lede">연봉과 차를 고르면 내 연봉에 맞는 차인지, 3년 타면 얼마가 사라지는지, 지금 연봉으로 탈 수 있는 차는 뭔지 보여 드려요.</p>
          </div>
        </section>

        <form className="apt-form" onSubmit={(e) => e.preventDefault()} aria-label="연봉과 차 고르기">
          <Choices legend="연봉 (세전)" name="pay" options={SALARIES} value={state.pay} onChange={set('pay')} />
          <CarPicker value={state.car} onChange={set('car')} />
        </form>

        <div className="cr-result" id="cr-result" aria-live="polite">
          <div ref={resultRef}>
            <Verdict r={r} />
          </div>
          <Sting page="car" lines={carPageStings(r)} basis={`연봉 ${r.salary.label} 원, ${r.car.model} 기준`} />
          <Loss r={r} />
          <Fits r={r} onPick={pick} />
        </div>

        {share && <ShareBar url={share.url} text={share.text} sub="링크를 받은 사람도 같은 연봉과 차의 결과를 보고, 자기 연봉으로 바꿔 볼 수 있어요." />}

        <AdSlot variant="inline" slot={SLOTS.inline} />

        <CarGuide ad={<AdSlot variant="mid" slot={SLOTS.mid} />} />
      </main>

      <footer className="footer">
        <ul className="footer__links">
          <FooterLinks />
        </ul>
        <SocialLinks />
        <p>차값과 중고 시세는 제조사 발표 가격과 엔카 시세 보도를 돈미터가 옮겨 정리한 참고 자료예요. 옵션, 할인, 차 상태에 따라 실제 가격은 달라요.</p>
      </footer>

      <FloatingSwitch current={CAR} hidden={!pastResult} />
      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}
