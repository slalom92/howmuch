import { useEffect, useMemo, useRef, useState } from 'react'
import AdSlot, { AdRails } from '../../components/AdSlot.jsx'
import ShareBar from '../../components/ShareBar.jsx'
import { BrandMark } from '../../components/Art.jsx'
import { useGrowOnView, CountUp } from '../../components/Motion.jsx'
import SiteMenu from '../../components/SiteMenu.jsx'
import FloatingSwitch from '../../components/FloatingSwitch.jsx'
import { track } from '../../lib/analytics.js'
import { FOOTER_MENU, MENU, YOUTUBER, WEDDING_GIFT, KBO, KLPGA } from '../../lib/menu.js'
import { SEASON, GAMES, INNINGS, LEAGUE, TEAMS, TEAM_BY_ID, PLAYERS, SOURCES, WORKER_YEAR, PITCHES_PER_INNING, PITCH_SOURCE, STATS_SOURCE, breakdown, profile, findExact, suggest } from './kbo.js'
import KboGuide from './KboGuide.jsx'
import KboImageShare from './KboImageShare.jsx'
import SocialLinks from '../../components/Social.jsx'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  // PC 좌우 배너용 단위가 따로 없으면 상단 배너 단위를 같이 쓴다
  rail: import.meta.env.VITE_AD_SLOT_RAIL || import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

const PATH = KBO
// 검색 로봇용으로 미리 그리는 첫 화면은 연봉 1위(양의지)로 고정하고,
// 방문자 브라우저에서는 연봉 1억 원 이상이면서 올해 1군 기록이 있고 어림값이 아닌 선수 중 한 명을 무작위로 보여 준다.
const DEFAULT_NAME = PLAYERS[0].name
const RANDOM_POOL = PLAYERS.filter((p) => p.pay >= 10000 && p.stats && !p.approx).map((p) => p.name)
const pickRandom = () => RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)] || DEFAULT_NAME
const MAN = 10000

const KBO_MENU = [
  { href: YOUTUBER, label: '유튜버 수익 계산기' },
  { href: WEDDING_GIFT, label: '축의금 계산기' },
  { href: PATH, label: '프로야구 선수 연봉' },
  { href: KLPGA, label: '골프 선수 상금' },
]
// 좁은 화면의 "메뉴": 홈과 계산기 전부 (여자·남자 골프 따로)
const KBO_ITEMS = MENU.slice(0, 9)

// 처음 화면에 보여 줄 이름 단추 (연봉이 큰 선수와 화제가 된 선수를 섞는다)
const PICKS = ['양의지', '류현진', '김광현', '노시환', '김도영', '안현민', '원태인', '김택연']

// 원 단위 금액을 "1억 7,536만 원", "2,917만 원", "133원" 처럼 쓴다
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
  // 100만 원 밑은 천 원 자리까지 ("11만 8천 원")
  if (v >= 1e4 && v < 1e6) {
    const chun = Math.round(v / 1e3)
    const man = Math.floor(chun / 10)
    return `${man}만${chun % 10 ? ` ${chun % 10}천` : ''} 원`
  }
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString('ko-KR')}만 원`
  return `${Math.round(v).toLocaleString('ko-KR')}원`
}

// 만 원 단위 금액
const krwMan = (man) => krw(man * MAN)

// 배수: 1.05 이상이면 "N배", 그 밑은 "N%"
function times(r) {
  if (r >= 1.05) return `${r >= 100 ? Math.round(r).toLocaleString('ko-KR') : r >= 10 ? Math.round(r) : r.toFixed(1)}배`
  if (r >= 0.95) return '비슷'
  return `${Math.round(r * 100)}%`
}

const pct = (r) => `${r > 0 ? '+' : ''}${Math.round(r * 1000) / 10}%`

// 주소의 ?name= 선수 (없거나 모르는 이름이면 null)
function readName() {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search).get('name')
  return (q && findExact(q)?.name) || null
}

// ---------- 이름 찾기 ----------

function PlayerSearch({ onPick }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [miss, setMiss] = useState('')
  const list = useMemo(() => suggest(q), [q])

  const pick = (p, how) => {
    setQ('')
    setOpen(false)
    setMiss('')
    onPick(p.name, how)
  }

  const submit = (e) => {
    e.preventDefault()
    const p = (open && list[active]) || findExact(q) || list[0]
    if (p) return pick(p, 'search')
    if (q.trim()) {
      setMiss(q.trim())
      track('kbo_miss', { search_term: q.trim() })
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
      <label className="sr-only" htmlFor="kbo-q">
        선수 이름
      </label>
      <div className="kbo-search__box">
        <input
          id="kbo-q"
          className="kbo-search__input"
          type="search"
          autoComplete="off"
          placeholder="선수 이름 (예: 양의지)"
          value={q}
          role="combobox"
          aria-expanded={show ? 'true' : 'false'}
          aria-controls="kbo-q-list"
          aria-activedescendant={show ? `kbo-opt-${active}` : undefined}
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
          연봉 보기
        </button>
        {show && (
          <ul className="kbo-search__list" id="kbo-q-list" role="listbox" aria-label="찾은 선수">
            {list.map((p, i) => (
              <li
                key={p.name}
                id={`kbo-opt-${i}`}
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
                <span>
                  {TEAM_BY_ID[p.team].name} {p.pos}
                </span>
                <em>{krwMan(p.pay)}</em>
              </li>
            ))}
          </ul>
        )}
      </div>
      {miss && (
        <p className="kbo-search__miss" role="status">
          ‘{miss}’ 선수는 아직 정리하지 않았어요. KBO 선수 정보나 구단 발표로 연봉을 확인한 선수부터 차례로 넣고 있어요. 아래 순위에서 골라 보세요.
        </p>
      )}
    </form>
  )
}

// ---------- 결과: 전광판 ----------

// 야구장 전광판의 이닝별 점수판처럼, 연봉을 시간 단위 칸으로 나눈다
const COLS = [
  { key: 'year', label: '시즌' },
  { key: 'game', label: '1경기' },
  { key: 'inning', label: '1이닝' },
  { key: 'day', label: '하루' },
  { key: 'hour', label: '1시간' },
  { key: 'second', label: '1초' },
]

function Scoreboard({ pr }) {
  const { player, team, b } = pr
  const rows = [
    { label: player.name, sub: team.name, b, me: true },
    { label: '리그 평균', sub: `${LEAGUE.players}명`, b: breakdown(LEAGUE.average) },
    { label: '직장인 평균', sub: '연 4,500만', b: breakdown(WORKER_YEAR) },
  ]
  return (
    <div className="kbo-board">
      <div className="kbo-board__head">
        <p className="kbo-board__team">
          {SEASON} {team.full} {player.pos}
        </p>
        <h2 className="kbo-board__name">{player.name}</h2>
        <p className="kbo-board__pay">
          <span className="kbo-board__pay-label">{SEASON} 연봉</span>
          <strong>
            <CountUp value={player.pay} format={krwMan} />
          </strong>
          {player.approx && <span className="kbo-board__approx">어림값</span>}
        </p>
      </div>
      {/* 넓은 화면: 이닝별 점수판처럼 시간 단위를 가로로 */}
      <div className="kbo-board__wide">
        <table className="kbo-board__table">
          <caption className="sr-only">
            {player.name} 연봉을 경기, 이닝, 하루, 시간, 초 단위로 나눈 표
          </caption>
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
      {/* 좁은 화면: 같은 표를 세로로 */}
      <div className="kbo-board__narrow">
        <table className="kbo-board__table kbo-board__table--tall">
          <caption className="sr-only">
            {player.name} 연봉을 경기, 이닝, 하루, 시간, 초 단위로 나눈 표
          </caption>
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
        정규시즌 {GAMES}경기, 경기당 {INNINGS}이닝, 1년 365일로 나눴어요. 계약금과 옵션은 빠진 연봉만의 금액이에요.
      </p>
    </div>
  )
}

// 한 줄 요약: 직장인 평균 연봉을 몇 경기 만에 버는지
function Headline({ pr }) {
  const { player, gamesForWorkerYear: g, b } = pr
  let text
  if (g <= 1) {
    text = (
      <>
        <strong>{player.name}</strong> 선수는 <strong>한 경기</strong>에 직장인 평균 연봉의 <strong>{times(b.game / (WORKER_YEAR * MAN))}</strong>를 벌어요.
      </>
    )
  } else {
    const n = g < 10 ? Math.round(g * 10) / 10 : Math.round(g)
    text = (
      <>
        <strong>{player.name}</strong> 선수는 직장인 평균 연봉을 <strong>{n}경기</strong> 만에 벌어요.
        {n <= GAMES ? ` 시즌 ${GAMES}경기의 ${Math.round((n / GAMES) * 100)}%만 뛰면 되는 셈이에요.` : ''}
      </>
    )
  }
  return <p className="kbo-headline">{text}</p>
}

// ---------- 기록으로 보면 ----------

// 올해 연봉을 올해 기록으로 나눈다 (안타 하나에, 공 하나에 …)
function Records({ pr }) {
  const { player, rec } = pr
  if (!rec) {
    return (
      <section className="kbo-rec" aria-labelledby="kbo-rec-title">
        <h2 className="kbo-rec__title" id="kbo-rec-title">
          {SEASON} 기록으로 보면
        </h2>
        <p className="kbo-rec__empty">{player.statsNote || `${player.name} 선수는 ${SEASON} 정규시즌 1군 기록이 없어 기록 하나당 금액을 낼 수 없어요.`}</p>
      </section>
    )
  }
  const src = player.tving ? STATS_SOURCE(player.tving) : null
  return (
    <section className="kbo-rec" aria-labelledby="kbo-rec-title">
      <h2 className="kbo-rec__title" id="kbo-rec-title">
        {SEASON} 기록으로 보면
      </h2>
      <p className="kbo-rec__line">{rec.line}</p>
      <ul className={`kbo-rec__grid kbo-rec__grid--${rec.items.length}`}>
        {rec.items.map((it) => (
          <li key={it.label} className={it.won === null ? 'is-none' : undefined}>
            <span className="kbo-rec__label">
              {it.label}
              {it.approx && <em>어림</em>}
            </span>
            <strong className="kbo-rec__won">{it.won === null ? '기록 없음' : krw(it.won)}</strong>
            <span className="kbo-rec__n">{it.won === null ? `올해 0${it.unit}` : `${it.approx ? '약 ' : ''}${it.n.toLocaleString('ko-KR')}${it.unit} 기준`}</span>
          </li>
        ))}
      </ul>
      <p className="kbo-rec__note">
        연봉은 지난 성적과 계약으로 정해져요. 올해 연봉을 올해 정규시즌 기록으로 나눠 본 재미용 숫자예요.
        {rec.kind === 'pitcher' && ` 투구수는 공개된 기록에 없어 이닝 × ${PITCHES_PER_INNING}구로 어림했어요.`}
      </p>
      {src && (
        <p className="kbo-src">
          기록 출처:{' '}
          <a href={src.url} target="_blank" rel="noopener noreferrer">
            {src.label}
          </a>
          {rec.kind === 'pitcher' && (
            <>
              , 투구수 어림 기준:{' '}
              <a href={PITCH_SOURCE.url} target="_blank" rel="noopener noreferrer">
                {PITCH_SOURCE.label}
              </a>
            </>
          )}
        </p>
      )}
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
              {krwMan(r.value)}
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
  const { player, team } = pr
  const rows = [
    { label: player.name, value: player.pay, me: true },
    { label: `${team.name} 평균`, value: team.average, tag: times(player.pay / team.average) },
    { label: '리그 평균', value: LEAGUE.average, tag: times(player.pay / LEAGUE.average) },
    { label: '직장인 평균', value: WORKER_YEAR, tag: times(player.pay / WORKER_YEAR) },
    { label: '최저 연봉', value: LEAGUE.minimum, tag: times(player.pay / LEAGUE.minimum) },
  ]
  return <Bars id="kbo-cmp" title="누구랑 비교하면?" rows={rows} note="오른쪽 숫자는 이 선수 연봉이 각 기준의 몇 배인지예요. 직장인 평균은 국가데이터처 2024년 임금근로일자리 평균 소득(월 375만 원)을 1년으로 늘린 값이에요." />
}

// 해마다 받은 연봉 (자료가 있는 선수만)
function History({ pr }) {
  const { player, change } = pr
  const growRef = useGrowOnView() // 아래에서 일찍 return 하기 전에 불러야 한다 (훅 순서)
  const years = player.history || (player.prev ? { [SEASON - 1]: player.prev, [SEASON]: player.pay } : null)
  if (!years) return null
  const entries = Object.entries(years)
  const max = Math.max(...entries.map(([, v]) => v))
  return (
    <section className="kbo-card" aria-labelledby="kbo-hist">
      <h2 className="kbo-card__title" id="kbo-hist">
        연봉은 얼마나 바뀌었나
        {change !== null && <span className={`kbo-chip ${change >= 0 ? 'is-up' : 'is-down'}`}>{change === 0 ? '동결' : `작년보다 ${pct(change)}`}</span>}
      </h2>
      <ol className="kbo-cols" style={{ '--n': entries.length }} ref={growRef}>
        {entries.map(([y, v], i) => (
          <li key={y} className={Number(y) === SEASON ? 'is-me' : undefined} style={{ '--i': i }}>
            <span className="kbo-cols__value">{krwMan(v)}</span>
            <span className="kbo-cols__bar" aria-hidden="true" style={{ height: `${Math.max(3, (v / max) * 100)}%` }} />
            <span className="kbo-cols__year">{y}</span>
          </li>
        ))}
      </ol>
      {player.approx && <p className="kbo-card__note">{SEASON}년 금액은 계약 조건으로 어림한 값이에요.</p>}
    </section>
  )
}

function TeamChart({ pr }) {
  const rows = TEAMS.map((t) => ({ label: t.name, value: t.average, me: pr && t.id === pr.team.id }))
  rows.push({ label: '리그 전체', value: LEAGUE.average, tag: `작년보다 ${pct((LEAGUE.average - LEAGUE.prevAverage) / LEAGUE.prevAverage)}` })
  return <Bars id="kbo-team" title={`${SEASON} 구단별 평균 연봉`} rows={rows} note={`신인, 외국인, 아시아쿼터 선수를 뺀 소속 선수 ${LEAGUE.players}명 기준 KBO 발표예요.`} />
}

function Sources({ ids }) {
  return (
    <p className="kbo-src">
      출처:{' '}
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && ', '}
          <a href={SOURCES[id].url} target="_blank" rel="noopener noreferrer">
            {SOURCES[id].label}
          </a>
        </span>
      ))}
    </p>
  )
}

// ---------- 순위 ----------

function Ranking({ current, onPick }) {
  return (
    <section className="kbo-card kbo-rank" aria-labelledby="kbo-rank">
      <h2 className="kbo-card__title" id="kbo-rank">
        {SEASON} 선수 연봉 순위
      </h2>
      <p className="kbo-card__lede">KBO 선수 정보와 구단 발표로 연봉을 확인한 국내 선수 {PLAYERS.length}명이에요. ‘어림값’은 FA 계약의 연봉 총액을 해마다 같게 나눈 금액이에요. 이름을 누르면 자세히 볼 수 있어요.</p>
      <ol className="kbo-rank__list">
        {PLAYERS.map((p, i) => {
          const same = i > 0 && PLAYERS[i - 1].pay === p.pay
          const rank = PLAYERS.findIndex((x) => x.pay === p.pay) + 1
          return (
            <li key={p.name}>
              <a
                href={`${PATH}?name=${encodeURIComponent(p.name)}`}
                className={p.name === current ? 'is-on' : undefined}
                aria-current={p.name === current ? 'true' : undefined}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey) return
                  e.preventDefault()
                  onPick(p.name, 'rank')
                }}
              >
                <span className="kbo-rank__no">{same ? '' : rank}</span>
                <span className="kbo-rank__who">
                  <strong>{p.name}</strong>
                  <span>
                    {TEAM_BY_ID[p.team].name} {p.pos}
                  </span>
                </span>
                <span className="kbo-rank__pay">
                  {krwMan(p.pay)}
                  {p.approx && <em>어림값</em>}
                </span>
              </a>
            </li>
          )
        })}
      </ol>
      <p className="kbo-card__note">
        순위는 이 목록 안에서의 순서예요. 리그 전체 순위는 KBO가 발표한 1~4위(양의지, 고영표, 최정, 류현진·박세웅)만 확실해요.
      </p>
    </section>
  )
}

// ---------- 화면 ----------

export default function KboApp() {
  // 이름 없이 들어왔을 때 보여 줄 선수 (들어올 때 한 번 정한다)
  const [startName] = useState(() => (typeof window === 'undefined' ? DEFAULT_NAME : pickRandom()))
  const [name, setName] = useState(() => readName() || startName)
  const pr = useMemo(() => profile(findExact(name) || PLAYERS[0]), [name])
  const resultRef = useRef(null)
  const baseTitle = useRef('')
  // 결과 전광판을 지나 아래로 내려간 뒤에만 다른 계산기 바로가기를 띄운다 (전광판을 가리지 않게)
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
    track('kbo_view', { player: n, via: how })
    requestAnimationFrame(() => {
      const el = resultRef.current
      if (!el) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    })
  }

  // 고른 선수를 주소에 남긴다 (기본 선수면 /kbo/ 그대로)
  useEffect(() => {
    const url = new URL(window.location.href)
    if (name === startName && !readName()) url.searchParams.delete('name')
    else url.searchParams.set('name', name)
    if (url.href !== window.location.href) window.history.replaceState(null, '', url)
    if (!baseTitle.current) baseTitle.current = document.title
    document.title = name === startName && !readName() ? baseTitle.current : `${name} 연봉 ${krwMan(pr.player.pay)}, 1경기에 ${krw(pr.b.game)} | 돈미터`
  }, [name, pr])

  // 브라우저 뒤로 가기 등으로 주소가 바뀌면 따라간다
  useEffect(() => {
    const onPop = () => setName(readName() || startName)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const share = useMemo(() => {
    if (typeof window === 'undefined') return null
    const url = new URL(PATH, window.location.origin)
    url.searchParams.set('name', pr.player.name)
    return {
      url: url.toString(),
      text: `${pr.player.name} ${SEASON} 연봉 ${krwMan(pr.player.pay)}, 1경기에 ${krw(pr.b.game)} | 돈미터`,
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
          <SiteMenu current={PATH} items={KBO_ITEMS} links={KBO_MENU} />
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
          <div className="hero__text">
            <h1 className="hero__title">프로야구 선수, 연봉 얼마 받을까?</h1>
            <p className="hero__lede">선수 이름만 넣으면 {SEASON} 연봉을 한 경기, 1초, 안타 하나, 공 하나 단위로 쪼개 직장인 연봉과 비교해 드려요.</p>
          </div>
          <PlayerSearch onPick={choose} />
          <ul className="kbo-picks" aria-label="많이 찾는 선수">
            {PICKS.map((n) => (
              <li key={n}>
                <button type="button" className={n === name ? 'is-on' : undefined} onClick={() => choose(n, 'pick')}>
                  {n}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="kbo-result" ref={resultRef} aria-live="polite">
          <Scoreboard pr={pr} />
          <Headline pr={pr} />
          <Records pr={pr} />
          {pr.player.note && <p className="kbo-note">{pr.player.note}</p>}
          <Sources ids={pr.player.src} />
          {share && <KboImageShare pr={pr} caption={share.text.replace(/ \| 돈미터$/, '')} />}
          <div className="kbo-grid">
            <Compare pr={pr} />
            <History pr={pr} />
          </div>
        </div>

        {share && <ShareBar url={share.url} text={share.text} sub="링크를 받은 사람도 같은 선수의 연봉을 보고, 다른 선수로 바꿔 볼 수 있어요." />}

        <AdSlot variant="inline" slot={SLOTS.inline} />

        <TeamChart pr={pr} />
        <Ranking current={name} onPick={choose} />

        <AdSlot variant="mid" slot={SLOTS.top} />

        <KboGuide />
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
        <p>연봉은 KBO와 각 구단이 발표하고 언론이 보도한 금액을 돈미터가 옮겨 정리한 참고 자료예요. 계약금, 옵션, 광고 수입은 들어 있지 않아요. 돈미터는 KBO나 구단과 관계없는 개인 사이트예요.</p>
      </footer>

      <FloatingSwitch current={PATH} hidden={!pastResult} />

      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}
