// 월급 버티기 계산기 (/survive/): 연봉과 생활 방식을 고르면 월급 한 번으로 며칠 버티는지, 월급이 어디로 가는지 보여 준다
import { useEffect, useMemo, useRef, useState } from 'react'
import AdSlot, { AdRails } from '../../components/AdSlot.jsx'
import ShareBar from '../../components/ShareBar.jsx'
import { BrandMark } from '../../components/Art.jsx'
import { CountUp } from '../../components/Motion.jsx'
import SiteMenu from '../../components/SiteMenu.jsx'
import FloatingSwitch from '../../components/FloatingSwitch.jsx'
import SocialLinks from '../../components/Social.jsx'
import { track } from '../../lib/analytics.js'
import { FOOTER_MENU, MENU, SURVIVE, JONBER, APT, YOUTUBER } from '../../lib/menu.js'
import { SALARIES, STYLES, STYLE_TEXT, SAVES, SAVE_ALL, calculate, fromSearch, toSearch, aptLink, daysText, won, pct, lastDayFrom, dateText } from './survive.js'
import SurviveGuide from './SurviveGuide.jsx'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  // PC 좌우 배너용 단위가 따로 없으면 상단 배너 단위를 같이 쓴다
  rail: import.meta.env.VITE_AD_SLOT_RAIL || import.meta.env.VITE_AD_SLOT_TOP,
  // 모바일 본문 중간 광고: 따로 만든 단위가 없으면 상단 배너 단위를 쓴다
  mid: import.meta.env.VITE_AD_SLOT_MID || import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

const ITEMS_MENU = MENU.slice(0, 11)
const LINKS = [
  { href: YOUTUBER, label: '유튜버 수익 계산기' },
  { href: SURVIVE, label: '월급 버티기 계산기' },
  { href: JONBER, label: '존버 계산기' },
  { href: APT, label: '연봉 모아 집 사기' },
]

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

// 버티는 날 카드
function LastCard({ r, today }) {
  const short = r.days < 30
  const when = today ? lastDayFrom(today, r.days) : null
  return (
    <section className="sv-last" aria-labelledby="sv-last-title">
      <p className="sv-last__kicker" id="sv-last-title">
        연봉 {r.salary.label} 원, 한 달 실수령 {won(r.monthly)}. {STYLE_TEXT[r.state.s]}
        {r.saveCount > 0 && <span className="sv-last__tag">아끼기 {r.saveCount}개</span>}
      </p>
      <p className="sv-last__main">
        월급 한 번으로{' '}
        <strong>
          <CountUp value={r.days} format={(v) => daysText(Math.round(v))} />
        </strong>{' '}
        버텨요
      </p>
      <p className="sv-last__sub">
        {short ? (
          <>다음 월급날까지 {daysText(30 - r.days)}이 모자라요.</>
        ) : (
          <>
            다음 월급날까지 버티고도 {daysText(r.days - 30)}치가 남아요.
          </>
        )}
        {when && (
          <>
            {' '}
            {PAY_LABEL(when.pay)}에 받은 월급이면 <b>{dateText(when.end, when.end.getFullYear() !== when.pay.getFullYear())}</b>까지예요.
          </>
        )}
      </p>
      <dl className="sv-last__grid">
        <div>
          <dt>한 달 생활비</dt>
          <dd>{won(r.spend)}</dd>
        </div>
        <div>
          <dt>하루 생활비</dt>
          <dd>{won(r.daily)}</dd>
        </div>
        <div>
          <dt>한 달에 남는 돈</dt>
          <dd className={r.left < 0 ? 'is-minus' : ''}>{won(r.left)}</dd>
        </div>
        <div>
          <dt>1년 모으면</dt>
          <dd className={r.left < 0 ? 'is-minus' : ''}>{won(r.left * 12)}</dd>
        </div>
      </dl>
      {r.left > 0 ? (
        <a className="sv-apt" href={aptLink(r.state)} onClick={() => track('survive_apt', { pay: r.state.pay, s: r.state.s })}>
          <span className="sv-apt__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path d="M3.6 11.2L12 3.6l8.4 7.6v9.2a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1z" />
              <path d="M9.8 21.4v-7.2h4.4v7.2" />
            </svg>
          </span>
          <span className="sv-apt__text">
            <strong>남는 돈 모아서 살 수 있는 아파트</strong>
            <small>한 달 {won(r.left)}씩 모으면 몇 년 걸릴까요?</small>
          </span>
          <span className="sv-apt__go" aria-hidden="true">
            ›
          </span>
        </a>
      ) : null}
    </section>
  )
}

const PAY_LABEL = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일`

// 더 아껴 보기: 항목마다 아끼는 방법 고르기
function SavePanel({ r, onChange }) {
  const a = r.state.a
  const all = SAVES.every((g) => a[g.id] === SAVE_ALL[g.id])
  const pick = (gid, oid) => {
    const next = { ...a }
    if (oid) next[gid] = oid
    else delete next[gid]
    onChange(next)
  }
  const more = r.days - r.base.days
  return (
    <section className="kbo-card sv-save" aria-labelledby="sv-save-title">
      <h2 className="kbo-card__title" id="sv-save-title">
        더 아껴 보기
      </h2>
      <p className="sv-save__sum" aria-live="polite">
        {r.saveCount > 0 ? (
          <>
            한 달 <b>{won(r.saved)}</b> 덜 쓰고, 월급 한 번으로 <b>{daysText(r.days)}</b> 버텨요 <span className="sv-save__plus">+{daysText(more)}</span>
          </>
        ) : (
          <>항목마다 아끼는 방법을 골라 보세요. 병원·약값은 아끼지 않게 그대로 둬요.</>
        )}
      </p>
      <div className="sv-save__rows">
        {SAVES.map((g) => (
          <fieldset key={g.id} className="sv-save__row">
            <legend className="sv-save__label">{g.label}</legend>
            <div className="sv-save__opts">
              {[{ id: '', label: '그대로' }, ...g.opts].map((o) => {
                const on = (a[g.id] || '') === o.id
                return (
                  <label key={o.id || 'keep'} className={`sv-chip${on ? ' is-on' : ''}`}>
                    <input type="radio" className="sr-only" name={`save-${g.id}`} value={o.id} checked={on} onChange={() => pick(g.id, o.id)} />
                    {o.label}
                    {o.note && <small>{o.note}</small>}
                  </label>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="sv-save__btns">
        <button type="button" className="sv-btn sv-btn--seal" onClick={() => onChange({ ...SAVE_ALL })} disabled={all}>
          전부 최대로 아끼기
        </button>
        <button type="button" className="sv-btn" onClick={() => onChange({})} disabled={r.saveCount === 0}>
          처음대로
        </button>
      </div>
    </section>
  )
}

// 월급 봉투 쪼개기: 집 / 먹고 마시기 / 그 밖의 생활 / 남는 돈
function Envelope({ r }) {
  const left = Math.max(0, r.left)
  const over = r.left < 0
  const base = over ? r.spend : r.monthly
  return (
    <section className="kbo-card sv-env" aria-labelledby="sv-env-title">
      <h2 className="kbo-card__title" id="sv-env-title">
        월급 봉투 쪼개기
      </h2>
      <p className="sv-env__lede">월급 {won(r.monthly)}이 한 달 동안 어디로 가는지 나눠 봤어요.</p>
      <div className="sv-bar" role="img" aria-label={r.groups.map((g) => `${g.name} ${pct(g.amount / base)}`).join(', ') + (over ? '' : `, 남는 돈 ${pct(left / base)}`)}>
        {r.groups.map((g) => (
          <span key={g.id} className={`sv-bar__seg sv-bar__seg--${g.id}`} style={{ flexGrow: g.amount }} />
        ))}
        {!over && left > 0 && <span className="sv-bar__seg sv-bar__seg--left" style={{ flexGrow: left }} />}
      </div>
      <ul className="sv-legend">
        {r.groups.map((g) => (
          <li key={g.id}>
            <i className={`sv-key sv-key--${g.id}`} />
            <span>{g.name}</span>
            <b>{won(g.amount)}</b>
            <small>{pct(g.amount / r.monthly)}</small>
          </li>
        ))}
        <li>
          <i className="sv-key sv-key--left" />
          <span>남는 돈</span>
          <b className={over ? 'is-minus' : ''}>{won(r.left)}</b>
          <small>{over ? '모자라요' : pct(left / r.monthly)}</small>
        </li>
      </ul>

      <div className="jb-table-wrap">
        <table className="jb-table sv-table sv-table--items">
          <caption className="sr-only">항목별 한 달, 하루 생활비와 월급에서 차지하는 비율</caption>
          <thead>
            <tr>
              <th scope="col">어디에</th>
              <th scope="col" className="num">
                한 달
              </th>
              <th scope="col" className="num">
                하루
              </th>
              <th scope="col" className="num">
                월급의
              </th>
            </tr>
          </thead>
          <tbody>
            {r.items.map((c) => (
              <tr key={c.id}>
                <th scope="row">
                  <i className={`sv-key sv-key--${c.group}`} />
                  {c.name}
                  {c.hint && <small>{c.hint}</small>}
                </th>
                <td className="num">
                  {c.amount < c.was && (
                    <s className="sv-was">
                      {won(c.was)}
                      <span className="sr-only">에서 줄여</span>
                    </s>
                  )}
                  {won(c.amount)}
                </td>
                <td className="num">{won(c.daily)}</td>
                <td className="num">
                  <strong>{pct(c.share)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {r.state.s === 'min' && <p className="sv-env__note">최소 생활비는 합계만 정해져 있어서, 항목별 금액은 1인 가구 평균 비중대로 나눴어요.</p>}
    </section>
  )
}

// 같은 연봉, 생활 방식만 바꾸면
function Styles({ r, onPick }) {
  return (
    <section className="sv-styles" aria-labelledby="sv-styles-title">
      <h2 className="sv-styles__title" id="sv-styles-title">
        같은 월급, 사는 방식만 바꾸면
      </h2>
      <ul className="sv-styles__cards">
        {r.styles.map((x) => (
          <li key={x.id} className={`sv-style${x.id === r.state.s ? ' is-on' : ''}`}>
            <button type="button" onClick={() => onPick(x.id)} aria-pressed={x.id === r.state.s}>
              <span className="sv-style__name">{x.label}</span>
              <span className="sv-style__spend">한 달 {won(x.spend)}</span>
              <span className="sv-style__days">
                <strong>{daysText(x.days)}</strong> 버팀
              </span>
              <span className="sv-style__left">{x.left >= 0 ? `매달 ${won(x.left)} 남아요` : `매달 ${won(-x.left)} 모자라요`}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

// 연봉별로 한눈에
function Ladder({ r }) {
  return (
    <section className="kbo-card" aria-labelledby="sv-ladder-title">
      <h2 className="kbo-card__title" id="sv-ladder-title">
        연봉별로 보면
      </h2>
      <p className="sv-env__lede">{STYLE_TEXT[r.state.s]} 연봉마다 월급 한 번으로 버티는 날이에요.</p>
      <div className="jb-table-wrap">
        <table className="jb-table sv-table">
          <thead>
            <tr>
              <th scope="col">연봉</th>
              <th scope="col" className="num">
                한 달 실수령
              </th>
              <th scope="col" className="num">
                버티는 날
              </th>
              <th scope="col" className="num">
                남는 돈
              </th>
            </tr>
          </thead>
          <tbody>
            {r.ladder.map((x) => (
              <tr key={x.id} className={x.id === r.state.pay ? 'is-on' : ''}>
                <th scope="row">{x.label}</th>
                <td className="num">{won(x.monthly)}</td>
                <td className="num">
                  <strong>{daysText(x.days)}</strong>
                </td>
                <td className="num">{won(x.left)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function SurviveApp({ initialSearch = '' }) {
  const [state, setState] = useState(() => fromSearch(typeof window === 'undefined' ? initialSearch : window.location.search))
  const r = useMemo(() => calculate(state), [state])
  const set = (k) => (v) => {
    setState((s) => ({ ...s, [k]: v }))
    track('survive_pick', { [k]: k === 'a' ? Object.keys(v).join(',') || 'none' : v })
  }

  // 달력 날짜는 브라우저에서만 (미리 그린 HTML 에는 넣지 않는다)
  const [today, setToday] = useState(null)
  useEffect(() => setToday(new Date()), [])

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
    const url = new URL(SURVIVE, window.location.origin)
    url.search = toSearch(r.state)
    return {
      url: url.toString(),
      text:
        r.saveCount > 0
          ? `연봉 ${r.salary.label} 원, 아끼고 아끼면 월급 한 번으로 ${daysText(r.days)} 버텨요 (+${daysText(r.days - r.base.days)}) | 돈미터`
          : `연봉 ${r.salary.label} 원, ${STYLE_TEXT[r.state.s]} 월급 한 번으로 ${daysText(r.days)} 버텨요 | 돈미터`,
    }
  }, [r])

  // 결과 카드를 지나 아래로 내려간 뒤에만 다른 계산기 바로가기를 띄운다
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
          <SiteMenu current={SURVIVE} items={ITEMS_MENU} links={LINKS} />
          <button type="button" className="theme-pick__toggle" data-theme-toggle aria-expanded="false" aria-controls="theme-menu" aria-label="화면 색 바꾸기">
            <span className="theme-pick__dot" aria-hidden="true" />
            테마
          </button>
        </nav>
      </header>

      {/* PC: 본문 좌우 세로 배너 / 모바일: 이 자리 대신 본문 중간 광고(mid) */}
      <AdRails slot={SLOTS.rail} />

      <main className="main">
        <section className="hero sv-hero">
          <div className="hero__text">
            <h1 className="hero__title">월급 버티기 계산기</h1>
            <p className="hero__lede">연봉과 사는 방식만 고르면, 월급 한 번으로 며칠 버티는지와 월급이 어디로 사라지는지 보여 드려요.</p>
          </div>
        </section>

        <form className="apt-form" onSubmit={(e) => e.preventDefault()} aria-label="연봉과 생활 방식 고르기">
          <Choices legend="연봉 (세전, 계산은 실수령으로)" name="pay" options={SALARIES} value={state.pay} onChange={set('pay')} />
          <Choices legend="사는 방식" name="s" options={STYLES} value={state.s} onChange={set('s')} />
        </form>

        <div className="sv-result" aria-live="polite">
          <div ref={resultRef}>
            <LastCard r={r} today={today} />
          </div>
          <SavePanel r={r} onChange={set('a')} />
          <Styles r={r} onPick={set('s')} />
        </div>

        {share && <ShareBar url={share.url} text={share.text} sub="링크를 받은 사람도 같은 결과를 보고, 자기 연봉으로 바꿔 볼 수 있어요." />}

        <AdSlot variant="inline" slot={SLOTS.inline} />

        <Envelope r={r} />

        <Ladder r={r} />

        <SurviveGuide ad={<AdSlot variant="mid" slot={SLOTS.mid} />} />
      </main>

      <footer className="footer">
        <ul className="footer__links">
          {FOOTER_MENU.map((m) => (
            <li key={m.href}>
              <a href={m.href}>{m.label}</a>
            </li>
          ))}
        </ul>
        <SocialLinks />
        <p>생활비는 국가데이터처 1인 가구 통계와 공공 기준을 돈미터가 옮겨 정리한 참고 자료예요. 사는 곳과 습관에 따라 실제 생활비는 다를 수 있어요.</p>
      </footer>

      <FloatingSwitch current={SURVIVE} hidden={!pastResult} />
      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}
