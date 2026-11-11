// 직주근접 계산기 (/commute/): 회사 근처 역을 고르면 그 역 주변 전월세 계약과 집에서 역까지 출퇴근 길을 보여 준다
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AdSlot, { AdRails } from '../../components/AdSlot.jsx'
import ShareBar from '../../components/ShareBar.jsx'
import { BrandMark } from '../../components/Art.jsx'
import SiteMenu from '../../components/SiteMenu.jsx'
import FloatingSwitch from '../../components/FloatingSwitch.jsx'
import SocialLinks from '../../components/Social.jsx'
import { track } from '../../lib/analytics.js'
import { FOOTER_MENU, MENU, COMMUTE, SURVIVE, APT, YOUTUBER } from '../../lib/menu.js'
import { hasMap, loadKakao } from '../apt/kakaoMap.js'
import {
  DATA,
  KINDS,
  TYPES,
  DISTS,
  SORTS,
  WORKDAYS,
  JEONSE_RATE,
  fromSearch,
  toSearch,
  readStations,
  stationOf,
  linesOf,
  stationsOn,
  readHomes,
  fitHome,
  summarize,
  sortHomes,
  monthlyCost,
  surviveLink,
  man,
  won,
  distText,
  minText,
  hourText,
  dateText,
  areaText,
  monthMinutes,
} from './commute.js'
import { findNear } from './locate.js'
import CommuteGuide from './CommuteGuide.jsx'

const SLOTS = {
  top: import.meta.env.VITE_AD_SLOT_TOP,
  rail: import.meta.env.VITE_AD_SLOT_RAIL || import.meta.env.VITE_AD_SLOT_TOP,
  mid: import.meta.env.VITE_AD_SLOT_MID || import.meta.env.VITE_AD_SLOT_TOP,
  inline: import.meta.env.VITE_AD_SLOT_INLINE,
  anchor: import.meta.env.VITE_AD_SLOT_ANCHOR,
}

const ITEMS_MENU = MENU.slice(0, 12)
const LINKS = [
  { href: YOUTUBER, label: '유튜버 수익 계산기' },
  { href: COMMUTE, label: '직주근접 계산기' },
  { href: SURVIVE, label: '존버 계산기' },
  { href: APT, label: '연봉 모아 집 사기' },
]
const PAGE = 20 // 카드 한 번에 보여 주는 수
const MAP_LEVEL = { 500: 4, 1000: 5, 2000: 6 }

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

// ---------- 역 고르기: 지역 → 노선 → 역 ----------
function StationPicker({ data, station, onPick, onLine }) {
  const [region, setRegion] = useState(station?.region || 'capital')
  const [line, setLine] = useState(station?.lines[0] || '')
  // 다른 곳(지도, 주소)에서 역이 바뀌면 지역과 노선을 따라간다
  useEffect(() => {
    if (!station) return
    setRegion(station.region)
    setLine((l) => (station.lines.includes(l) ? l : station.lines[0]))
  }, [station])

  useEffect(() => onLine?.(line), [line, onLine])

  if (!data) return null
  const lines = linesOf(data, region)
  const here = stationsOn(data, region, line)
  const pickRegion = (id) => {
    setRegion(id)
    const first = linesOf(data, id)[0]
    setLine(first)
    const s = stationsOn(data, id, first)[0]
    if (s) onPick(s.id)
  }
  const pickLine = (l) => {
    setLine(l)
    if (!station?.lines.includes(l)) {
      const s = stationsOn(data, region, l)[0]
      if (s) onPick(s.id)
    }
  }

  return (
    <div className="cm-pick">
      {data.regions.length > 1 && <Choices legend="지역" name="region" options={data.regions} value={region} onChange={pickRegion} />}
      <fieldset className="apt-q">
        <legend className="apt-q__legend">노선</legend>
        <div className="cm-lines">
          {lines.map((l) => (
            <label key={l} className={`apt-opt${l === line ? ' is-on' : ''}`}>
              <input type="radio" className="sr-only" name="line" value={l} checked={l === line} onChange={() => pickLine(l)} />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="apt-q">
        <legend className="apt-q__legend">
          회사 근처 역 <small>{here.length}곳</small>
        </legend>
        <div className="cm-stations">
          {here.map((s) => (
            <label key={s.id} className={`cm-stn-opt${s.id === station?.id ? ' is-on' : ''}`}>
              <input type="radio" className="sr-only" name="st" value={s.id} checked={s.id === station?.id} onChange={() => onPick(s.id)} />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

// ---------- 지도 ----------
const cssVar = (name, fallback) => {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return /^#|^rgb/.test(v) ? v : fallback
}

function CommuteMap({ station, lineStations, list, selected, route, radius, state, onPickStation, onPickHome }) {
  const boxRef = useRef(null)
  const ref = useRef({ kakao: null, map: null, layers: { base: [], homes: [], route: [] } })
  const [status, setStatus] = useState(hasMap() ? 'loading' : 'nomap')

  const clear = (name) => {
    for (const o of ref.current.layers[name]) o.setMap(null)
    ref.current.layers[name] = []
  }

  // 지도 만들기 (한 번)
  useEffect(() => {
    if (!hasMap() || !station) return
    let alive = true
    loadKakao()
      .then((kakao) => {
        if (!alive || ref.current.map) return
        ref.current.kakao = kakao
        ref.current.map = new kakao.maps.Map(boxRef.current, { center: new kakao.maps.LatLng(station.lat, station.lng), level: MAP_LEVEL[radius] || 5 })
        setStatus('ok')
      })
      .catch(() => alive && setStatus('error'))
    return () => {
      alive = false
    }
  }, [station, radius])

  // 역, 반경, 같은 노선 역
  useEffect(() => {
    const { kakao, map } = ref.current
    if (status !== 'ok' || !station) return
    clear('base')
    const center = new kakao.maps.LatLng(station.lat, station.lng)
    map.setLevel(MAP_LEVEL[radius] || 5)
    map.setCenter(center)
    const seal = cssVar('--seal', '#c2410c')
    const circle = new kakao.maps.Circle({ center, radius, strokeWeight: 2, strokeColor: seal, strokeOpacity: 0.8, strokeStyle: 'dash', fillColor: seal, fillOpacity: 0.06 })
    circle.setMap(map)
    ref.current.layers.base.push(circle)
    for (const s of lineStations) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = `cm-map-stn${s.id === station.id ? ' is-on' : ''}`
      el.textContent = s.name
      el.setAttribute('aria-label', `${s.name}역 고르기`)
      el.addEventListener('click', () => onPickStation(s.id))
      const o = new kakao.maps.CustomOverlay({ position: new kakao.maps.LatLng(s.lat, s.lng), content: el, yAnchor: 0.5, zIndex: s.id === station.id ? 5 : 2, clickable: true })
      o.setMap(map)
      ref.current.layers.base.push(o)
    }
  }, [status, station, radius, lineStations, onPickStation])

  // 집 (가격 표시)
  useEffect(() => {
    const { kakao, map } = ref.current
    if (status !== 'ok') return
    clear('homes')
    for (const h of list) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = `cm-pin${h.key === selected ? ' is-on' : ''}${h.approx ? ' is-approx' : ''}`
      el.textContent = state.k === 'jeonse' ? man(h.rep.deposit) : `${h.rep.monthly}만`
      el.setAttribute('aria-label', `${h.title} ${el.textContent} 보기`)
      el.addEventListener('click', () => onPickHome(h.key, true))
      const o = new kakao.maps.CustomOverlay({ position: new kakao.maps.LatLng(h.lat, h.lng), content: el, yAnchor: 1.2, zIndex: h.key === selected ? 9 : 3, clickable: true })
      o.setMap(map)
      ref.current.layers.homes.push(o)
    }
  }, [status, list, selected, state.k, onPickHome])

  // 경로
  useEffect(() => {
    const { kakao, map } = ref.current
    if (status !== 'ok') return
    clear('route')
    const home = list.find((h) => h.key === selected)
    if (!home) return
    const seal = cssVar('--seal', '#c2410c')
    const ink = cssVar('--ink', '#1f2937')
    const lines = []
    const transit = route.transit?.data
    const walk = route.walk?.data
    // 걸어서 갈 만하면(25분 이내) 도보 길, 아니면 대중교통 길
    const useWalk = walk?.path?.length && (!transit?.steps?.length || walk.time <= 25 * 60)
    if (useWalk) lines.push({ path: walk.path, color: ink, style: 'solid', weight: 5 })
    else if (transit?.steps) for (const s of transit.steps) if (s.path.length) lines.push({ path: s.path, color: s.type === 'WALKING' ? ink : seal, style: s.type === 'WALKING' ? 'shortdash' : 'solid', weight: s.type === 'WALKING' ? 4 : 6 })
    const bounds = new kakao.maps.LatLngBounds()
    bounds.extend(new kakao.maps.LatLng(home.lat, home.lng))
    bounds.extend(new kakao.maps.LatLng(station.lat, station.lng))
    for (const l of lines) {
      const path = l.path.map(([x, y]) => new kakao.maps.LatLng(y, x))
      path.forEach((p) => bounds.extend(p))
      const pl = new kakao.maps.Polyline({ path, strokeWeight: l.weight, strokeColor: l.color, strokeOpacity: 0.9, strokeStyle: l.style })
      pl.setMap(map)
      ref.current.layers.route.push(pl)
    }
    map.setBounds(bounds, 40, 40, 40, 40)
  }, [status, selected, route, list, station])

  const msg = {
    loading: '지도를 불러오고 있어요…',
    error: '지도를 불러오지 못했어요. 새로 고침해 주세요.',
    nomap: '지도를 쓸 수 없는 환경이에요.',
  }[status]

  return (
    <div className="cm-map" id="cm-map">
      <div className="cm-map__canvas" ref={boxRef} role="region" aria-label={station ? `${station.name}역 주변 지도` : '지도'} />
      {msg && (
        <p className="apt-map__msg" role="status">
          {msg}
        </p>
      )}
    </div>
  )
}

// ---------- 결과 요약 ----------
function Summary({ sum, state, station, data, result }) {
  const kind = KINDS.find((x) => x.id === state.k).label
  const type = TYPES.find((x) => x.id === state.t).label
  const dist = DISTS.find((x) => x.id === state.d).label
  const busy = result.status === 'loading' || result.status === 'locating'
  return (
    <section className="cm-sum" aria-labelledby="cm-sum-title" aria-busy={busy}>
      <p className="cm-sum__kicker" id="cm-sum-title">
        {station.name}역 {dist} 안 · {type} {kind}
        {data?.from && (
          <span>
            {' '}
            · {data.from.replace('-', '.')}~{data.to.replace('-', '.')} 계약
          </span>
        )}
      </p>
      {sum.count > 0 ? (
        <>
          <p className="cm-sum__main">
            {state.k === 'jeonse' ? (
              <>
                전세 <strong>{man(sum.price)}</strong>
              </>
            ) : (
              <>
                월세 <strong>{man(sum.price)}</strong>
                <span className="cm-sum__dep">보증금 {man(sum.deposit)}</span>
              </>
            )}
          </p>
          <p className="cm-sum__sub">
            {busy ? '지금까지 찾은' : '찾은'} {sum.count.toLocaleString('ko-KR')}곳의 최근 계약 중간값이에요. 보증금 이자까지 치면 한 달 집값 약 <strong>{won(sum.cost)}</strong>.
          </p>
          {sum.near && (
            <p className="cm-sum__near">
              역 500m 안은 그 밖보다 한 달 집값이{' '}
              <strong>
                {won(Math.abs(sum.near.inner - sum.near.outer))} {sum.near.inner >= sum.near.outer ? '더 비싸요' : '더 싸요'}
              </strong>{' '}
              <small>
                (안 {sum.near.n[0]}곳 {won(sum.near.inner)}, 밖 {sum.near.n[1]}곳 {won(sum.near.outer)})
              </small>
            </p>
          )}
        </>
      ) : (
        <p className="cm-sum__main cm-sum__main--empty">
          {busy
            ? '역 주변 계약을 찾고 있어요…'
            : result.status === 'error'
              ? '지도에서 집 위치를 찾지 못했어요. 잠시 뒤 새로 고침해 주세요.'
              : result.status === 'nomap'
                ? '지도를 쓸 수 없어 역까지 거리를 잴 수 없어요.'
                : '이 조건의 계약을 찾지 못했어요. 거리를 넓히거나 다른 집을 골라 보세요.'}
        </p>
      )}
    </section>
  )
}

// ---------- 지도 아래: 고른 집과 출퇴근 길 ----------
function PickedBar({ home, state, station, route, onClose }) {
  const d = home.rep
  return (
    <section className="cm-picked" aria-label={`${home.title} 출퇴근 길`}>
      <div className="cm-picked__head">
        <div>
          <p className="apt-card__where">
            {home.sggName} {home.dong} · {home.kindLabel} · {station.name}역까지 직선 {distText(home.dist)}
          </p>
          <p className="cm-picked__name">
            {home.title}{' '}
            <strong>{state.k === 'jeonse' ? `전세 ${man(d.deposit)}` : `월세 ${man(d.monthly)} · 보증금 ${man(d.deposit)}`}</strong>
          </p>
        </div>
        <button type="button" className="apt-map__close" onClick={onClose} aria-label="출퇴근 길 닫기">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
        </button>
      </div>
      <RouteBox route={route} station={station} cardKey={home.key} />
    </section>
  )
}

// ---------- 출퇴근 길 ----------
function RouteBox({ route, station, cardKey }) {
  const walk = route.walk || {}
  const transit = route.transit || {}
  const w = walk.data
  const t = transit.data
  const pending = walk.status === 'loading' || transit.status === 'loading'
  if (pending && !w && !t) return <p className="cm-route__msg">출퇴근 길을 찾고 있어요…</p>
  const best = [w && !w.none && { mode: 'walk', sec: w.time }, t && !t.none && { mode: 'transit', sec: t.time }].filter(Boolean).sort((a, b) => a.sec - b.sec)[0]
  const month = best ? monthMinutes(best.sec) : 0
  const fare = best?.mode === 'transit' && t.fare ? t.fare * 2 * WORKDAYS : 0
  const link = t?.link || w?.link
  return (
    <div className="cm-route">
      <ul className="cm-route__ways">
        <li className={best?.mode === 'walk' ? 'is-best' : ''}>
          <span className="cm-route__label">걸어서</span>
          {w && !w.none ? (
            <>
              <strong>{minText(w.time)}</strong> <small>{distText(w.distance)}</small>
            </>
          ) : (
            <small>{walk.status === 'error' ? walk.error : w?.none || '…'}</small>
          )}
        </li>
        <li className={best?.mode === 'transit' ? 'is-best' : ''}>
          <span className="cm-route__label">대중교통</span>
          {t && !t.none ? (
            <>
              <strong>{minText(t.time)}</strong>{' '}
              <small>
                {t.transfers ? `환승 ${t.transfers}번` : '환승 없이'}
                {t.fare ? ` · ${t.fare.toLocaleString('ko-KR')}원` : ''}
              </small>
            </>
          ) : (
            <small>{transit.status === 'error' ? transit.error : t?.none || '…'}</small>
          )}
        </li>
      </ul>
      {t?.steps?.length > 0 && (
        <p className="cm-route__steps">
          {t.steps
            .filter((s) => s.type !== 'WALKING')
            .map((s) => `${s.name || (s.type === 'BUS' ? '버스' : '지하철')}${s.from ? ` ${s.from}→${s.to}` : ''}`)
            .join(' · ')}
        </p>
      )}
      {best && (
        <p className="cm-route__month">
          {station.name}역까지 한 달 출퇴근 <strong>{hourText(month)}</strong>
          {fare > 0 && (
            <>
              , 교통비 <strong>{won(fare)}</strong>
            </>
          )}
          <small> (왕복 × 21.7일)</small>
        </p>
      )}
      <p className="cm-route__foot">
        <a href={`#cm-${cardKey}`} className="cm-route__tomap">
          이 집 카드 보기
        </a>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer">
            카카오맵에서 길찾기
          </a>
        )}
      </p>
    </div>
  )
}

// ---------- 집 카드 ----------
function HomeCard({ h, state, station, selected, onSelect }) {
  const d = h.rep
  const jeonse = state.k === 'jeonse'
  const others = h.deals.length - 1
  return (
    <li className={`apt-card cm-card${selected ? ' is-on' : ''}`} id={`cm-${h.key}`}>
      <p className="apt-card__where">
        {h.sggName} {h.dong}
        {h.built ? ` · ${h.built}년` : ''} · {h.kindLabel}
      </p>
      <h3 className="apt-card__name">{h.title}</h3>
      {jeonse ? (
        <p className="cm-card__price">
          <span className="apt-card__tag">전세</span>
          <strong>{man(d.deposit)}</strong>
        </p>
      ) : (
        <p className="cm-card__price">
          <span className="apt-card__tag">월세</span>
          <strong>{man(d.monthly)}</strong>
          <span className="cm-card__dep">보증금 {man(d.deposit)}</span>
        </p>
      )}
      <p className="cm-card__dist">
        {station.name}역까지 직선 <strong>{distText(h.dist)}</strong>
        {h.approx && <span className="apt-card__few">동 중심 기준</span>}
      </p>
      <p className="cm-card__cost">
        한 달 집값 약 <strong>{won(monthlyCost(d))}</strong> <small>{jeonse ? '(보증금 이자)' : '(월세 + 보증금 이자)'}</small>
      </p>
      <p className="apt-card__meta">
        {areaText(d.area)}
        {d.floor ? ` · ${d.floor}층` : ''} · {dateText(d.date)} {d.renew ? '갱신' : '신규'} 계약
        {others > 0 && (
          <>
            <br />
            같은 곳 계약 {h.deals.length}건, {jeonse ? '전세' : '월세'} {h.low === h.high ? man(h.low) : `${man(h.low)}~${man(h.high)}`}
          </>
        )}
      </p>
      <div className="cm-card__acts">
        <button type="button" className="apt-card__map cm-card__go" aria-pressed={selected} onClick={() => onSelect(h.key)}>
          {selected ? '지도에 길 표시 중' : '출퇴근 길 보기'}
        </button>
        <a className="cm-card__survive" href={surviveLink(d)} onClick={() => track('commute_survive', { type: state.t, kind: state.k })}>
          이 집에서 월급 며칠 버틸까
        </a>
      </div>
    </li>
  )
}

// ---------- 자료 불러오기 ----------
const files = new Map() // 시군구 코드 → 집 목록 (페이지가 열려 있는 동안만)
function loadFile(code) {
  if (!files.has(code)) {
    files.set(
      code,
      fetch(`${DATA}/${code}.json`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then(readHomes)
        .catch((e) => {
          files.delete(code)
          throw e
        }),
    )
  }
  return files.get(code)
}

async function fetchRoute(mode, home, station) {
  const p = new URLSearchParams({ mode, sx: home.lng, sy: home.lat, ex: station.lng, ey: station.lat, name: `${station.name}역` })
  const r = await fetch(`/api/route/?${p}`)
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || '경로를 불러오지 못했어요')
  return j
}

export default function CommuteApp({ initialSearch = '' }) {
  const [state, setState] = useState(() => fromSearch(typeof window === 'undefined' ? initialSearch : window.location.search))
  const set = (k) => (v) => {
    setState((s) => ({ ...s, [k]: v }))
    track('commute_pick', { [k]: v })
  }

  // 역 목록
  const [data, setData] = useState(null)
  const [dataError, setDataError] = useState(false)
  useEffect(() => {
    fetch(`${DATA}/stations.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => setData(readStations(j)))
      .catch(() => setDataError(true))
  }, [])
  const station = useMemo(() => stationOf(data, state.st), [data, state.st])
  const [line, setLine] = useState('')
  const curLine = station && station.lines.includes(line) ? line : station?.lines[0] || ''
  const lineStations = useMemo(() => (station && data ? stationsOn(data, station.region, curLine) : []), [data, station, curLine])
  const [shown, setShown] = useState(PAGE)
  const [selected, setSelected] = useState('')
  const [route, setRoute] = useState({})
  const pickStation = useCallback((id) => {
    setState((s) => ({ ...s, st: id }))
    setSelected('')
    track('commute_station', { st: id })
  }, [])

  // 주소창
  useEffect(() => {
    const url = new URL(window.location.href)
    url.search = toSearch({ ...state, st: station?.id || state.st })
    if (url.href !== window.location.href) window.history.replaceState(null, '', url)
  }, [state, station])
  useEffect(() => {
    const onPop = () => setState(fromSearch(window.location.search))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // 역 주변 계약 찾기
  const [result, setResult] = useState({ status: 'idle', list: [], cut: false })
  useEffect(() => {
    if (!station) return
    let alive = true
    const isAlive = () => alive
    setResult({ status: 'loading', list: [], cut: false })
    setShown(PAGE)
    ;(async () => {
      try {
        const homes = (await Promise.all(station.near.map((g) => loadFile(g.code).catch(() => [])))).flat()
        const fit = homes.map((h) => fitHome(h, state)).filter(Boolean)
        if (!alive) return
        if (!hasMap()) return setResult({ status: 'nomap', list: [], cut: false })
        const kakao = await loadKakao()
        if (!alive) return
        setResult((r) => ({ ...r, status: 'locating' }))
        await findNear(kakao, fit, station, Number(state.d), (list, done, cut) => alive && setResult({ status: done ? 'done' : 'locating', list, cut: !!cut }), isAlive)
      } catch {
        if (alive) setResult({ status: 'error', list: [], cut: false })
      }
    })()
    return () => {
      alive = false
    }
  }, [station, state.k, state.t, state.d])

  const list = useMemo(() => sortHomes(result.list, state.o, state), [result.list, state])
  const sum = useMemo(() => summarize(result.list, state), [result.list, state])

  // 고른 집과 경로
  const pickHome = useCallback((key, fromMap) => {
    setSelected(key)
    if (key) track('commute_route', { from: fromMap ? 'map' : 'card' })
    if (key && fromMap) setShown((n) => Math.max(n, PAGE * 50)) // 목록 뒤쪽 집이면 카드도 보이게
    if (key && !fromMap) {
      // 카드에서 누르면 길이 그려지는 지도로 올라간다 (움직임 줄이기 설정이면 바로)
      const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      setTimeout(() => document.getElementById('cm-map')?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }), 40)
    }
  }, [])
  useEffect(() => {
    setRoute({})
    const home = result.list.find((h) => h.key === selected)
    if (!home || !station) return
    let alive = true
    for (const mode of ['walk', 'transit']) {
      setRoute((r) => ({ ...r, [mode]: { status: 'loading' } }))
      fetchRoute(mode, home, station)
        .then((data) => alive && setRoute((r) => ({ ...r, [mode]: { status: 'ok', data } })))
        .catch((e) => alive && setRoute((r) => ({ ...r, [mode]: { status: 'error', error: e.message } })))
    }
    return () => {
      alive = false
    }
    // 목록이 다시 그려져도(찾는 중) 같은 집이면 다시 부르지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, station])
  useEffect(() => {
    if (selected && !result.list.some((h) => h.key === selected) && result.status === 'done') setSelected('')
  }, [result, selected])

  const share = useMemo(() => {
    if (typeof window === 'undefined' || !station) return null
    const url = new URL(COMMUTE, window.location.origin)
    url.search = toSearch({ ...state, st: station.id })
    const type = TYPES.find((x) => x.id === state.t).label
    const kind = KINDS.find((x) => x.id === state.k).label
    return {
      url: url.toString(),
      text: sum.count
        ? `${station.name}역 ${DISTS.find((x) => x.id === state.d).label} 안 ${type} ${kind}, 요즘 ${state.k === 'jeonse' ? `전세 ${man(sum.price)}` : `월세 ${man(sum.price)}`}에 계약돼요 | 돈미터 직주근접 계산기`
        : `${station.name}역 근처 ${type} ${kind}는 얼마일까? | 돈미터 직주근접 계산기`,
    }
  }, [state, station, sum])

  // 요약 카드를 지나 아래로 내려간 뒤에만 다른 계산기 바로가기를 띄운다
  const sumRef = useRef(null)
  const [pastSum, setPastSum] = useState(false)
  useEffect(() => {
    const el = sumRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setPastSum(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [station])

  const pickedHome = selected ? result.list.find((h) => h.key === selected) : null
  const status = dataError ? 'error' : result.status
  const visible = list.slice(0, shown)

  return (
    <div className="page">
      <header className="masthead">
        <a className="brand" href="/">
          <BrandMark />
          돈미터
        </a>
        <nav className="topnav" aria-label="주요 메뉴">
          <SiteMenu current={COMMUTE} items={ITEMS_MENU} links={LINKS} />
          <button type="button" className="theme-pick__toggle" data-theme-toggle aria-expanded="false" aria-controls="theme-menu" aria-label="화면 색 바꾸기">
            <span className="theme-pick__dot" aria-hidden="true" />
            테마
          </button>
        </nav>
      </header>

      <AdRails slot={SLOTS.rail} />

      <main className="main">
        <section className="hero cm-hero">
          <div className="hero__text">
            <h1 className="hero__title">직주근접 계산기</h1>
            <p className="hero__lede">회사 근처 역을 고르면, 역 주변에서 최근 계약된 전세·월세와 집에서 역까지 출퇴근 시간을 보여 드려요.</p>
          </div>
        </section>

        <form className="apt-form" onSubmit={(e) => e.preventDefault()} aria-label="집 조건과 역 고르기">
          <Choices legend="계약" name="k" options={KINDS} value={state.k} onChange={set('k')} />
          <Choices legend="집" name="t" options={TYPES} value={state.t} onChange={set('t')} />
          <Choices legend="역에서 거리" name="d" options={DISTS} value={state.d} onChange={set('d')} />
          {data ? (
            <StationPicker data={data} station={station} onPick={pickStation} onLine={setLine} />
          ) : (
            <p className="cm-note" role="status">
              {dataError ? '역 자료를 불러오지 못했어요. 잠시 뒤 새로 고침해 주세요.' : '역 목록을 불러오고 있어요…'}
            </p>
          )}
        </form>

        {station && (
          <div className="cm-result">
            <CommuteMap
              station={station}
              lineStations={lineStations}
              list={result.list}
              selected={selected}
              route={route}
              radius={Number(state.d)}
              state={state}
              onPickStation={pickStation}
              onPickHome={pickHome}
            />
            {pickedHome && <PickedBar home={pickedHome} state={state} station={station} route={route} onClose={() => setSelected('')} />}
            <div aria-live="polite" ref={sumRef}>
              <Summary sum={sum} state={state} station={station} data={data} result={result} />
            </div>


            {list.length > 0 && (
              <>
                <div className="apt-sort">
                  <div className="apt-sort__opts" role="radiogroup" aria-label="목록 순서">
                    {SORTS.map((x) => (
                      <button key={x.id} type="button" role="radio" aria-checked={state.o === x.id} className={`apt-sort__btn${state.o === x.id ? ' is-on' : ''}`} onClick={() => set('o')(x.id)}>
                        {x.label}
                      </button>
                    ))}
                  </div>
                  {(status === 'locating' || result.cut) && (
                    <p className="apt-sort__msg" role="status">
                      {status === 'locating' ? '지도에서 집 위치를 찾는 중이에요. 목록이 더 늘어날 수 있어요.' : '집이 많아 역에서 가까운 동부터 120곳까지만 찾아봤어요.'}
                    </p>
                  )}
                </div>
                <ul className="apt-cards cm-cards">
                  {visible.map((h) => (
                    <HomeCard key={h.key} h={h} state={state} station={station} selected={h.key === selected} onSelect={(k) => pickHome(k, false)} />
                  ))}
                </ul>
                {list.length > shown && (
                  <button type="button" className="apt-more" onClick={() => setShown((n) => n + PAGE)}>
                    더 보기 <span>{(list.length - shown).toLocaleString('ko-KR')}곳 남음</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {share && <ShareBar url={share.url} text={share.text} sub="링크를 받은 사람도 같은 역과 조건으로 볼 수 있어요." />}

        <AdSlot variant="inline" slot={SLOTS.inline} />

        <CommuteGuide ad={<AdSlot variant="mid" slot={SLOTS.mid} />} rate={JEONSE_RATE} />
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
        <p>전월세 계약은 국토교통부 실거래가 공개 자료, 역은 국가철도공단 표준데이터, 위치와 경로는 카카오맵에서 그때그때 받아 보여 드려요. 매물 정보가 아니에요.</p>
      </footer>

      <FloatingSwitch current={COMMUTE} hidden={!pastSum} />
      <AdSlot variant="anchor" slot={SLOTS.anchor} />
    </div>
  )
}
