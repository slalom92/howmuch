import { useEffect, useMemo, useRef, useState } from 'react'
import AdSlot from '../../components/AdSlot.jsx'
import ShareBar from '../../components/ShareBar.jsx'
import { BrandMark } from '../../components/Art.jsx'
import { won } from '../../lib/format.js'
import { track } from '../../lib/analytics.js'
import { FOOTER_MENU, HOME, YOUTUBER } from '../../lib/menu.js'
import { RELATIONS, REGIONS, VENUES, PARTY, RECEIVED, DEFAULTS, calculate, fromSearch, toSearch, normalize } from './gift.js'
import GiftGuide from './GiftGuide.jsx'
import SiteMenu from '../../components/SiteMenu.jsx'
import FloatingLink, { CreatorIncomeIcon } from '../../components/FloatingLink.jsx'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

const PATH = '/wedding-gift/'
const DEFAULT_QUERY = toSearch(normalize(DEFAULTS))
const GIFT_KEYS = ['rel', 'go', 'n', 'venue', 'region', 'got']

// 넓은 화면에 줄지어 보일 링크와, 좁은 화면의 "메뉴" 목록
const GIFT_MENU = [
  { href: YOUTUBER, label: '유튜버 수익 계산기' },
  { href: PATH, label: '축의금 계산기' },
]
const GIFT_ITEMS = [{ href: HOME, label: '돈미터 홈' }, ...GIFT_MENU]

// 부호가 있는 금액 (won()은 음수를 0으로 바꾸므로 따로 처리)
const signed = (n) => (n >= 0 ? `+${won(n)}` : `-${won(-n)}`)

function Choices({ legend, name, options, value, onChange, hint }) {
  return (
    <fieldset className="gift-q">
      <legend className="gift-q__legend">{legend}</legend>
      {hint && <p className="gift-q__hint">{hint}</p>}
      <div className="gift-q__opts">
        {options.map((o) => (
          <label key={o.id} className={`gift-opt${String(value) === String(o.id) ? ' is-on' : ''}`}>
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={o.id}
              checked={String(value) === String(o.id)}
              onChange={() => onChange(o.id)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// 축의금 봉투: 이 화면의 결과
function Envelope({ result }) {
  const { amount, more, bills, verdict, reasons } = result
  const billText = [bills.big && `5만 원권 ${bills.big}장`, bills.small && `1만 원권 ${bills.small}장`].filter(Boolean).join(' + ')
  return (
    <div className="gift-env">
      <p className="gift-env__title" aria-hidden="true">
        祝結婚
      </p>
      <div className="gift-env__body">
        <p className="gift-env__label">적정 축의금</p>
        <p className="gift-env__amount">
          <span className="seal gift-env__seal" aria-hidden="true" key={amount}>
            적정
          </span>
          {won(amount)}
        </p>
        <p className="gift-env__more">
          넉넉하게 하려면 <strong>{won(more)}</strong>
        </p>
        <p className="gift-env__bills">봉투 구성: {billText} (신권이면 더 좋아요)</p>
        <p className={`gift-env__verdict gift-env__verdict--${verdict.key}`}>
          <strong>{verdict.title}</strong> {verdict.text}
        </p>
        {reasons.length > 0 && (
          <ul className="gift-env__reasons">
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// 식대 방어 미터: 축의금 ÷ 식대 (본전 = 100%)
function MealMeter({ result }) {
  const { meal, amount, state, venue, region } = result
  if (!meal) return null
  const rate = Math.max(0, Math.min(2, meal.rate))
  const r = 80
  const cx = 100
  const cy = 96
  const angle = Math.PI * (1 - rate / 2) // 왼쪽 끝 0% → 오른쪽 끝 200%
  const nx = cx + Math.cos(angle) * (r - 14)
  const ny = cy - Math.sin(angle) * (r - 14)
  const ex = cx + Math.cos(angle) * r
  const ey = cy - Math.sin(angle) * r
  const pct = Math.round(meal.rate * 100)
  return (
    <section className="gift-meter" aria-labelledby="gift-meter-title">
      <h2 id="gift-meter-title" className="gift-sec__title">
        식대 방어 미터
      </h2>
      <div className="gift-meter__row">
        <svg className="gift-meter__dial" viewBox="0 -16 200 134" role="img" aria-label={`식대 대비 축의금 ${pct}%`}>
          <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" strokeWidth="14" strokeLinecap="round" style={{ stroke: 'var(--rule)' }} />
          {rate > 0 && (
            <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`} fill="none" strokeWidth="14" strokeLinecap="round" style={{ stroke: meal.rate >= 1 ? 'var(--seal)' : 'var(--muted)' }} />
          )}
          <path d={`M${cx} ${cy - r - 9}v12`} strokeWidth="2" style={{ stroke: 'var(--ink)' }} />
          <text x={cx} y={cy - r - 12} textAnchor="middle" fontSize="10" style={{ fill: 'var(--muted)' }}>
            본전
          </text>
          <line x1={cx} y1={cy} x2={nx.toFixed(2)} y2={ny.toFixed(2)} strokeWidth="3" strokeLinecap="round" style={{ stroke: 'var(--ink)' }} />
          <circle cx={cx} cy={cy} r="6" style={{ fill: 'var(--ink)' }} />
          <text x={cx - r} y={cy + 16} textAnchor="middle" fontSize="10" style={{ fill: 'var(--muted)' }}>
            0%
          </text>
          <text x={cx + r} y={cy + 16} textAnchor="middle" fontSize="10" style={{ fill: 'var(--muted)' }}>
            200%
          </text>
        </svg>
        <div className="gift-meter__text">
          <p className="gift-meter__pct">
            <strong>{pct}%</strong> 방어
          </p>
          <dl className="gift-meter__facts">
            <div>
              <dt>예상 식대</dt>
              <dd>
                {won(meal.perHead)} × {state.n}명 = {won(meal.total)}
              </dd>
            </div>
            <div>
              <dt>축의금</dt>
              <dd>{won(amount)}</dd>
            </div>
            <div>
              <dt>신랑·신부 손익</dt>
              <dd className={meal.balance >= 0 ? 'is-plus' : 'is-minus'}>{signed(meal.balance)}</dd>
            </div>
          </dl>
          <p className="gift-meter__note">
            {region.label} {venue.label} 기준 추정 식대예요. 청첩장이나 예식장 안내에 식대가 나와 있으면 그 금액이 더 정확해요.
          </p>
        </div>
      </div>
    </section>
  )
}

export default function GiftApp() {
  // 서버에서 미리 그릴 때는 기본값, 브라우저에서는 주소의 값으로 시작한다
  const [s, setS] = useState(() => (typeof window === 'undefined' ? DEFAULTS : fromSearch(window.location.search)))
  const result = useMemo(() => calculate(s), [s])
  const set = (k) => (v) => setS((prev) => ({ ...prev, [k]: v }))

  // 고른 값을 주소에 남겨 새로고침·공유해도 같은 결과가 보이게 한다
  useEffect(() => {
    // 기본값 그대로면 주소를 깔끔하게 /wedding-gift/ 로 둔다.
    // 계산기 값만 바꾸고 다른 값(utm_source 같은 유입 추적 값)은 그대로 둔다.
    const url = new URL(window.location.href)
    for (const k of GIFT_KEYS) url.searchParams.delete(k)
    const q = toSearch(result.state)
    if (q !== DEFAULT_QUERY) for (const [k, v] of new URLSearchParams(q)) url.searchParams.set(k, v)
    if (url.href !== window.location.href) window.history.replaceState(null, '', url)
  }, [result.state])

  // 계산 결과 보기 이벤트 (선택을 바꿀 때마다 보내지 않도록 잠깐 기다린다)
  useEffect(() => {
    const t = setTimeout(() => {
      track('gift_calc', { relation: s.rel, attend: s.go ? 1 : 0, party: s.n, venue: s.venue, region: s.region, amount: result.amount })
    }, 1500)
    return () => clearTimeout(t)
  }, [s, result.amount])

  // 결과 봉투가 화면 아래(아직 안 보임) / 화면 안 / 위로 지나감 중 어디에 있는지
  // 아래에 있으면 하단 요약 바를 띄우고, 다른 계산기 바로가기는 숨긴다 (서로 겹치지 않게)
  const resultRef = useRef(null)
  const [resultPos, setResultPos] = useState(null) // null(아직 모름) | 'below' | 'visible' | 'above'
  useEffect(() => {
    const el = resultRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setResultPos('visible')
        else setResultPos(e.boundingClientRect.top > 0 ? 'below' : 'above')
      },
      // 봉투 윗부분 120px 정도가 보이면 "보인다"로 친다
      { rootMargin: '0px 0px -120px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const scrollToResult = () => {
    const el = resultRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    track('gift_bar_click', { amount: result.amount })
  }

  const share = useMemo(() => {
    if (typeof window === 'undefined') return null
    const url = new URL(PATH, window.location.origin)
    url.search = toSearch(result.state)
    const who = result.relation.label
    const how = s.go ? `${result.region.label} ${result.venue.label}에 ${s.n > 1 ? `${s.n}명이 ` : ''}참석` : '봉투만'
    return { url: url.toString(), text: `${who} 결혼식, ${how}이면 축의금 ${won(result.amount)} | 돈미터 축의금 계산기` }
  }, [result, s.go, s.n])

  return (
    <div className="page">
      <header className="masthead">
        <a className="brand" href="/">
          <BrandMark />
          돈미터
        </a>
        <nav className="topnav" aria-label="주요 메뉴">
          <SiteMenu current={PATH} items={GIFT_ITEMS} links={GIFT_MENU} />
          <button type="button" className="theme-pick__toggle" data-theme-toggle aria-expanded="false" aria-controls="theme-menu" aria-label="화면 색 바꾸기">
            <span className="theme-pick__dot" aria-hidden="true" />
            테마
          </button>
        </nav>
      </header>

      <AdSlot variant="top" slot={SLOTS.top} />

      <main className="main">
        <section className="hero gift-hero">
          <div className="hero__text">
            <h1 className="hero__title">축의금, 얼마 내야 할까?</h1>
            <p className="hero__lede">관계와 예식장만 고르면 요즘 시세로 적정 축의금과 신랑·신부의 식대 손익까지 계산해 드려요.</p>
          </div>
        </section>

        <form className="gift-form" onSubmit={(e) => e.preventDefault()} aria-label="축의금 조건">
          <Choices legend="어떤 사이인가요?" name="rel" options={RELATIONS} value={s.rel} onChange={set('rel')} />
          <Choices
            legend="결혼식에 가나요?"
            name="go"
            options={[
              { id: '1', label: '직접 참석' },
              { id: '0', label: '봉투만 보내기' },
            ]}
            value={s.go ? '1' : '0'}
            onChange={(v) => set('go')(v === '1')}
          />
          {s.go && (
            <>
              <Choices legend="몇 명이 가나요?" name="n" options={PARTY} value={s.n} onChange={(v) => set('n')(Number(v))} hint="나를 포함해 식사하는 사람 수예요." />
              <Choices legend="예식장은 어디인가요?" name="venue" options={VENUES} value={s.venue} onChange={set('venue')} />
              <Choices legend="어느 지역인가요?" name="region" options={REGIONS} value={s.region} onChange={set('region')} />
            </>
          )}
          <Choices
            legend="내 결혼식 때 이 사람에게 받은 축의금"
            name="got"
            hint="받은 적이 있다면 그보다 적게 내지 않는 게 기본이에요."
            options={RECEIVED.map((v) => ({ id: v, label: v ? won(v) : '없음·모름' }))}
            value={s.got}
            onChange={(v) => set('got')(Number(v))}
          />
        </form>

        <div className="gift-result" aria-live="polite" ref={resultRef}>
          <Envelope result={result} />
          <MealMeter result={result} />
          <p className="gift-avg">
            작년 축의금 이체 평균은 <strong>11만 7천 원</strong>이에요. 이 금액은 평균의{' '}
            <strong>{result.vsAvg >= 0.95 && result.vsAvg <= 1.05 ? '비슷한 수준' : `${Math.round(result.vsAvg * 100)}%`}</strong>
            {result.vsAvg > 1.05 ? '로 평균보다 넉넉해요.' : result.vsAvg < 0.95 ? '로 평균보다 가벼워요.' : '이에요.'}
          </p>
        </div>

        {share && <ShareBar url={share.url} text={share.text} sub="링크를 받은 사람도 같은 조건의 결과를 보고, 자기 상황으로 바꿔 계산해 볼 수 있어요." />}

        <AdSlot variant="inline" slot={SLOTS.inline} />

        <GiftGuide />
      </main>

      <footer className="footer">
        <ul className="footer__links">
          {FOOTER_MENU.map((m) => (
            <li key={m.href}>
              <a href={m.href}>{m.label}</a>
            </li>
          ))}
        </ul>
        <p>축의금 금액은 공개된 설문과 통계를 바탕으로 돈미터가 정리한 참고용 기준이에요. 정답은 없으니 서로의 사정에 맞게 정하세요.</p>
      </footer>

      {/* 결과가 아직 아래에 있을 때: 고를 때마다 금액이 바로 보이는 요약 바 */}
      <button
        type="button"
        className={`gift-bar${resultPos === 'below' ? ' is-on' : ''}`}
        onClick={scrollToResult}
        tabIndex={resultPos === 'below' ? 0 : -1}
        aria-hidden={resultPos === 'below' ? undefined : true}
      >
        <span className="gift-bar__label">적정 축의금</span>
        <span className="gift-bar__amount" key={result.amount}>
          {won(result.amount)}
        </span>
        <span className={`gift-bar__verdict gift-bar__verdict--${result.verdict.key}`}>{result.verdict.title}</span>
        <span className="gift-bar__go" aria-hidden="true">
          결과 보기
          <svg viewBox="0 0 16 16" focusable="false">
            <path d="M8 3v10M3.5 8.5L8 13l4.5-4.5" />
          </svg>
        </span>
      </button>

      <FloatingLink
        href={YOUTUBER}
        title="유튜버 수익은?"
        sub="한 달 광고 수익 계산"
        icon={<CreatorIncomeIcon />}
        hidden={resultPos === null || resultPos === 'below'}
      />

      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}
