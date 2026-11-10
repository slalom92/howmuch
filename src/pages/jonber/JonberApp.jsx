// 존버 계산기 (/jonber/): 연봉을 고르면 커피, 점심, 월세, 아이폰을 사려고 몇 시간 일해야 하는지 보여 준다
import { useEffect, useMemo, useRef, useState } from 'react'
import AdSlot, { AdRails } from '../../components/AdSlot.jsx'
import ShareBar from '../../components/ShareBar.jsx'
import { BrandMark } from '../../components/Art.jsx'
import { CountUp } from '../../components/Motion.jsx'
import SiteMenu from '../../components/SiteMenu.jsx'
import FloatingSwitch from '../../components/FloatingSwitch.jsx'
import SocialLinks from '../../components/Social.jsx'
import { track } from '../../lib/analytics.js'
import { FOOTER_MENU, MENU, JONBER, APT, YOUTUBER, KBO } from '../../lib/menu.js'
import { SALARIES, BASES, MIN_WAGE, calculate, fromSearch, toSearch, timeText, clockAt, won, wonSmall, priceText } from './jonber.js'
import JonberGuide from './JonberGuide.jsx'
import ItemIcon from './ItemIcon.jsx'

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
  { href: JONBER, label: '존버 계산기' },
  { href: APT, label: '연봉 모아 집 사기' },
  { href: KBO, label: '프로야구 선수 연봉' },
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

// 내 시급 카드: 1시간에 얼마, 그리고 1분·1초·하루·한 달
function PayCard({ r }) {
  const basis = r.state.b === 'net' ? '실수령' : '세전'
  return (
    <section className="jb-pay" aria-labelledby="jb-pay-title">
      <p className="jb-pay__kicker" id="jb-pay-title">
        연봉 {r.salary.label} 원, {basis}으로 일하면
      </p>
      <p className="jb-pay__main">
        1시간에 <strong><CountUp value={r.hourly} format={won} /></strong>
      </p>
      <dl className="jb-pay__grid">
        <div>
          <dt>1분</dt>
          <dd>{won(r.perMinute)}</dd>
        </div>
        <div>
          <dt>1초</dt>
          <dd>{wonSmall(r.perSecond)}</dd>
        </div>
        <div>
          <dt>하루 8시간</dt>
          <dd>{won(r.perDay)}</dd>
        </div>
        <div>
          <dt>한 달</dt>
          <dd>{won(r.monthly)}</dd>
        </div>
      </dl>
      <p className="jb-pay__note">
        2026년 최저시급({MIN_WAGE.toLocaleString('ko-KR')}원)의 <strong>{r.vsMin.toFixed(1)}배</strong>예요.
      </p>
    </section>
  )
}

// 출근 시계: 오전 9시 출근해서 몇 시 몇 분에 그 값을 다 버는지
function Clock({ r }) {
  const rows = []
  let lunch = false
  for (const it of r.today) {
    const at = clockAt(it.hours)
    if (!lunch && at > '12:00') {
      rows.push({ lunch: true })
      lunch = true
    }
    rows.push({ ...it, at })
  }
  if (!lunch) rows.push({ lunch: true })
  return (
    <section className="kbo-card jb-clock" aria-labelledby="jb-clock-title">
      <h2 className="kbo-card__title" id="jb-clock-title">
        출근 시계
      </h2>
      <p className="jb-clock__lede">오전 9시에 출근하면 몇 시에 이만큼 벌까요? 점심시간 1시간은 뺐어요.</p>
      <ol className="jb-clock__list">
        <li className="jb-clock__edge">
          <time>09:00</time>
          <span>출근</span>
        </li>
        {rows.map((row, i) =>
          row.lunch ? (
            <li key={`lunch-${i}`} className="jb-clock__lunch">
              <time>12:00</time>
              <span>점심시간 (1시간은 일한 시간에서 빼요)</span>
            </li>
          ) : (
            <li key={row.id}>
              <time>{row.at}</time>
              <span className="jb-clock__what">
                {row.icon && <ItemIcon name={row.icon} size={20} />}
                <strong>{row.name}</strong> {row.price.toLocaleString('ko-KR')}원 <small>{row.note}</small>
              </span>
              <span className="jb-clock__took">{timeText(row.hours)}</span>
            </li>
          ),
        )}
        <li className="jb-clock__edge">
          <time>18:00</time>
          <span>
            퇴근, 오늘 번 돈 <strong>{won(r.perDay)}</strong>
          </span>
        </li>
      </ol>
    </section>
  )
}

// 하루로는 안 되는 것: 며칠, 몇 달 존버
function Later({ r }) {
  if (!r.later.length) return null
  return (
    <section className="jb-later" aria-labelledby="jb-later-title">
      <h2 className="jb-later__title" id="jb-later-title">
        이건 며칠 존버해야 해요
      </h2>
      <ul className="jb-later__cards">
        {r.later.map((it) => (
          <li key={it.id} className={`jb-card${it.icon ? ' has-icon' : ''}`}>
            {it.icon && <ItemIcon name={it.icon} size={44} className="jb-card__icon" />}
            <p className="jb-card__name">
              {it.name} <small>{it.note}</small>
            </p>
            <p className="jb-card__price">{priceText(it.price)}</p>
            <p className="jb-card__time">
              <strong>{timeText(it.hours)}</strong> 존버
            </p>
            <p className="jb-card__min">최저시급이면 {timeText(it.minHours)}</p>
          </li>
        ))}
      </ul>
      <p className="jb-later__note">하루는 8시간, 한 달은 209시간(주 40시간 + 주휴)으로 셌어요.</p>
    </section>
  )
}

// 전부 한 표로: 최저시급과 나란히
function Table({ r }) {
  return (
    <section className="kbo-card" aria-labelledby="jb-table-title">
      <h2 className="kbo-card__title" id="jb-table-title">
        최저시급과 나란히 보기
      </h2>
      <div className="jb-table-wrap">
        <table className="jb-table">
          <thead>
            <tr>
              <th scope="col">물건</th>
              <th scope="col" className="num">
                가격
              </th>
              <th scope="col" className="num">
                나는
              </th>
              <th scope="col" className="num">
                최저시급이면
              </th>
            </tr>
          </thead>
          <tbody>
            {r.items.map((it) => (
              <tr key={it.id}>
                <th scope="row">
                  {it.icon && <ItemIcon name={it.icon} size={16} />}
                  {it.name}
                </th>
                <td className="num">{priceText(it.price)}</td>
                <td className="num">
                  <strong>{timeText(it.hours)}</strong>
                </td>
                <td className="num">{timeText(it.minHours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function JonberApp({ initialSearch = '' }) {
  const [state, setState] = useState(() => fromSearch(typeof window === 'undefined' ? initialSearch : window.location.search))
  const r = useMemo(() => calculate(state), [state])
  const set = (k) => (v) => {
    setState((s) => ({ ...s, [k]: v }))
    track('jonber_pick', { [k]: v })
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
    const url = new URL(JONBER, window.location.origin)
    url.search = toSearch(r.state)
    const phone = r.items.find((it) => it.id === 'iphone')
    return {
      url: url.toString(),
      text: `연봉 ${r.salary.label} 원, 내 1시간은 ${won(r.hourly)} · 아이폰 사려면 ${timeText(phone.hours)} 존버 | 돈미터`,
    }
  }, [r])

  // 시급 카드를 지나 아래로 내려간 뒤에만 다른 계산기 바로가기를 띄운다
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
          <SiteMenu current={JONBER} items={ITEMS_MENU} links={LINKS} />
          <button type="button" className="theme-pick__toggle" data-theme-toggle aria-expanded="false" aria-controls="theme-menu" aria-label="화면 색 바꾸기">
            <span className="theme-pick__dot" aria-hidden="true" />
            테마
          </button>
        </nav>
      </header>

      {/* PC: 본문 좌우 세로 배너 / 모바일: 이 자리 대신 본문 중간 광고(mid) */}
      <AdRails slot={SLOTS.rail} />

      <main className="main">
        <section className="hero jb-hero">
          <div className="hero__text">
            <h1 className="hero__title">존버 계산기</h1>
            <p className="hero__lede">연봉만 고르면 커피 한 잔, 점심 한 끼, 월세, 아이폰을 사려고 몇 시간 일해야 하는지 보여 드려요.</p>
          </div>
        </section>

        <form className="apt-form" onSubmit={(e) => e.preventDefault()} aria-label="연봉 고르기">
          <Choices legend="연봉 (세전)" name="pay" options={SALARIES} value={state.pay} onChange={set('pay')} />
          <Choices legend="시급 기준" name="b" options={BASES} value={state.b} onChange={set('b')} />
        </form>

        <div className="jb-result" aria-live="polite">
          <div ref={resultRef}>
            <PayCard r={r} />
          </div>
          <Clock r={r} />
          <Later r={r} />
        </div>

        {share && <ShareBar url={share.url} text={share.text} sub="링크를 받은 사람도 같은 연봉의 결과를 보고, 자기 연봉으로 바꿔 볼 수 있어요." />}

        <AdSlot variant="inline" slot={SLOTS.inline} />

        <Table r={r} />

        <JonberGuide ad={<AdSlot variant="mid" slot={SLOTS.mid} />} />
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
        <p>물건 가격은 회사 발표 판매가와 공공 조사 평균을 돈미터가 옮겨 정리한 참고 자료예요. 매장과 시기에 따라 실제 가격은 다를 수 있어요.</p>
      </footer>

      <FloatingSwitch current={JONBER} hidden={!pastResult} />
      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}

