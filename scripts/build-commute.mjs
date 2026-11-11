// 지하철역 + 전월세 실거래 → 직주근접 계산기(/commute/) 데이터 만들기
//
//   npm run commute                   전국 도시철도역이 있는 시군구, 최근 6개월
//   npm run commute -- --months 3     기간 바꾸기
//   npm run commute -- --sido 11,41   일부 시도만 (시도 코드 앞 2자리)
//   npm run commute -- --debug        API 응답 첫 항목의 필드 이름을 보여 준다 (필드가 바뀌었을 때)
//
// 자료 (모두 공공데이터포털, 같은 인증키로 각각 활용신청):
//   1) 국가철도공단 전국도시철도역사정보표준데이터 (파일): data/subway-stations.csv 로 내려받아 둔다
//      https://www.data.go.kr/data/15013205/standard.do  → CSV 내려받기 → data/subway-stations.csv
//   2) 행정안전부_행정표준코드_법정동코드: 시군구 코드 (집 사기 계산기와 같은 캐시를 쓴다)
//   3) 국토교통부 전월세 실거래가 자료 4종: 아파트, 연립다세대, 오피스텔, 단독/다가구
//   실거래가 공개시스템(rt.molit.go.kr) 화면은 자동 수집을 금지하므로 쓰지 않는다.
//
// 인증키: .env.local 의 DATA_GO_KR_KEY (일반 인증키 Decoding). 화면 코드와 결과 파일에는 들어가지 않는다.
//
// 결과 (좌표는 역 좌표만 담는다. 집 위치는 화면에서 그때그때 카카오맵으로 찾고 저장하지 않는다):
//   public/data/commute/stations.json   역 목록 (이름, 노선, 위도·경도, 주변 시군구)
//   public/data/commute/<시군구코드>.json 그 시군구의 전월세 계약 (집마다 최근 계약 몇 건)
//
// 받아 둔 달은 .cache/commute/ 에 줄여서 저장하고 다시 부르지 않는다. 신고가 아직 들어오는 최근 2개월만 매번 새로 받는다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STATION_CSV = path.join(ROOT, 'data/subway-stations.csv')
const OUT_DIR = path.join(ROOT, 'public/data/commute')
const CACHE = path.join(ROOT, '.cache/commute')
const SGG_CACHE = path.join(ROOT, '.cache/apt/sigungu.json') // 집 사기 계산기(build-apt)와 같이 쓴다
const CODE_API = 'https://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList'

// 주거 형태 → 국토교통부 전월세 API
const KINDS = {
  apt: { label: '아파트', api: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent', apply: '국토교통부_아파트 전월세 실거래가 자료' },
  villa: { label: '연립다세대', api: 'https://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent', apply: '국토교통부_연립다세대 전월세 실거래가 자료' },
  offi: { label: '오피스텔', api: 'https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent', apply: '국토교통부_오피스텔 전월세 실거래가 자료' },
  house: { label: '단독다가구', api: 'https://apis.data.go.kr/1613000/RTMSDataSvcSHRent/getRTMSDataSvcSHRent', apply: '국토교통부_단독/다가구 전월세 실거래가 자료' },
}

const NEAR_KM = 2.5 // 역에서 이 거리 안에 다른 시군구 역이 있으면 그 시군구 계약도 함께 본다
const MERGE_M = 350 // 이름이 같고 이만큼 가까운 역(환승역)은 하나로 합친다
const KEEP = { apt: 12, villa: 12, offi: 12, house: 40 } // 집마다 남기는 최근 계약 수 (단독다가구는 동마다)

// ---------- 설정 ----------
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : def
}
const MONTHS = Number(arg('months', 6))
const DEBUG = process.argv.includes('--debug')
const ONLY = arg('sido', '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function readKey() {
  if (process.env.DATA_GO_KR_KEY) return process.env.DATA_GO_KR_KEY.trim()
  for (const f of ['.env.local', '.env']) {
    const p = path.join(ROOT, f)
    if (!fs.existsSync(p)) continue
    const m = fs.readFileSync(p, 'utf8').match(/^\s*DATA_GO_KR_KEY\s*=\s*"?([^"\r\n]+)"?/m)
    if (m) return m[1].trim()
  }
  return ''
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function monthList(n) {
  const now = new Date()
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

async function get(url) {
  for (let tryNo = 1; ; tryNo++) {
    try {
      const res = await fetch(url)
      const text = await res.text()
      if (!res.ok) {
        const auth = authError(text)
        const e = new Error(auth ? `인증 오류(${auth})` : `HTTP ${res.status} ${text.slice(0, 120)}`)
        e.auth = !!auth
        throw e
      }
      return text
    } catch (e) {
      if (e.auth || tryNo >= 3) throw e
      await sleep(1500 * tryNo)
    }
  }
}

const authError = (text) => {
  const m =
    text.match(/<returnAuthMsg>([^<]*)</) ||
    text.match(/SERVICE_KEY_IS_NOT_REGISTERED_ERROR|SERVICE_ACCESS_DENIED_ERROR|LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR|PERMISSION_DENIED/)
  return m ? m[1] || m[0] : ''
}

// ---------- 1) 역 (전국도시철도역사정보표준데이터 CSV) ----------
function decode(buf) {
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buf)
  // 깨진 글자(�)가 많으면 EUC-KR 파일이다
  if ((utf8.match(/�/g) || []).length > 5) return new TextDecoder('euc-kr').decode(buf)
  return utf8.replace(/^﻿/, '')
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      if (row.some((x) => x.trim())) rows.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  row.push(cell)
  if (row.some((x) => x.trim())) rows.push(row)
  return rows
}

function readStations() {
  if (!fs.existsSync(STATION_CSV)) {
    throw new Error(
      `역 파일이 없습니다: ${path.relative(ROOT, STATION_CSV)}\n` +
        '  공공데이터포털 "전국도시철도역사정보표준데이터"(https://www.data.go.kr/data/15013205/standard.do)에서 CSV 를 내려받아 이 이름으로 넣어 주세요.',
    )
  }
  const [head, ...rows] = parseCsv(decode(fs.readFileSync(STATION_CSV)))
  const col = (...names) => {
    const i = head.findIndex((h) => names.some((n) => h.replace(/\s/g, '').includes(n)))
    if (i < 0) throw new Error(`역 파일에서 "${names[0]}" 열을 찾지 못했습니다. 첫 줄: ${head.join(', ')}`)
    return i
  }
  const c = {
    id: col('역번호'),
    name: col('역사명'),
    line: col('노선명'),
    lat: col('위도'),
    lng: col('경도'),
    addr: col('도로명주소', '주소'),
  }
  const out = []
  for (const r of rows) {
    const lat = Number(r[c.lat])
    const lng = Number(r[c.lng])
    if (!(lat > 33 && lat < 39 && lng > 124 && lng < 132)) continue
    const name = String(r[c.name] || '')
      .trim()
      .replace(/역$/, '')
    if (!name) continue
    out.push({ id: String(r[c.id] || '').trim(), name, line: String(r[c.line] || '').trim(), lat, lng, addr: String(r[c.addr] || '').trim() })
  }
  if (!out.length) throw new Error('역 파일에서 역을 하나도 읽지 못했습니다.')
  return out
}

const RAD = Math.PI / 180
export function meters(a, b) {
  const x = (b.lng - a.lng) * RAD * Math.cos(((a.lat + b.lat) / 2) * RAD)
  const y = (b.lat - a.lat) * RAD
  return Math.sqrt(x * x + y * y) * 6371000
}

// 지역 묶음: 시도 코드 앞 2자리 → 화면의 지역 버튼
const REGIONS = [
  { id: 'capital', label: '수도권', sido: ['11', '28', '41', '43', '44', '51'] },
  { id: 'busan', label: '부산·울산·경남', sido: ['26', '31', '48'] },
  { id: 'daegu', label: '대구', sido: ['27', '47'] },
  { id: 'gwangju', label: '광주', sido: ['12', '29', '46'] },
  { id: 'daejeon', label: '대전', sido: ['30', '36'] },
]

// ---------- 2) 시군구 목록 (집 사기 계산기 캐시를 함께 쓴다) ----------
async function loadSigungu(KEY_Q) {
  if (fs.existsSync(SGG_CACHE) && Date.now() - fs.statSync(SGG_CACHE).mtimeMs < 30 * 86400000) return JSON.parse(fs.readFileSync(SGG_CACHE, 'utf8'))
  const rows = []
  for (let page = 1; page < 100; page++) {
    const text = await get(`${CODE_API}?ServiceKey=${KEY_Q}&type=json&pageNo=${page}&numOfRows=1000&flag=Y`)
    const auth = authError(text)
    if (auth) throw new Error(`법정동코드 API 인증 오류(${auth}). 공공데이터포털에서 "행정안전부_행정표준코드_법정동코드"도 활용신청해 주세요.`)
    const found = []
    const walk = (v) => {
      if (Array.isArray(v)) v.forEach(walk)
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) k === 'row' && Array.isArray(x) ? found.push(...x) : walk(x)
    }
    walk(JSON.parse(text))
    rows.push(...found)
    if (found.length < 1000) break
    await sleep(150)
  }
  const sidoName = new Map()
  const sgg = []
  for (const r of rows) {
    const code = String(r.region_cd || '')
    if (code.length !== 10 || String(r.umd_cd) !== '000' || String(r.ri_cd) !== '00') continue
    if (String(r.sgg_cd) === '000') sidoName.set(code.slice(0, 2), String(r.locatadd_nm).trim())
    else sgg.push({ code: code.slice(0, 5), full: String(r.locatadd_nm).trim() })
  }
  const list = sgg.filter((p) => !sgg.some((c) => c !== p && c.full.startsWith(`${p.full} `)))
  const out = {
    fetched: new Date().toISOString().slice(0, 10),
    sido: [...sidoName].map(([code, name]) => ({ code, name })),
    sgg: list.map((s) => {
      const sido = sidoName.get(s.code.slice(0, 2)) || ''
      return { code: s.code, full: s.full, name: s.full.startsWith(`${sido} `) ? s.full.slice(sido.length + 1) : s.full }
    }),
  }
  fs.mkdirSync(path.dirname(SGG_CACHE), { recursive: true })
  fs.writeFileSync(SGG_CACHE, JSON.stringify(out))
  return out
}

// 주소 → 시군구 후보 코드들. "서울특별시 중구 …", "서울시 서초구 …", "경기 수원시 영통구 …", "달서구 달구벌대로 …"(시도 없음)처럼 써도 맞춘다.
// 하나로 정해지면 [코드], "고양시 …"(구 없음)나 "중구 …"(시도 없음)처럼 여럿이면 후보 전부, 못 찾으면 [].
// 역 파일에는 행정구역 개편 전 이름이 남아 있다: 광주광역시 → 전남광주통합특별시, 인천 중구·동구·서구·남구 → 새 구 (2026년 7월)
const sidoKey = (t) =>
  t
    .replace(/특별자치시|특별자치도|특별시|광역시/, '')
    .replace(/^(충청|전라|경상)(남|북)도$/, (m, a, b) => `${a[0]}${b}`)
    .replace(/(도|시)$/, '')
const SIDO_ALIAS = { 광주: '전남광주통합' }
const SGG_ALIAS = {
  '인천|중구': ['제물포구', '영종구'],
  '인천|동구': ['제물포구'],
  '인천|서구': ['서해구', '검단구'],
  '인천|남구': ['미추홀구'],
}
function sggOfAddress(addr, sgg) {
  const tokens = addr.replace(/[?\s]+/g, ' ').trim().split(' ')
  const keyOf = (s) => sidoKey(s.full.split(' ')[0])
  const sidos = new Set(sgg.map(keyOf))
  const raw = sidoKey(tokens[0])
  const head = SIDO_ALIAS[raw] || raw
  const hasSido = sidos.has(head)
  const rest = `${(hasSido ? tokens.slice(1) : tokens).join(' ')} `
  const inSido = sgg.filter((s) => !hasSido || keyOf(s) === head)
  const first = rest.split(' ')[0]
  const alias = hasSido && SGG_ALIAS[`${raw}|${first}`]
  if (alias) return inSido.filter((s) => alias.includes(s.name)).map((s) => s.code)
  const tries = [
    (s) => rest.startsWith(`${s.name} `), // "강남구 …", "수원시 영통구 …"
    (s) => s.name.startsWith(`${first} `), // "고양시 …" → 고양시의 구들
    (s) => first.length >= 2 && (s.name.startsWith(first) || first.startsWith(s.name.split(' ')[0])), // "남양주 …", "수성구달구벌대로 …"
  ]
  for (const t of tries) {
    const hit = inSido.filter(t)
    if (!hit.length) continue
    const longest = Math.max(...hit.map((s) => s.name.length))
    return (t === tries[0] ? hit.filter((s) => s.name.length === longest) : hit).map((s) => s.code)
  }
  return []
}

function buildStations(raw, sgg) {
  // 같은 이름 + 가까운 역은 환승역으로 합친다
  const merged = []
  for (const r of raw) {
    const m = merged.find((x) => x.name === r.name && meters(x, r) < MERGE_M)
    if (m) {
      if (r.line && !m.lines.includes(r.line)) m.lines.push(r.line)
      if (!m.addr && r.addr) m.addr = r.addr
      if (r.id && (!m.id || r.id < m.id)) m.id = r.id
      continue
    }
    merged.push({ id: r.id, name: r.name, lines: r.line ? [r.line] : [], lat: r.lat, lng: r.lng, addr: r.addr })
  }
  for (const s of merged) s.cands = s.addr ? sggOfAddress(s.addr, sgg) : []
  // 시도 없이 "중구 …"처럼 적혀 후보가 여러 시도에 걸치면, 시도가 하나로 정해진 가장 가까운 역의 시도로 좁힌다
  const sidoOf = (c) => c.slice(0, 2)
  const oneSido = (s) => s.cands.length && new Set(s.cands.map(sidoOf)).size === 1
  const sure = merged.filter(oneSido)
  for (const s of merged) {
    if (!s.cands.length || oneSido(s)) continue
    const near = sure.reduce((a, b) => (!a || meters(s, b) < meters(s, a) ? b : a), null)
    const narrowed = near ? s.cands.filter((c) => sidoOf(c) === sidoOf(near.cands[0])) : []
    s.cands = narrowed.length ? narrowed : near ? near.cands : s.cands
  }
  // 주소로 못 찾은 역은 가장 가까운 역의 후보를 쓴다
  const known = merged.filter((s) => s.cands.length)
  let guessed = 0
  for (const s of merged) {
    if (s.cands.length) continue
    const near = known.reduce((a, b) => (!a || meters(s, b) < meters(s, a) ? b : a), null)
    if (near) {
      s.cands = near.cands
      guessed++
    }
  }
  // 주변 시군구: 자기 후보 + 가까운 역들의 후보 (후보가 여럿이면 모두 불러온다. 파일 하나 더 받는 정도라 괜찮다)
  for (const s of merged) {
    s.sgg = s.cands[0] || ''
    const set = new Set(s.cands)
    for (const o of merged) if (meters(s, o) < NEAR_KM * 1000) o.cands.forEach((c) => set.add(c))
    s.near = [...set].filter(Boolean)
    s.region = REGIONS.find((g) => g.sido.includes(s.sgg.slice(0, 2)))?.id || ''
  }
  // 같은 이름 역이 여러 개면 id 가 같아지지 않도록 (역번호가 비어 있을 때)
  const used = new Set()
  for (const s of merged) {
    let id = s.id || s.name
    while (used.has(id)) id += '_'
    used.add(id)
    s.id = id
  }
  return { list: merged.filter((s) => s.region), guessed }
}

// ---------- 3) 전월세 계약 ----------
function parseItems(xml, kind) {
  const auth = authError(xml)
  if (auth) throw new Error(`${KINDS[kind].label} 전월세 API 인증 오류(${auth}). 공공데이터포털에서 "${KINDS[kind].apply}"를 활용신청해 주세요.`)
  const code = (xml.match(/<resultCode>([^<]*)<\/resultCode>/) || [])[1]
  if (code && !/^0+$/.test(code)) throw new Error(`${KINDS[kind].label} 전월세 API 오류 ${code} ${(xml.match(/<resultMsg>([^<]*)<\/resultMsg>/) || [])[1] || ''}`)
  const total = Number((xml.match(/<totalCount>(\d+)<\/totalCount>/) || [])[1] || 0)
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, body]) => {
    const o = {}
    for (const [, k, v] of body.matchAll(/<([^\s>/]+)>([^<]*)<\/\1>/g)) o[k] = v.trim()
    return o
  })
  return { total, items }
}

const pick = (o, ...keys) => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== '') return o[k]
  return ''
}
const num = (v) => Number(String(v).replace(/[,\s]/g, '')) || 0

// 캐시에 줄여 넣는 모양: [이름, 동, 지번, 준공, 면적, 보증금(만원), 월세(만원), 'YYYYMMDD', 갱신, 층]
function compact(o) {
  const y = pick(o, 'dealYear', '년')
  const m = String(pick(o, 'dealMonth', '월')).padStart(2, '0')
  const d = String(pick(o, 'dealDay', '일')).padStart(2, '0')
  return [
    pick(o, 'aptNm', 'mhouseNm', 'offiNm', '아파트', '연립다세대', '단지', '단지명'),
    pick(o, 'umdNm', '법정동'),
    pick(o, 'jibun', '지번'),
    num(pick(o, 'buildYear', '건축년도')),
    num(pick(o, 'excluUseAr', 'totalFloorAr', '전용면적', '계약면적')),
    num(pick(o, 'deposit', '보증금액', '보증금')),
    num(pick(o, 'monthlyRent', '월세금액', '월세')),
    `${y}${m}${d}`,
    /갱신/.test(pick(o, 'contractType', '계약구분')) ? 1 : 0,
    num(pick(o, 'floor', '층')),
  ]
}

let calls = 0
let shown = new Set()
async function monthDeals(kind, lawd, ym, fresh, KEY_Q) {
  const file = path.join(CACHE, `${kind}-${lawd}-${ym}.json`)
  if (!fresh && fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'))
  const all = []
  for (let page = 1; page < 50; page++) {
    let xml
    try {
      xml = await get(`${KINDS[kind].api}?serviceKey=${KEY_Q}&LAWD_CD=${lawd}&DEAL_YMD=${ym}&pageNo=${page}&numOfRows=1000`)
    } catch (e) {
      if (!e.auth) throw e
      throw new Error(
        `${KINDS[kind].label} 전월세 API ${e.message}.\n` +
          `  공공데이터포털에서 "${KINDS[kind].apply}"를 활용신청했는지 확인해 주세요. 신청 직후에는 키가 등록되기까지 1~2시간 걸릴 수 있어요.\n` +
          '  이미 받은 달은 .cache/commute/ 에 남아 있어서, 다시 돌리면 이어서 받아요.',
      )
    }
    const { total, items } = parseItems(xml, kind)
    calls++
    if (DEBUG && items[0] && !shown.has(kind)) {
      shown.add(kind)
      console.log(`\n[commute] ${KINDS[kind].label} 응답 필드:`, Object.keys(items[0]).join(', '))
    }
    all.push(...items.map(compact))
    if (all.length >= total || items.length === 0) break
    await sleep(120)
  }
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(file, JSON.stringify(all))
  await sleep(100)
  return all
}

async function main() {
  const KEY = readKey()
  if (!KEY) throw new Error('DATA_GO_KR_KEY 가 없습니다. .env.local 에 DATA_GO_KR_KEY=공공데이터포털 인증키 를 넣어 주세요.')
  const KEY_Q = KEY.includes('%') ? KEY : encodeURIComponent(KEY)

  const { sgg } = await loadSigungu(KEY_Q)
  const raw = readStations()
  const { list: stations, guessed } = buildStations(raw, sgg)
  console.log(`[commute] 역 ${raw.length}줄 → ${stations.length}곳 (환승역 합침${guessed ? `, 주소로 시군구를 못 찾아 가까운 역으로 채운 곳 ${guessed}` : ''})`)

  const targets = [...new Set(stations.flatMap((s) => s.near))]
    .filter((c) => !ONLY.length || ONLY.includes(c.slice(0, 2)))
    .sort()
  const months = monthList(MONTHS)
  const freshFrom = months.slice(-2)
  console.log(`[commute] 시군구 ${targets.length}곳 × ${months.length}개월 × 4종`)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const sggInfo = new Map(sgg.map((s) => [s.code, s]))
  let deals = 0
  const counts = {}
  for (const [i, code] of targets.entries()) {
    const homes = new Map()
    for (const kind of Object.keys(KINDS)) {
      for (const ym of months) {
        for (const [name, dong, jibun, built, area, deposit, monthly, ymd, renew, floor] of await monthDeals(kind, code, ym, freshFrom.includes(ym), KEY_Q)) {
          if (!dong || !area || (!deposit && !monthly)) continue
          // 단독다가구는 지번이 공개되지 않아 동마다 하나로 묶는다
          const key = kind === 'house' ? `house|${dong}` : `${kind}|${dong}|${jibun}|${name}`
          if (!homes.has(key)) homes.set(key, { kind, name: kind === 'house' ? '' : name, dong, jibun: kind === 'house' ? '' : jibun, built: 0, deals: [] })
          const h = homes.get(key)
          if (built && kind !== 'house') h.built = Math.max(h.built, built)
          h.deals.push([Math.round(area * 10) / 10, deposit, monthly, ymd, renew, floor])
          deals++
        }
      }
    }
    // [종류, 이름, 동, 지번, 준공, [[면적, 보증금(만원), 월세(만원), 'YYYYMMDD', 갱신, 층], …최근 순]]
    const out = [...homes.values()]
      .map((h) => [h.kind, h.name, h.dong, h.jibun, h.built, h.deals.sort((a, b) => b[3].localeCompare(a[3])).slice(0, KEEP[h.kind])])
      .sort((a, b) => a[2].localeCompare(b[2], 'ko') || a[1].localeCompare(b[1], 'ko'))
    for (const h of out) counts[h[0]] = (counts[h[0]] || 0) + 1
    const info = sggInfo.get(code)
    fs.writeFileSync(path.join(OUT_DIR, `${code}.json`), JSON.stringify({ code, full: info?.full || '', name: info?.name || '', homes: out }) + '\n')
    process.stdout.write(`\r[commute] ${i + 1}/${targets.length} ${info?.full || code} 집 ${out.length}곳`.padEnd(70))
  }
  process.stdout.write('\n')

  const lines = [...new Set(stations.flatMap((s) => s.lines))].sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }))
  const usedSgg = [...new Set(stations.flatMap((s) => s.near))].sort()
  const index = {
    updated: new Date().toISOString().slice(0, 10),
    from: `${months[0].slice(0, 4)}-${months[0].slice(4)}`,
    to: `${months.at(-1).slice(0, 4)}-${months.at(-1).slice(4)}`,
    regions: REGIONS.map(({ id, label }) => ({ id, label })).filter((g) => stations.some((s) => s.region === g.id)),
    lines,
    sgg: usedSgg.map((c) => ({ code: c, full: sggInfo.get(c)?.full || '', have: targets.includes(c) })),
    // [id, 이름, 노선 번호들, 위도, 경도, 지역, 주변 시군구 번호들]
    stations: stations
      .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
      .map((s) => [
        s.id,
        s.name,
        s.lines.map((l) => lines.indexOf(l)),
        Math.round(s.lat * 1e6) / 1e6,
        Math.round(s.lng * 1e6) / 1e6,
        s.region,
        s.near.map((c) => usedSgg.indexOf(c)),
      ]),
  }
  fs.writeFileSync(path.join(OUT_DIR, 'stations.json'), JSON.stringify(index) + '\n')
  console.log(`[commute] 전월세 API 호출 ${calls}번, 계약 ${deals.toLocaleString()}건, 집 ${Object.entries(counts).map(([k, n]) => `${KINDS[k].label} ${n.toLocaleString()}`).join(', ')}`)
  console.log(`[commute] → ${path.relative(ROOT, OUT_DIR)}/stations.json, <시군구코드>.json ${targets.length}개`)
}

main().catch((e) => {
  console.error('\n[commute] 실패:', e.message)
  process.exit(1)
})
