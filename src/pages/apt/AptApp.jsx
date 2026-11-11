// 연봉 모아 집 사기 (/apt/): 연봉·기간·면적·지역을 고르면, 한 푼도 안 쓰고 모았을 때 살 수 있는 아파트를 실거래가로 보여 준다
import { useEffect, useMemo, useRef, useState } from 'react'
import AdSlot, { AdRails } from '../../components/AdSlot.jsx'
import ShareBar from '../../components/ShareBar.jsx'
import { BrandMark } from '../../components/Art.jsx'
import { useGrowOnView, CountUp } from '../../components/Motion.jsx'
import SiteMenu from '../../components/SiteMenu.jsx'
import FloatingSwitch from '../../components/FloatingSwitch.jsx'
import { track } from '../../lib/analytics.js'
import { FOOTER_MENU, MENU, APT, YOUTUBER, KBO, KLPGA } from '../../lib/menu.js'
import { SALARIES, YEARS, AREAS, BASES, SOURCES, SIDO, sidoOf, loadSido, calculate, fromSearch, toSearch, sortNear } from './apt.js'
import { hasMap, loadKakao, locate, regionOf, sggCenters } from './kakaoMap.js'
import AptGuide from './AptGuide.jsx'
import SocialLinks from '../../components/Social.jsx'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  // PC 좌우 배너용 단위가 따로 없으면 상단 배너 단위를 같이 쓴다
  rail: import.meta.env.VITE_AD_SLOT_RAIL || import.meta.env.VITE_AD_SLOT_TOP,
  // 모바일 본문 중간 광고: 따로 만든 단위가 없으면 상단 배너 단위를 쓴다
  mid: import.meta.env.VITE_AD_SLOT_MID || import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

const APT_ITEMS = MENU.slice(0, 12)
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

// 생활비 빼고 모을 때: 존버 계산기로 돌아가는 주소 (같은 연봉, 생활 방식, 아끼기)
function surviveLink(s) {
  const p = new URLSearchParams()
  if (s.pay !== '4500') p.set('pay', s.pay)
  if (s.ls !== 'avg') p.set('s', s.ls)
  if (s.lv) p.set('a', s.lv)
  if (s.ls === 'pick' && s.lr) p.set('r', s.lr)
  const q = p.toString()
  return `/survive/${q ? `?${q}` : ''}`
}

// 적금 통장: 1년에 모으는 돈 × 기간 = 모인 돈
function Passbook({ r }) {
  const { state: s, salary, yearly, budget, fits, pool } = r
  const area = AREAS.find((a) => a.id === s.a)
  const where = r.place
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
            <small>
              {s.b === 'left' ? (
                <>
                  {r.life.text} 남는 돈{r.life.saves > 0 && `, 아끼기 ${r.life.saves}개`} (한 달 {man(Math.max(0, r.life.left))}){' '}
                  <a href={surviveLink(s)}>생활비 보기</a>
                </>
              ) : s.b === 'net' ? (
                `연봉 ${salary.label} 원의 실수령액`
              ) : (
                `세전 연봉 그대로`
              )}
            </small>
          </dd>
        </div>
        <div>
          <dt>모으는 기간</dt>
          <dd>{s.y}년, {s.b === 'left' ? '생활비 빼고 남는 돈만' : '한 푼도 안 쓰고'}</dd>
        </div>
        <div className="apt-book__total">
          <dt>모인 돈</dt>
          <dd>
            <CountUp value={budget} format={man} />
          </dd>
        </div>
      </dl>
      <p className="apt-book__result">
        {!r.ready ? (
          <>{where} 아파트 실거래 자료를 불러오고 있어요…</>
        ) : pool.length && !fits.length ? (
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
        {r.place}에서 최근 1년 동안 전용 {r.state.a}㎡ 거래가 있었던 아파트 {r.pool.length.toLocaleString('ko-KR')}곳 기준이에요.
      </p>
    </section>
  )
}

// 부동산 유리창에 붙은 매물표처럼
function Listing({ a, r, onOpen }) {
  const d = a[r.state.a]
  const y = r.yearsFor(a)
  return (
    <li className={`apt-card${onOpen ? ' has-map' : ''}`}>
      <p className="apt-card__where">
        {a.sggName} {a.dong}
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
        전용 {r.state.a}㎡ 거래 {d.n}건, 최근 거래 우선 중간값 · 마지막 거래 {ym(d.last)}
        {d.n < 3 && <span className="apt-card__few">거래 적음</span>}
      </p>
      {onOpen && (
        <button type="button" className="apt-card__map" onClick={() => onOpen(a)}>
          <span className="sr-only">{a.name} </span>지도 보기
        </button>
      )}
    </li>
  )
}

// 단지 지도 (카카오맵, 열 때만 불러온다)
function MapDialog({ apt, r, onClose }) {
  const dialogRef = useRef(null)
  const mapRef = useRef(null)
  const [state, setState] = useState({ status: 'loading', pos: null })
  const d = apt[r.state.a]

  useEffect(() => {
    const dlg = dialogRef.current
    if (dlg && !dlg.open) dlg.showModal?.()
    const onCancel = (e) => {
      e.preventDefault()
      onClose()
    }
    dlg?.addEventListener('cancel', onCancel)
    return () => dlg?.removeEventListener('cancel', onCancel)
  }, [onClose])

  useEffect(() => {
    let alive = true
    loadKakao()
      .then(async (kakao) => {
        const pos = await locate(kakao, apt)
        if (!alive) return
        if (!pos) return setState({ status: 'missing', pos: null })
        const center = new kakao.maps.LatLng(pos.lat, pos.lng)
        const map = new kakao.maps.Map(mapRef.current, { center, level: pos.exact ? 3 : 5 })
        new kakao.maps.Marker({ map, position: center, title: apt.name })
        setState({ status: pos.exact ? 'ok' : 'dong', pos })
      })
      .catch(() => alive && setState({ status: 'error', pos: null }))
    return () => {
      alive = false
    }
  }, [apt])

  const msg = {
    loading: '지도를 불러오고 있어요…',
    dong: `정확한 위치를 찾지 못해 ${apt.dong} 중심을 보여 드려요.`,
    missing: '이 단지의 위치를 지도에서 찾지 못했어요.',
    error: '지도를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.',
  }[state.status]
  const big = state.pos ? `https://map.kakao.com/link/map/${encodeURIComponent(apt.name)},${state.pos.lat},${state.pos.lng}` : null

  return (
    <dialog className="apt-map" ref={dialogRef} aria-labelledby="apt-map-title" onClick={(e) => e.target === dialogRef.current && onClose()}>
      <div className="apt-map__head">
        <div>
          <p className="apt-card__where">
            {apt.sggName} {apt.dong}
            {apt.jibun ? ` ${apt.jibun}` : ''}
          </p>
          <h2 className="apt-map__title" id="apt-map-title">
            {apt.name}
          </h2>
          <p className="apt-map__price">
            전용 {r.state.a}㎡ {man(d.price)} · <strong>{yearsText(r.yearsFor(apt))}</strong> 모으면 살 수 있어요
          </p>
        </div>
        <button type="button" className="apt-map__close" onClick={onClose} aria-label="지도 닫기">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
        </button>
      </div>
      <div className="apt-map__frame">
        <div className="apt-map__canvas" ref={mapRef} />
        {msg && (
          <p className="apt-map__msg" role="status">
            {msg}
          </p>
        )}
      </div>
      <p className="apt-map__foot">
        위치는 카카오맵 검색 결과예요.
        {big && (
          <>
            {' '}
            <a href={big} target="_blank" rel="noopener noreferrer">
              카카오맵에서 크게 보기
            </a>
          </>
        )}
      </p>
    </dialog>
  )
}

// 정렬: 고가 순 / 저가 순 / 내 주변 먼저 (위치는 이 브라우저 안에서만 쓰고 어디에도 보내지 않는다)
function SortBar({ sort, setSort, near }) {
  return (
    <div className="apt-sort">
      <div className="apt-sort__opts" role="radiogroup" aria-label="목록 순서">
        {[
          ['price', '고가 순'],
          ['low', '저가 순'],
          ['near', '내 주변 먼저'],
        ].map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={sort === id} className={`apt-sort__btn${sort === id ? ' is-on' : ''}`} onClick={() => setSort(id)}>
            {label}
          </button>
        ))}
      </div>
      {near.msg && (
        <p className="apt-sort__msg" role="status">
          {near.msg}
        </p>
      )}
    </div>
  )
}

// 내 주변 먼저: 브라우저 위치 → 카카오로 내 시도·시군구 확인 → 그 시도의 시군구 중심을 그때그때 찾아 가까운 순서로 정렬
// 위치와 찾은 좌표는 이 화면의 메모리에만 두고 저장하거나 돈미터 서버로 보내지 않는다.
const getPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('nogeo'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve([p.coords.latitude, p.coords.longitude]),
      reject,
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    )
  })

// 카카오가 알려준 시도 이름을 우리 시도 목록과 맞춘다 ("서울특별시" ↔ "서울특별시", "강원도" ↔ "강원특별자치도" 처럼 이름이 조금 달라도)
const matchSido = (name) => SIDO.find((s) => s.name === name) || SIDO.find((s) => name && (name.startsWith(s.short) || s.name.startsWith(name.slice(0, 2))))

function useNear(r, onSido) {
  const [sort, setSortRaw] = useState('price')
  const [near, setNear] = useState({ here: null, sido: null, centers: null, msg: '' })
  const busy = useRef(false)

  const setSort = async (id) => {
    if (id === 'price' || id === 'low') {
      setSortRaw(id)
      setNear((n) => ({ ...n, msg: '' }))
      return
    }
    if (busy.current) return
    if (!hasMap()) {
      setNear((n) => ({ ...n, msg: '지금은 내 주변 먼저를 쓸 수 없어요.' }))
      return
    }
    busy.current = true
    setNear((n) => ({ ...n, msg: '내 위치를 확인하고 있어요…' }))
    try {
      const here = await getPosition().catch(() => {
        throw new Error('geo')
      })
      const kakao = await loadKakao()
      const where = await regionOf(kakao, here[0], here[1])
      const sd = where && matchSido(where.sido)
      if (!sd) throw new Error('outside')
      if (sd.code !== r.state.sido) onSido(sd.code)
      const file = await loadSido(sd.code)
      const centers = await sggCenters(kakao, file.sgg)
      setNear({
        here,
        sido: sd.code,
        centers,
        msg: `${sd.short} ${where.sgg}에서 가까운 시군구부터, 같은 시군구 안에서는 고가 순이에요. 위치는 카카오맵에서 지역을 찾는 데만 쓰고 저장하지 않아요.`,
      })
      setSortRaw('near')
      track('apt_near', { sido: sd.code })
    } catch (e) {
      setSortRaw('price')
      setNear({
        here: null,
        sido: null,
        centers: null,
        msg:
          e.message === 'geo'
            ? '위치를 확인하지 못해서 고가 순으로 보여 드려요. 브라우저의 위치 권한을 확인해 주세요.'
            : e.message === 'outside'
              ? '내 위치 근처의 아파트 자료가 없어서 고가 순으로 보여 드려요.'
              : '지금은 내 주변을 찾지 못했어요. 잠시 뒤 다시 눌러 주세요.',
      })
    } finally {
      busy.current = false
    }
  }

  // 다른 시도를 직접 고르면 고가 순으로 돌아간다
  useEffect(() => {
    if (sort === 'near' && near.sido && near.sido !== r.state.sido) {
      setSortRaw('price')
      setNear((n) => ({ ...n, msg: '' }))
    }
  }, [r.state.sido, sort, near.sido])

  return { sort, setSort, near }
}

// nearCtl: 내 주변 먼저 상태 (시도 자료를 다시 불러오는 동안에도 남도록 AptApp 이 가지고 있다)
function Window({ r, nearCtl }) {
  const [shown, setShown] = useState(PAGE)
  const [open, setOpen] = useState(null)
  const { sort, setSort, near } = nearCtl
  const key = `${r.state.pay}-${r.state.y}-${r.state.a}-${r.state.sido}-${r.state.sgg}-${r.state.b}-${r.state.ls}-${r.state.lr}-${r.state.lv}-${sort}`
  useEffect(() => setShown(PAGE), [key])
  const list = useMemo(
    () =>
      sort === 'near' && near.here && near.sido === r.state.sido
        ? sortNear(r.fits, near.here, near.centers, r.state.a)
        : sort === 'low'
          ? [...r.fits].reverse() // r.fits 는 고가 순
          : r.fits,
    [r.fits, sort, near, r.state.sido, r.state.a],
  )
  // 지도를 닫으면 열었던 버튼으로 초점을 돌려준다
  const opener = useRef(null)
  const onOpen = hasMap()
    ? (a) => {
        opener.current = document.activeElement
        setOpen(a)
        track('apt_map', {})
      }
    : null
  const onClose = () => {
    setOpen(null)
    requestAnimationFrame(() => opener.current?.focus?.())
  }
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
        <SortBar sort={sort} setSort={setSort} near={near} />
        <ul className="apt-cards">
          <Listing a={c} r={r} onOpen={onOpen} />
        </ul>
        {open && <MapDialog apt={open} r={r} onClose={onClose} />}
      </section>
    )
  }
  return (
    <section className="apt-window" aria-labelledby="apt-window-title">
      <h2 className="apt-window__title" id="apt-window-title">
        모은 돈으로 살 수 있는 곳
      </h2>
      <p className="apt-window__lede">
        {man(r.budget)} 안에서 최근 1년 거래가 기준이에요. 단지 가격은 최근 거래에 무게를 더 둔 중간값이에요.
      </p>
      <SortBar sort={sort} setSort={setSort} near={near} />
      <ul className="apt-cards">
        {list.slice(0, shown).map((a) => (
          <Listing key={a.id} a={a} r={r} onOpen={onOpen} />
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
      {open && <MapDialog apt={open} r={r} onClose={onClose} />}
    </section>
  )
}

export default function AptApp({ initialSearch = '' }) {
  const [state, setState] = useState(() => fromSearch(typeof window === 'undefined' ? initialSearch : window.location.search))
  // 고른 시도의 단지 자료 (public/data/apt/<시도코드>.json, 고를 때 불러온다)
  const [file, setFile] = useState(null)
  const [loadError, setLoadError] = useState(false)
  useEffect(() => {
    if (!SIDO.length) return
    let alive = true
    setLoadError(false)
    loadSido(state.sido)
      .then((f) => alive && setFile(f))
      .catch(() => alive && setLoadError(true))
    return () => {
      alive = false
    }
  }, [state.sido])

  const r = useMemo(() => calculate(state, file), [state, file])
  const set = (k) => (v) => {
    setState((s) => ({ ...s, [k]: v }))
    track('apt_pick', { [k]: v })
  }
  const onSido = (code) => setState((s) => ({ ...s, sido: code, sgg: 'all' }))
  const sido = sidoOf(r.state.sido)
  const nearCtl = useNear(r, onSido)

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
    return {
      url: url.toString(),
      text: r.ready
        ? `연봉 ${r.salary.label} 원, ${r.state.b === 'left' ? '생활비 빼고 ' : ''}${r.state.y}년 모으면 ${r.place} ${r.state.a}㎡ 아파트 ${r.fits.length.toLocaleString('ko-KR')}곳 | 돈미터`
        : `연봉 ${r.salary.label} 원, ${r.state.y}년 모으면 살 수 있는 아파트 | 돈미터`,
    }
  }, [r])

  const empty = !SIDO.length

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

      {/* PC: 본문 좌우 세로 배너 / 모바일: 이 자리 대신 본문 중간 광고(mid) */}
      <AdRails slot={SLOTS.rail} />

      <main className="main">
        <section className="hero apt-hero">
          <div className="hero__text">
            <h1 className="hero__title">연봉 모아 집 사기</h1>
            <p className="hero__lede">
              연봉과 모으는 기간만 고르면, 한 푼도 안 쓰고 모았을 때 살 수 있는 아파트를 국토교통부 실거래가로 전국에서 찾아 드려요.
            </p>
          </div>
        </section>

        <form className="apt-form" onSubmit={(e) => e.preventDefault()} aria-label="연봉과 모으는 조건">
          <Choices legend="연봉 (세전)" name="pay" options={SALARIES} value={state.pay} onChange={set('pay')} />
          <Choices legend="몇 년 모을까요?" name="y" options={YEARS.map((y) => ({ id: y, label: `${y}년` }))} value={state.y} onChange={(v) => set('y')(Number(v))} />
          <Choices legend="아파트 크기 (전용면적)" name="a" options={AREAS} value={state.a} onChange={set('a')} />
          <Choices legend="1년에 모으는 돈" name="b" options={BASES} value={state.b} onChange={set('b')} />
          <div className="apt-form__row">
            <div className="apt-q">
              <label className="apt-q__legend" htmlFor="apt-sido">
                시도
              </label>
              <select id="apt-sido" className="apt-select" value={r.state.sido} onChange={(e) => onSido(e.target.value)} disabled={empty}>
                {SIDO.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="apt-q">
              <label className="apt-q__legend" htmlFor="apt-sgg">
                시군구
              </label>
              <select id="apt-sgg" className="apt-select" value={r.state.sgg} onChange={(e) => set('sgg')(e.target.value)} disabled={empty}>
                <option value="all">{sido ? `${sido.short} 전체` : '전체'}</option>
                {(sido?.sgg || []).map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.name}
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
            {loadError && (
              <p className="apt-empty" role="alert">
                {r.place} 자료를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.
              </p>
            )}
            <Ladder r={r} />
            <Window r={r} nearCtl={nearCtl} />
          </div>
        )}

        {share && !empty && <ShareBar url={share.url} text={share.text} sub="링크를 받은 사람도 같은 조건의 결과를 보고, 자기 연봉으로 바꿔 볼 수 있어요." />}

        <AdSlot variant="inline" slot={SLOTS.inline} />

        <AptGuide ad={<AdSlot variant="mid" slot={SLOTS.mid} />} />
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
        <p>
          아파트 가격은 {SOURCES.molit.label.replace('공공데이터포털, ', '')}를 돈미터가 단지별로 정리한 참고 자료예요. 실제 매물 가격, 대출, 세금은 들어 있지 않아요.
        </p>
      </footer>

      <FloatingSwitch current={APT} hidden={!pastResult} />
      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}

