// 관리비 계산기 (/manage-fee/): 집 형태·크기·지역·이번 달 관리비를 고르면 같은 조건 평균과 비교하고,
// 1년·10년 누적과 연 8%로 굴렸다면, 매달 줄이면 10년 뒤 얼마인지 보여 준다
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
import ResultNote from '../../components/ResultNote.jsx'
import HeroArt from '../../components/HeroArt.jsx'
import StingHero from '../../components/StingHero.jsx'
import { wonText } from '../../lib/sting.js'
import { MENU, MANAGE_FEE, SUBSCRIPTION, SURVIVE, COMMUTE } from '../../lib/menu.js'
import { manageFeeStings, manageFeeHero, carLabel } from './sting.js'
import { TYPES, REGIONS, AREAS, SEASONS, CUTS, feeOptions, defaultFee, calculate, fromSearch, toSearch, won, signedPct } from './managefee.js'
import ManageFeeGuide from './ManageFeeGuide.jsx'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  rail: import.meta.env.VITE_AD_SLOT_RAIL || import.meta.env.VITE_AD_SLOT_TOP,
  mid: import.meta.env.VITE_AD_SLOT_MID || import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

const ITEMS_MENU = MENU.slice(0, 12)
const LINKS = [
  { href: MANAGE_FEE, label: '관리비 계산기' },
  { href: SUBSCRIPTION, label: '월 구독료 계산기' },
  { href: SURVIVE, label: '존버 계산기' },
  { href: COMMUTE, label: '직주근접 계산기' },
]

const n = (v) => Math.floor(v).toLocaleString('ko-KR')
const man = (v) => `${(Math.round(v / 1000) / 10).toLocaleString('ko-KR')}만 원`

function Choices({ legend, name, options, value, onChange, hint }) {
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
      {hint && <p className="mf-hint">{hint}</p>}
    </fieldset>
  )
}

// 결과 1: 평균과 비교
function Verdict({ r }) {
  const max = Math.max(r.fee, r.avg) * 1.08
  const head =
    r.diff > 0 ? (
      <>
        매달 <strong>+{man(r.diff)}</strong> 더 내고 있어요
      </>
    ) : r.diff < 0 ? (
      <>
        매달 <strong>{man(-r.diff)}</strong> 덜 내고 있어요
      </>
    ) : (
      <>평균과 딱 같아요</>
    )
  return (
    <section className="kbo-card mf-verdict" aria-labelledby="mf-verdict-title">
      <p className={`mf-grade mf-grade--${r.grade.tone}`}>{r.grade.label}</p>
      <h2 className="mf-verdict__title" id="mf-verdict-title">
        {head}
      </h2>
      <p className="mf-verdict__sub">
        {r.basis}({won(r.avg)})과 비교하면 {signedPct(r.rate)}예요.
      </p>
      <div className="mf-bars">
        <div className="mf-bar">
          <span className="mf-bar__name">우리 집</span>
          <span className="mf-bar__track">
            <span className={`mf-bar__fill mf-bar__fill--me mf-bar__fill--${r.grade.tone}`} style={{ width: `${(r.fee / max) * 100}%` }} />
          </span>
          <span className="mf-bar__val">{man(r.fee)}</span>
        </div>
        <div className="mf-bar">
          <span className="mf-bar__name">평균</span>
          <span className="mf-bar__track">
            <span className="mf-bar__fill" style={{ width: `${(r.avg / max) * 100}%` }} />
          </span>
          <span className="mf-bar__val">{man(r.avg)}</span>
        </div>
      </div>
      {r.apt && (
        <p className="mf-verdict__foot">
          우리 집은 전용 1㎡에 {n(r.perM2)}원, {r.region.label} 평균은 {n(Math.round(r.region.perM2 * r.season.w))}원이에요.
        </p>
      )}
    </section>
  )
}

// 결과 2: 누적과 굴렸다면
function Totals({ r }) {
  const cells = [
    { k: '1년이면', v: r.y1, sub: r.chicken >= 1 ? `치킨 ${n(r.chicken)}마리 값` : null },
    { k: '5년이면', v: r.y5, sub: '매년 3% 오른다고 치면' },
    { k: '10년이면', v: r.y10, sub: r.car10 ? `${carLabel(r.car10)} 중고 값` : '매년 3% 오른다고 치면' },
    { k: '10년 동안 연 8%로 굴렸다면', v: r.fv10, sub: '매달 관리비만큼 모았다면', hot: true },
  ]
  return (
    <section className="kbo-card mf-totals" aria-labelledby="mf-totals-title">
      <h2 className="kbo-card__title" id="mf-totals-title">
        관리비, 모아 보면
      </h2>
      <div className="mf-totals__grid">
        {cells.map((c) => (
          <div key={c.k} className={`mf-total${c.hot ? ' is-hot' : ''}`}>
            <p className="mf-total__k">{c.k}</p>
            <p className="mf-total__v">
              <CountUp value={c.v} format={wonText} />
            </p>
            {c.sub && <p className="mf-total__sub">{c.sub}</p>}
          </div>
        ))}
      </div>
      {r.extraYear > 0 && (
        <p className="mf-totals__extra">
          평균보다 더 내는 돈만 1년 <strong>{wonText(r.extraYear)}</strong>, 10년이면 <strong>{wonText(r.extra10)}</strong>이에요.
        </p>
      )}
    </section>
  )
}

// 결과 3: 매달 줄이면
function Cut({ r, onCut }) {
  return (
    <section className="kbo-card mf-cut" aria-labelledby="mf-cut-title">
      <h2 className="kbo-card__title" id="mf-cut-title">
        매달 관리비를 줄이면
      </h2>
      <Choices legend="한 달에 줄일 돈" name="cut" options={CUTS} value={String(r.cut)} onChange={onCut} />
      <div className="mf-cut__out">
        <div>
          <p className="mf-total__k">10년 뒤 아낀 돈</p>
          <p className="mf-total__v">
            <CountUp value={r.cut10} format={wonText} />
          </p>
        </div>
        <div>
          <p className="mf-total__k">연 8%로 굴렸다면</p>
          <p className="mf-total__v mf-cut__hot">
            <CountUp value={r.cutFv10} format={wonText} />
          </p>
        </div>
      </div>
      <p className="mf-hint">난방 온도 1~2도, 안 쓰는 방 난방 끄기, 대기전력 끄기처럼 개별사용료에서 줄일 수 있는 몫이 커요.</p>
    </section>
  )
}

export default function ManageFeeApp({ initialSearch = '' }) {
  const [state, setState] = useState(() => fromSearch(typeof window === 'undefined' ? initialSearch : window.location.search))
  const r = useMemo(() => calculate(state), [state])

  const set = (key) => (v) => {
    setState((st) => (key === 'type' ? { ...st, type: v, fee: defaultFee(v) } : { ...st, [key]: v }))
    track('managefee_pick', { [key]: v })
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
    const url = new URL(MANAGE_FEE, window.location.origin)
    url.search = toSearch(r.state)
    const vs = r.diff > 0 ? `평균보다 매달 ${man(r.diff)} 더` : r.diff < 0 ? `평균보다 매달 ${man(-r.diff)} 덜` : '평균과 같게'
    return { url: url.toString(), text: `우리 집 관리비 ${man(r.fee)}, ${r.basis} ${vs} 내요. 10년이면 ${wonText(r.y10)} | 돈미터` }
  }, [r])

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
          <SiteMenu current={MANAGE_FEE} items={ITEMS_MENU} links={LINKS} />
          <button type="button" className="theme-pick__toggle" data-theme-toggle aria-expanded="false" aria-controls="theme-menu" aria-label="화면 색 바꾸기">
            <span className="theme-pick__dot" aria-hidden="true" />
            테마
          </button>
        </nav>
      </header>

      <AdRails slot={SLOTS.rail} />

      <main className="main main--split">
        <section className="hero">
          <div className="hero__text">
            <p className="hero__kicker">제2의 월세 점검</p>
            <h1 className="hero__title">관리비 계산기</h1>
            <p className="hero__lede">집 형태와 크기, 지역, 이번 달 관리비를 고르면 같은 조건 평균보다 얼마나 더 내는지, 10년이면 얼마인지 보여 드려요.</p>
          </div>
          <HeroArt kind="apt" />
        </section>
        <StingHero options={manageFeeHero(r)} />

        <div className="split-in">
          <form className="apt-form" onSubmit={(e) => e.preventDefault()} aria-label="집과 관리비 고르기">
            <h2 className="panel__title">조건 고르기</h2>
            <Choices legend="집 형태" name="type" options={TYPES} value={r.state.type} onChange={set('type')} />
            {r.apt ? (
              <>
                <Choices legend="전용면적" name="area" options={AREAS} value={r.state.area} onChange={set('area')} />
                <Choices legend="지역" name="region" options={REGIONS} value={r.state.region} onChange={set('region')} hint="부산·광주·울산·전남·전북·경북·제주는 지역 값이 없어 전국 평균으로 비교해요." />
                <Choices legend="언제 고지서" name="season" options={SEASONS} value={r.state.season} onChange={set('season')} />
              </>
            ) : (
              <p className="mf-hint mf-hint--box">오피스텔·원룸은 지역·크기별 공식 평균이 없어서 서울 대학가 전용 33㎡ 이하 매물 평균과 비교해요.</p>
            )}
            <Choices legend="이번 달 관리비 (전기·수도·난방 포함)" name="fee" options={feeOptions(r.state.type)} value={r.state.fee} onChange={set('fee')} />
          </form>
        </div>

        <div className="mf-result split-out" aria-live="polite">
          <div ref={resultRef}>
            <Verdict r={r} />
          </div>
          <Sting page="managefee" lines={manageFeeStings(r)} basis={`${r.basis} 기준`} />
          <Totals r={r} />
        </div>
        <ResultNote>평균은 K-apt에 공개된 단지 전체를 모은 값이라 우리 집 고지서와는 층·향·난방 방식·사용량에 따라 차이가 나요. 누적과 투자 수익은 매년 3% 인상, 연 8% 수익을 가정한 값이에요.</ResultNote>

        {share && <ShareBar url={share.url} text={share.text} sub="링크를 받은 사람도 같은 조건을 보고, 자기 집 관리비로 바꿔 볼 수 있어요." />}

        <AdSlot variant="inline" slot={SLOTS.inline} />

        <Cut r={r} onCut={set('cut')} />

        <ManageFeeGuide ad={<AdSlot variant="mid" slot={SLOTS.mid} />} />
      </main>

      <footer className="footer">
        <ul className="footer__links">
          <FooterLinks />
        </ul>
        <SocialLinks />
        <p>평균 관리비는 K-apt 공개 자료와 보도를 돈미터가 옮겨 정리한 참고 자료예요. 실제 관리비는 단지와 세대 사용량에 따라 다를 수 있어요.</p>
      </footer>

      <FloatingSwitch current={MANAGE_FEE} hidden={!pastResult} />
      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}
