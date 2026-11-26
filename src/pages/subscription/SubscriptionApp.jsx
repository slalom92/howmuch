// 월 구독료 계산기 (/subscription/): 쓰는 구독과 요금제, 연봉을 고르면 한 달·1년 구독료와 월급에서 차지하는 몫을 보여 준다
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
import { rememberPay, workText, bigTime, yearsText, wonText } from '../../lib/sting.js'
import { MENU, SUBSCRIPTION, SURVIVE, JONBER, CAR } from '../../lib/menu.js'
import { subscriptionStings, subscriptionHero } from './sting.js'
import { SALARIES, CATEGORIES, SERVICES, serviceOf, calculate, fromSearch, toSearch, won, pct, carLink, AS_OF } from './subscription.js'
import SubscriptionGuide from './SubscriptionGuide.jsx'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  rail: import.meta.env.VITE_AD_SLOT_RAIL || import.meta.env.VITE_AD_SLOT_TOP,
  mid: import.meta.env.VITE_AD_SLOT_MID || import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

const ITEMS_MENU = MENU.slice(0, 12)
const LINKS = [
  { href: SUBSCRIPTION, label: '월 구독료 계산기' },
  { href: SURVIVE, label: '존버 계산기' },
  { href: JONBER, label: '월급 분당 계산기' },
  { href: CAR, label: '자차 계산기' },
]

const n = (v) => Math.floor(v).toLocaleString('ko-KR')

// 1. 쓰는 구독 고르기: 분류마다 서비스 칩 (여러 개)
function Picker({ picks, onToggle }) {
  return (
    <fieldset className="apt-q sub-pick">
      <legend className="apt-q__legend">쓰고 있는 구독 (여러 개)</legend>
      {CATEGORIES.map((c) => (
        <div key={c.id} className="sub-pick__row" role="group" aria-label={c.label}>
          <span className="sub-pick__cat" aria-hidden="true">
            {c.label}
          </span>
          <div className="sub-pick__opts">
            {SERVICES.filter((s) => s.cat === c.id).map((s) => {
              const on = !!picks[s.id]
              return (
                <label key={s.id} className={`sub-svc${on ? ' is-on' : ''}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => onToggle(s.id)} />
                  <span className="sub-svc__tick" aria-hidden="true" />
                  {s.name}
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </fieldset>
  )
}

// 2. 고른 구독마다 요금제 고르기
function Tiers({ picks, onTier, onToggle }) {
  const list = SERVICES.filter((s) => picks[s.id])
  return (
    <fieldset className="apt-q sub-tiers">
      <legend className="apt-q__legend">요금제</legend>
      {list.length === 0 ? (
        <p className="sub-tiers__empty">위에서 쓰고 있는 구독을 하나 이상 골라 주세요.</p>
      ) : (
        <ul className="sub-tiers__list">
          {list.map((s) => (
            <li key={s.id} className="sub-tier">
              <div className="sub-tier__head">
                <strong>{s.name}</strong>
                <button type="button" className="sub-tier__x" onClick={() => onToggle(s.id)} aria-label={`${s.name} 빼기`}>
                  빼기
                </button>
              </div>
              {s.tiers.length > 1 ? (
                <div className="sub-tier__opts" role="radiogroup" aria-label={`${s.name} 요금제`}>
                  {s.tiers.map((t) => {
                    const on = picks[s.id] === t.id
                    return (
                      <label key={t.id} className={`sv-chip${on ? ' is-on' : ''}`}>
                        <input type="radio" className="sr-only" name={`tier-${s.id}`} value={t.id} checked={on} onChange={() => onTier(s.id, t.id)} />
                        {t.label}
                        <small>{t.price.toLocaleString('ko-KR')}원</small>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <p className="sub-tier__one">
                  {s.tiers[0].label} <b>월 {s.tiers[0].price.toLocaleString('ko-KR')}원</b>
                </p>
              )}
              {s.note && <p className="sub-tier__note">{s.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  )
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

// 결과: 이번 달 정기결제 명세서
function Bill({ r }) {
  if (!r.count) {
    return (
      <section className="sub-bill sub-bill--empty" aria-labelledby="sub-bill-title">
        <h2 className="sub-bill__title" id="sub-bill-title">
          정기결제 명세서
        </h2>
        <p className="sub-bill__none">고른 구독이 없어요. 정말 하나도 없다면 축하해요, 매달 자동이체 0원이에요. 하나라도 있다면 위에서 골라 보세요.</p>
      </section>
    )
  }
  return (
    <section className="sub-bill" aria-labelledby="sub-bill-title">
      <div className="sub-bill__top">
        <h2 className="sub-bill__title" id="sub-bill-title">
          정기결제 명세서
        </h2>
        <span className="sub-bill__count">{r.count}건</span>
      </div>
      <ul className="sub-bill__lines">
        {r.sorted.map((i) => (
          <li key={i.id}>
            <span className="sub-bill__name">
              {i.name}
              <small>
                {i.tier.label}
                {i.tier.yearly ? ` · 1년 ${i.tier.yearly.toLocaleString('ko-KR')}원 ÷ 12` : i.tier.per ? ` · ${i.tier.per}` : ''}
              </small>
            </span>
            <span className="sub-bill__amt">{won(i.price)}</span>
          </li>
        ))}
      </ul>
      <div className="sub-bill__total">
        <span>매달 빠져나가는 돈</span>
        <strong>
          <CountUp value={r.monthly} format={(v) => won(v)} />
        </strong>
      </div>
      <dl className="sub-bill__grid">
        <div>
          <dt>1년이면</dt>
          <dd>{wonText(r.yearly)}</dd>
        </div>
        <div>
          <dt>하루로 치면</dt>
          <dd>{won(r.daily)}</dd>
        </div>
        <div>
          <dt>실수령 월급의</dt>
          <dd className="is-seal">{pct(r.share)}</dd>
        </div>
        <div>
          <dt>벌려고 일하는 시간</dt>
          <dd>{bigTime(r.hours)}</dd>
        </div>
      </dl>
      <p className="sub-bill__foot">
        연봉 {r.salary.label} 원, 한 달 실수령 {won(r.pay)} 기준. 요금은 {AS_OF} 부가세 포함 값이에요.
      </p>
    </section>
  )
}

// 1년 구독료를 다른 걸로 바꾸면
function Swap({ r }) {
  if (!r.count) return null
  return (
    <section className="kbo-card sub-swap" aria-labelledby="sub-swap-title">
      <h2 className="kbo-card__title" id="sub-swap-title">
        1년 구독료 {wonText(r.yearly)}이면
      </h2>
      <ul className="sub-swap__list">
        <li>
          <b>{n(r.chicken)}</b>
          <span>마리</span>
          <small>BBQ 황금올리브 23,000원</small>
        </li>
        <li>
          <b>{n(r.ramen)}</b>
          <span>봉지</span>
          <small>신라면 1,000원, 하루 세 봉지면 {n(r.ramen / 3)}일</small>
        </li>
        <li>
          <b>{workText(r.yearHours)}</b>
          <span>노동</span>
          <small>1년 구독료를 실수령 시급으로 벌면</small>
        </li>
      </ul>
    </section>
  )
}

// 구독료를 모으면 살 수 있는 차
function Cars({ r }) {
  if (!r.count) return null
  const max = Math.max(...r.cars.map((c) => c.years))
  return (
    <section className="kbo-card sub-cars" aria-labelledby="sub-cars-title">
      <h2 className="kbo-card__title" id="sub-cars-title">
        구독 끊고 모으면 몇 년 만에 이 차
      </h2>
      <p className="sub-cars__lede">
        한 달 {won(r.monthly)}을 한 푼도 안 쓰고 모을 때 중고차를 사기까지 걸리는 시간이에요.
        {r.tenCar ? (
          <>
            {' '}
            10년 모으면 <b>{r.tenCar.name}</b>까지 돼요.
          </>
        ) : null}
      </p>
      <ul className="sub-cars__list">
        {r.cars.map((c) => (
          <li key={c.id}>
            <a href={carLink(r.state, c.own ? null : c.id)} onClick={() => track('subscription_car', { car: c.id })}>
              <span className="sub-cars__name">
                {c.name}
                <small>
                  {c.year}년식 {wonText(c.price)}
                </small>
              </span>
              <span className="sub-cars__bar" aria-hidden="true">
                <i style={{ width: `${Math.max(2, (Math.log1p(c.years) / Math.log1p(max)) * 100)}%` }} />
              </span>
              <span className="sub-cars__years">{yearsText(c.years)}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="sub-cars__note">모닝은 2021년식 평균 등록가격(2026년 10월 보도), 나머지는 엔카 2026년 10월 보도(2023년식, 6만 km, 무사고) 시세예요. 이자는 넣지 않았어요. 차 이름을 누르면 자차 계산기로 이어져요.</p>
    </section>
  )
}

// 분류별로 어디에 많이 쓰나
function Split({ r }) {
  if (r.byCat.length < 2) return null
  return (
    <section className="kbo-card" aria-labelledby="sub-split-title">
      <h2 className="kbo-card__title" id="sub-split-title">
        어디에 제일 많이 쓰나
      </h2>
      <div className="sub-split" role="img" aria-label={r.byCat.map((c) => `${c.label} ${pct(c.amount / r.monthly)}`).join(', ')}>
        {r.byCat.map((c) => (
          <span key={c.id} className={`sub-split__seg sub-split__seg--${c.id}`} style={{ flexGrow: c.amount }} />
        ))}
      </div>
      <ul className="sub-split__legend">
        {r.byCat.map((c) => (
          <li key={c.id}>
            <i className={`sub-split__key sub-split__seg--${c.id}`} />
            <span>{c.label}</span>
            <b>{won(c.amount)}</b>
            <small>{pct(c.amount / r.monthly)}</small>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function SubscriptionApp({ initialSearch = '' }) {
  const [state, setState] = useState(() => fromSearch(typeof window === 'undefined' ? initialSearch : window.location.search))
  const r = useMemo(() => calculate(state), [state])

  const toggle = (id) => {
    setState((st) => {
      const s = { ...st.s }
      if (s[id]) delete s[id]
      else s[id] = serviceOf(id).def
      return { ...st, s }
    })
    track('subscription_pick', { svc: id })
  }
  const setTier = (id, t) => {
    setState((st) => ({ ...st, s: { ...st.s, [id]: t } }))
    track('subscription_tier', { svc: id, tier: t })
  }
  const setPay = (v) => {
    setState((st) => ({ ...st, pay: v }))
    rememberPay(v)
    track('subscription_pick', { pay: v })
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
    if (typeof window === 'undefined' || !r.count) return null
    const url = new URL(SUBSCRIPTION, window.location.origin)
    url.search = toSearch(r.state)
    return {
      url: url.toString(),
      text: `구독 ${r.count}개에 한 달 ${won(r.monthly)}, 1년이면 ${wonText(r.yearly)}. 월급의 ${pct(r.share)}가 자동이체로 나가요 | 돈미터`,
    }
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
          <SiteMenu current={SUBSCRIPTION} items={ITEMS_MENU} links={LINKS} />
          <button type="button" className="theme-pick__toggle" data-theme-toggle aria-expanded="false" aria-controls="theme-menu" aria-label="화면 색 바꾸기">
            <span className="theme-pick__dot" aria-hidden="true" />
            테마
          </button>
        </nav>
      </header>

      <AdRails slot={SLOTS.rail} />

      <main className="main main--split">
        <section className="hero sub-hero">
          <div className="hero__text">
            <p className="hero__kicker">매달 빠져나가는 돈 점검</p>
            <h1 className="hero__title">월 구독료 계산기</h1>
            <p className="hero__lede">넷플릭스, 배민클럽, 챗GPT, 테슬라 FSD에 헬스장과 정수기 렌탈까지. 쓰는 구독과 요금제를 고르면 매달 얼마가 빠져나가는지, 월급의 몇 %인지 보여 드려요.</p>
          </div>
          <HeroArt kind="subscription" />
        </section>
        <StingHero options={subscriptionHero(r)} />

        <div className="split-in">
          <form className="apt-form" onSubmit={(e) => e.preventDefault()} aria-label="구독과 요금제, 연봉 고르기">
            <h2 className="panel__title">조건 고르기</h2>
            <Picker picks={r.state.s} onToggle={toggle} />
            <Tiers picks={r.state.s} onTier={setTier} onToggle={toggle} />
            <Choices legend="연봉 (세전, 계산은 실수령으로)" name="pay" options={SALARIES} value={r.state.pay} onChange={setPay} />
          </form>
        </div>

        <div className="sub-result split-out" aria-live="polite">
          <div ref={resultRef}>
            <Bill r={r} />
          </div>
          <Sting page="subscription" lines={subscriptionStings(r)} basis={`연봉 ${r.salary.label} 원 실수령 기준`} />
          <Swap r={r} />
        </div>
        <ResultNote>각 서비스가 공개한 한 달 요금(부가세 포함)을 더했어요. 할인, 통신사 결합, 연간 결제 여부에 따라 실제로 나가는 돈은 달라질 수 있어요.</ResultNote>

        {share && <ShareBar url={share.url} text={share.text} sub="링크를 받은 사람도 같은 구독 목록을 보고, 자기 구독으로 바꿔 볼 수 있어요." />}

        <AdSlot variant="inline" slot={SLOTS.inline} />

        <Cars r={r} />

        <Split r={r} />

        <SubscriptionGuide ad={<AdSlot variant="mid" slot={SLOTS.mid} />} />
      </main>

      <footer className="footer">
        <ul className="footer__links">
          <FooterLinks />
        </ul>
        <SocialLinks />
        <p>구독료는 각 서비스의 공식 요금 페이지와 보도를 돈미터가 옮겨 정리한 참고 자료예요. 결제 방법(앱 결제, 통신사 결합)과 할인에 따라 실제 청구액은 다를 수 있어요.</p>
      </footer>

      <FloatingSwitch current={SUBSCRIPTION} hidden={!pastResult} />
      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}
