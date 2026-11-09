import { useEffect, useMemo, useRef, useState } from 'react'
import AdSlot, { AdRails } from '../../components/AdSlot.jsx'
import ShareBar from '../../components/ShareBar.jsx'
import { BrandMark } from '../../components/Art.jsx'
import { useGrowOnView, CountUp } from '../../components/Motion.jsx'
import SiteMenu from '../../components/SiteMenu.jsx'
import FloatingSwitch from '../../components/FloatingSwitch.jsx'
import { track } from '../../lib/analytics.js'
import { FOOTER_MENU, MENU, YOUTUBER, WEDDING_GIFT, KBO, KLPGA, KPGA, PGA, LPGA } from '../../lib/menu.js'
import { WORKER_YEAR } from './golf.js'
import KlpgaGuide from './KlpgaGuide.jsx'
import KlpgaImageShare from './KlpgaImageShare.jsx'
import SocialLinks from '../../components/Social.jsx'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  // PC 좌우 배너용 단위가 따로 없으면 상단 배너 단위를 같이 쓴다
  rail: import.meta.env.VITE_AD_SLOT_RAIL || import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

// KLPGA, KPGA, PGA, LPGA 투어가 같은 화면을 쓴다. T 는 klpga.js, ../kpga/kpga.js, ../pga/pga.js, ../lpga/lpga.js 가 만든 투어 자료.
// 넓은 화면에 줄지어 보일 링크와, 좁은 화면의 "메뉴" 목록
const golfMenu = (T) => [
  { href: YOUTUBER, label: '유튜버 수익 계산기' },
  { href: WEDDING_GIFT, label: '축의금 계산기' },
  { href: KBO, label: '프로야구 선수 연봉' },
  { href: T.path, label: `${T.text.who} 선수 상금` },
]
const GOLF_ITEMS = MENU.slice(0, 9)

// 원 단위 금액을 "16억 2,844만 원", "4,500만 원", "11만 8천 원", "52원" 처럼 쓴다
export function krw(n) {
  if (!Number.isFinite(n)) return '-'
  const v = Math.max(0, n)
  if (v >= 1e8) {
    let eok = Math.floor(v / 1e8)
    let man = Math.round((v - eok * 1e8) / 1e4)
    if (man >= 10000) {
      eok += 1
      man = 0
    }
    return `${eok.toLocaleString('ko-KR')}억${man ? ` ${man.toLocaleString('ko-KR')}만` : ''} 원`
  }
  if (v >= 1e4 && v < 1e6) {
    const chun = Math.round(v / 1e3)
    const man = Math.floor(chun / 10)
    return `${man}만${chun % 10 ? ` ${chun % 10}천` : ''} 원`
  }
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString('ko-KR')}만 원`
  return `${Math.round(v).toLocaleString('ko-KR')}원`
}

// 달러 금액 ("$30,937,525", 어림값은 "약 $15,100,000")
const usd = (p) => `${p.rounded ? '약 ' : ''}$${p.usd.toLocaleString('en-US')}`

// 순위표에 쓰는 짧은 금액 ("16.3억")
const eok = (won) => `${(Math.round(won / 1e7) / 10).toLocaleString('ko-KR')}억`

function times(r) {
  if (r >= 1.05) return `${r >= 100 ? Math.round(r).toLocaleString('ko-KR') : r >= 10 ? Math.round(r) : r.toFixed(1)}배`
  if (r >= 0.95) return '비슷'
  return `${Math.round(r * 100)}%`
}

const roundYears = (y) => (y < 10 ? Math.round(y * 10) / 10 : Math.round(y))
// 직장인 한 달 월급(연 4,500만 원 ÷ 12)을 몇 타 만에 버나
const strokesForMonth = (perStroke) => {
  const n = WORKER_YEAR / 12 / perStroke
  return (n < 10 ? Math.round(n * 10) / 10 : Math.round(n)).toLocaleString('ko-KR')
}

// 주소의 ?name= 선수 (없거나 모르는 이름이면 null)
function readName(T) {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search).get('name')
  return (q && T.findExact(q)?.name) || null
}

// ---------- 이름 찾기 ----------

function PlayerSearch({ T, onPick }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [miss, setMiss] = useState('')
  const list = useMemo(() => T.suggest(q), [T, q])

  const pick = (p, how) => {
    setQ('')
    setOpen(false)
    setMiss('')
    onPick(p.name, how)
  }

  const submit = (e) => {
    e.preventDefault()
    const p = (open && list[active]) || T.findExact(q) || list[0]
    if (p) return pick(p, 'search')
    if (q.trim()) {
      setMiss(q.trim())
      track('golf_miss', { search_term: q.trim(), tour: T.id })
    }
  }

  const onKey = (e) => {
    if (!list.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % list.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i - 1 + list.length) % list.length)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const show = open && q.trim() && list.length > 0
  return (
    <form className="kbo-search" role="search" onSubmit={submit}>
      <label className="sr-only" htmlFor="klpga-q">
        선수 이름
      </label>
      <div className="kbo-search__box">
        <input
          id="klpga-q"
          className="kbo-search__input"
          type="search"
          autoComplete="off"
          placeholder={`선수 이름 (예: ${T.text.example})`}
          value={q}
          role="combobox"
          aria-expanded={show ? 'true' : 'false'}
          aria-controls="klpga-q-list"
          aria-activedescendant={show ? `klpga-opt-${active}` : undefined}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            setActive(0)
            setMiss('')
          }}
          onKeyDown={onKey}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        />
        <button type="submit" className="kbo-search__go">
          상금 보기
        </button>
        {show && (
          <ul className="kbo-search__list" id="klpga-q-list" role="listbox" aria-label="찾은 선수">
            {list.map((p, i) => (
              <li
                key={p.name}
                id={`klpga-opt-${i}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'is-on' : undefined}
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(p, 'suggest')
                }}
                onMouseEnter={() => setActive(i)}
              >
                <strong>{p.name}</strong>
                <span>{p.team}</span>
                <em>{eok(p.prize)}</em>
              </li>
            ))}
          </ul>
        )}
      </div>
      {miss && (
        <p className="kbo-search__miss" role="status">
          ‘{miss}’ 선수는 아직 정리하지 않았어요. 시즌 결산 보도로 최종 상금이 확인된 선수부터 차례로 넣고 있어요. 아래 순위에서 골라 보세요.
        </p>
      )}
    </form>
  )
}

// ---------- 결과: 스코어카드 ----------

// 골프 스코어카드의 홀 칸처럼, 시즌 상금을 시간 단위 칸으로 나눈다
const COLS = [
  { key: 'year', label: '시즌' },
  { key: 'month', label: '한 달' },
  { key: 'tourDay', label: '투어 하루' },
  { key: 'day', label: '하루' },
  { key: 'hour', label: '1시간' },
  { key: 'second', label: '1초' },
]

function Scorecard({ pr }) {
  const { T, player, b, rank } = pr
  const rows = [
    { label: player.name, sub: `상금 ${rank}위`, b, me: true },
    { label: '직장인 평균', sub: '연 4,500만', b: T.breakdown(WORKER_YEAR) },
  ]
  return (
    <div className="kbo-board klpga-card">
      <div className="kbo-board__head">
        <p className="kbo-board__team">
          {T.SEASON} {T.text.org} 투어 · {player.team}
        </p>
        <h2 className="kbo-board__name">{player.name}</h2>
        <p className="kbo-board__pay">
          <span className="kbo-board__pay-label">{T.SEASON} 상금</span>
          <strong>
            {player.rounded ? '약 ' : ''}
            <CountUp value={player.prize} format={krw} />
          </strong>
        </p>
        {player.usd && (
          <p className="golf-usd">
            {usd(player)} · 1달러 {T.USD_KRW.toLocaleString('ko-KR')}원({T.FX_DATE} 종가)으로 바꾼 금액
          </p>
        )}
        {(player.wins > 0 || player.titles.length > 0) && (
          <ul className="klpga-tags" aria-label="올해 기록">
            {player.wins > 0 && <li>{player.wins}승</li>}
            {player.titles.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="kbo-board__wide">
        <table className="kbo-board__table">
          <caption className="sr-only">{player.name} 시즌 상금을 한 달, 투어 하루, 하루, 시간, 초 단위로 나눈 표</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">구분</span>
              </th>
              {COLS.map((c) => (
                <th scope="col" key={c.key}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className={r.me ? 'is-me' : undefined}>
                <th scope="row">
                  {r.label}
                  <span>{r.sub}</span>
                </th>
                {COLS.map((c) => (
                  <td key={c.key}>{krw(r.b[c.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="kbo-board__narrow">
        <table className="kbo-board__table kbo-board__table--tall">
          <caption className="sr-only">{player.name} 시즌 상금을 한 달, 투어 하루, 하루, 시간, 초 단위로 나눈 표</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">단위</span>
              </th>
              {rows.map((r) => (
                <th scope="col" key={r.label} className={r.me ? 'is-me' : undefined}>
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COLS.map((c) => (
              <tr key={c.key}>
                <th scope="row">{c.label}</th>
                {rows.map((r) => (
                  <td key={r.label} className={r.me ? 'is-me' : undefined}>
                    {krw(r.b[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="kbo-board__foot">
        투어 하루는 {T.text.days} {T.TOUR_DAYS}일, 하루·1시간·1초는 1년 365일로 나눴어요. 후원 계약금과 광고 수입은 빠진 공식 상금만의 금액이에요.
      </p>
    </div>
  )
}

// 한 줄 요약: 직장인 평균 연봉 몇 년 치를 한 시즌에 벌었나
function Headline({ pr }) {
  const { T, player, workerYears, daysForWorkerYear, perStroke } = pr
  const d = Math.max(1, Math.round(daysForWorkerYear))
  return (
    <p className="kbo-headline">
      <strong>{player.name}</strong> 선수는 직장인 평균 연봉 <strong>{roundYears(workerYears)}년 치</strong>를 한 시즌에 벌었어요. 투어가 열린 {T.TOUR_DAYS}일로 나누면 직장인 연봉 1년 치를 <strong>{d}일</strong>마다 번 셈이에요.
      {perStroke && (
        <>
          {' '}
          한 대회를 {T.PAR}타씩 {T.ROUNDS}라운드 친다고 보면 <strong>1타에 {krw(perStroke)}</strong>, 직장인 한 달 월급(375만 원)을 <strong>{strokesForMonth(perStroke)}타</strong>마다 번 셈이에요.
        </>
      )}
    </p>
  )
}

// ---------- 골프로 보면 ----------

function GolfFacts({ pr }) {
  const { T, player, perEvent, perStroke, b, rank } = pr
  // 출전 대회 수가 알려진 선수는 '대회 하나에'와 '1타에'를, 모르면 상금 순위와 투어 하루를 보여 준다
  const items = [
    ...(perEvent
      ? [
          { label: '대회 하나에', won: krw(perEvent), n: `출전 ${player.events}개 대회 평균` },
          { label: '1타에', won: krw(perStroke), n: `한 대회 ${T.PAR}타 × ${T.ROUNDS}라운드 기준` },
        ]
      : [
          { label: '시즌 상금 순위', won: `${rank}위`, n: `${T.SEASON} ${T.text.org} 투어` },
          { label: '투어 하루에', won: krw(b.tourDay), n: `시즌 ${T.TOUR_DAYS}일 기준` },
        ]),
    player.wins === null || player.wins === undefined
      ? { label: '달러로는', won: usd(player), n: `1달러 = ${T.USD_KRW.toLocaleString('ko-KR')}원` }
      : { label: '우승', won: player.wins ? `${player.wins}번` : '없음', n: T.EVENTS_HELD ? `올해 열린 ${T.EVENTS_HELD}개 대회 중` : `${T.SEASON} 시즌` },
    { label: '최종전 우승 상금의', won: times(player.prize / T.FINAL_WIN), n: `우승 상금 ${T.FINAL_WIN_USD ? `${(T.FINAL_WIN_USD / 1e4).toLocaleString('ko-KR')}만 달러` : krw(T.FINAL_WIN)} 기준` },
  ]
  return (
    <section className="kbo-rec" aria-labelledby="klpga-rec-title">
      <h2 className="kbo-rec__title" id="klpga-rec-title">
        골프로 보면
      </h2>
      <ul className="kbo-rec__grid kbo-rec__grid--4">
        {items.map((it) => (
          <li key={it.label}>
            <span className="kbo-rec__label">{it.label}</span>
            <strong className="kbo-rec__won">{it.won}</strong>
            <span className="kbo-rec__n">{it.n}</span>
          </li>
        ))}
      </ul>
      <p className="kbo-rec__note">상금은 대회 순위에 따라 받아요. 컷을 통과하지 못하면 그 대회 상금은 없어요. 그래서 같은 우승 수라도 어느 대회에서 몇 위를 했는지에 따라 시즌 상금이 크게 달라요.</p>
    </section>
  )
}

// ---------- 그래프 ----------

function Bars({ title, rows, note, id }) {
  const max = Math.max(...rows.map((r) => r.value))
  const growRef = useGrowOnView()
  return (
    <section className="kbo-card" aria-labelledby={id}>
      <h2 className="kbo-card__title" id={id}>
        {title}
      </h2>
      <ul className="kbo-bars" ref={growRef}>
        {rows.map((r, i) => (
          <li key={r.label} className={r.me ? 'is-me' : undefined} style={{ '--i': i }}>
            <span className="kbo-bars__label">{r.label}</span>
            <span className="kbo-bars__track" aria-hidden="true">
              <span className="kbo-bars__fill" style={{ width: `${Math.max(0.6, (r.value / max) * 100)}%` }} />
            </span>
            <span className="kbo-bars__value">
              {r.short || krw(r.value)}
              {r.tag && <em>{r.tag}</em>}
            </span>
          </li>
        ))}
      </ul>
      {note && <p className="kbo-card__note">{note}</p>}
    </section>
  )
}

function Compare({ pr }) {
  const { T, player } = pr
  const top = T.PLAYERS[0]
  const rows = [{ label: player.name, value: player.prize, me: true }]
  if (top !== player) rows.push({ label: '상금왕', value: top.prize, tag: times(player.prize / top.prize) })
  rows.push({ label: '최종전 우승', value: T.FINAL_WIN, tag: times(player.prize / T.FINAL_WIN) })
  rows.push({ label: '직장인 평균', value: WORKER_YEAR, tag: times(player.prize / WORKER_YEAR) })
  return <Bars id="klpga-cmp" title="누구랑 비교하면?" rows={rows} note="오른쪽 숫자는 이 선수 상금이 각 기준의 몇 배인지예요. 직장인 평균은 국가데이터처 2024년 임금근로일자리 평균 소득(월 375만 원)을 1년으로 늘린 값이에요." />
}

function Sources({ T, ids }) {
  return (
    <p className="kbo-src">
      출처:{' '}
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && ', '}
          <a href={T.SOURCES[id].url} target="_blank" rel="noopener noreferrer">
            {T.SOURCES[id].label}
          </a>
        </span>
      ))}
    </p>
  )
}

// ---------- 순위 ----------

function Ranking({ T, current, onPick }) {
  return (
    <section className="kbo-card kbo-rank" aria-labelledby="klpga-rank">
      <h2 className="kbo-card__title" id="klpga-rank">
        {T.SEASON} {T.text.org} 시즌 상금 순위
      </h2>
      <p className="kbo-card__lede">{T.text.rankLede}</p>
      <ol className="kbo-rank__list">
        {T.PLAYERS.map((p, i) => (
          <li key={p.name}>
            <a
              href={`${T.path}?name=${encodeURIComponent(p.name)}`}
              className={p.name === current ? 'is-on' : undefined}
              aria-current={p.name === current ? 'true' : undefined}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return
                e.preventDefault()
                onPick(p.name, 'rank')
              }}
            >
              <span className="kbo-rank__no">{i + 1}</span>
              <span className="kbo-rank__who">
                <strong>{p.name}</strong>
                <span>
                  {p.team}
                  {p.wins === null || p.wins === undefined ? '' : ` · ${p.wins}승`}
                </span>
              </span>
              <span className="kbo-rank__pay">{krw(p.prize).replace(/ 원$/, '')}</span>
            </a>
          </li>
        ))}
      </ol>
      <p className="kbo-card__note">{T.text.rankNote}</p>
    </section>
  )
}

// ---------- 화면 ----------

// 투어 바꾸기: 여자 KLPGA, 남자 KPGA, 미국 PGA, 미국 LPGA (각자 주소가 따로 있어 링크로 옮겨 간다)
function TourTabs({ T }) {
  const tabs = [
    { href: KLPGA, label: '여자 KLPGA' },
    { href: KPGA, label: '남자 KPGA' },
    { href: PGA, label: '미국 PGA' },
    { href: LPGA, label: '미국 LPGA' },
  ]
  return (
    <nav className="golf-tabs" aria-label="투어 고르기">
      {tabs.map((t) => (
        <a key={t.href} href={t.href} aria-current={t.href === T.path ? 'page' : undefined} onClick={() => t.href !== T.path && track('golf_tour', { to: t.href })}>
          {t.label}
        </a>
      ))}
    </nav>
  )
}

export default function GolfApp({ T }) {
  // 검색 로봇용으로 미리 그리는 첫 화면은 상금 1위로 고정하고, 방문자 브라우저에서는 목록 중 한 명을 무작위로 보여 준다.
  const defaultName = T.PLAYERS[0].name
  const [startName] = useState(() => (typeof window === 'undefined' ? defaultName : T.PLAYERS[Math.floor(Math.random() * T.PLAYERS.length)]?.name || defaultName))
  const [name, setName] = useState(() => readName(T) || startName)
  const pr = useMemo(() => T.profile(T.findExact(name) || T.PLAYERS[0]), [T, name])
  const resultRef = useRef(null)
  const baseTitle = useRef('')
  // 결과 스코어카드를 지나 아래로 내려간 뒤에만 다른 계산기 바로가기를 띄운다
  const [pastResult, setPastResult] = useState(false)
  useEffect(() => {
    const el = resultRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setPastResult(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const choose = (n, how) => {
    setName(n)
    track('golf_view', { player: n, via: how, tour: T.id })
    requestAnimationFrame(() => {
      const el = resultRef.current
      if (!el) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    })
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    if (name === startName && !readName(T)) url.searchParams.delete('name')
    else url.searchParams.set('name', name)
    if (url.href !== window.location.href) window.history.replaceState(null, '', url)
    if (!baseTitle.current) baseTitle.current = document.title
    document.title = name === startName && !readName(T) ? baseTitle.current : `${name} 상금 ${pr.player.rounded ? '약 ' : ''}${krw(pr.player.prize)}, 하루에 ${krw(pr.b.day)} | 돈미터`
  }, [name, pr])

  useEffect(() => {
    const onPop = () => setName(readName(T) || startName)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const share = useMemo(() => {
    if (typeof window === 'undefined') return null
    const url = new URL(T.path, window.location.origin)
    url.searchParams.set('name', pr.player.name)
    return {
      url: url.toString(),
      text: `${pr.player.name} ${T.SEASON} 상금 ${pr.player.rounded ? '약 ' : ''}${krw(pr.player.prize)}, 직장인 연봉 ${roundYears(pr.workerYears)}년 치 | 돈미터`,
    }
  }, [pr])

  return (
    <div className="page">
      <header className="masthead">
        <a className="brand" href="/">
          <BrandMark />
          돈미터
        </a>
        <nav className="topnav" aria-label="주요 메뉴">
          <SiteMenu current={T.path} items={GOLF_ITEMS} links={golfMenu(T)} />
          <button type="button" className="theme-pick__toggle" data-theme-toggle aria-expanded="false" aria-controls="theme-menu" aria-label="화면 색 바꾸기">
            <span className="theme-pick__dot" aria-hidden="true" />
            테마
          </button>
        </nav>
      </header>

      {/* PC: 본문 좌우 세로 배너 / 모바일: 이 자리 대신 본문 중간 광고(mid) */}
      <AdRails slot={SLOTS.rail} />

      <main className="main">
        <section className="hero kbo-hero">
          <TourTabs T={T} />
          <div className="hero__text">
            <h1 className="hero__title">{T.text.title}</h1>
            <p className="hero__lede">{T.text.lede}</p>
          </div>
          <PlayerSearch T={T} onPick={choose} />
          <ul className="kbo-picks" aria-label="상금 상위 선수">
            {T.PLAYERS.map((p) => (
              <li key={p.name}>
                <button type="button" className={p.name === name ? 'is-on' : undefined} onClick={() => choose(p.name, 'pick')}>
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="kbo-result" ref={resultRef} aria-live="polite">
          <Scorecard pr={pr} />
          <Headline pr={pr} />
          <GolfFacts pr={pr} />
          {pr.player.note && <p className="kbo-note">{pr.player.note}</p>}
          <Sources T={T} ids={pr.player.src} />
          {share && <KlpgaImageShare pr={pr} caption={share.text.replace(/ \| 돈미터$/, '')} />}
          <Compare pr={pr} />
        </div>

        {share && <ShareBar url={share.url} text={share.text} sub="링크를 받은 사람도 같은 선수의 상금을 보고, 다른 선수로 바꿔 볼 수 있어요." />}

        <AdSlot variant="inline" slot={SLOTS.inline} />

        <Ranking T={T} current={name} onPick={choose} />

        <AdSlot variant="mid" slot={SLOTS.top} />

        <KlpgaGuide T={T} />
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
        <p>{T.text.footer}</p>
      </footer>

      {/* 다른 계산기 바로가기에서는 여자·남자 골프를 한 항목으로 본다 */}
      <FloatingSwitch current={KLPGA} hidden={!pastResult} />

      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}
