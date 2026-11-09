// 아파트 실거래가 → 시도별 단지 요약 JSON 만들기 (화면: /apt/ "연봉 모아 집 사기")
//
//   npm run apt                     전국, 최근 12개월
//   npm run apt -- --sido 11,41     일부 시도만 (시도 코드 앞 2자리)
//   npm run apt -- --months 6       기간 바꾸기
//
// 자료 (둘 다 공공데이터포털, 이용허락범위 제한 없음, 같은 인증키로 각각 활용신청):
//   1) 행정안전부_행정표준코드_법정동코드: 지금 쓰는 시군구 목록과 이름 (행정구역이 바뀌어도 따라간다)
//   2) 국토교통부_아파트 매매 실거래가 상세 자료: 시군구 × 계약월 거래 목록
//   실거래가 공개시스템(rt.molit.go.kr) 화면은 자동 수집을 금지하므로 쓰지 않는다.
//
// 인증키: .env.local 의 DATA_GO_KR_KEY (일반 인증키 Decoding). 화면 코드와 결과 파일에는 들어가지 않는다.
//
// 결과:
//   src/pages/apt/apt-data.json      시도 목록과 시군구 이름, 단지 수 (화면에 묶인다, 작다)
//   public/data/apt/<시도코드>.json  시도별 단지 요약 (고른 시도만 화면이 불러온다)
//
// 단지 가격 = 기간 안 해당 면적 거래가의 중간값. 계약 해제(cdealType=O)와 직거래는 뺀다.
//   84㎡: 전용 83㎡ 이상 86㎡ 미만, 59㎡: 58㎡ 이상 61㎡ 미만.
// 좌표는 만들지도 저장하지도 않는다 (지도와 '내 주변 먼저'는 화면에서 그때그때 카카오맵으로 찾는다).
//
// 받아 둔 달은 .cache/apt/ 에 줄여서 저장하고 다시 부르지 않는다. 신고가 아직 들어오는 최근 2개월만 매번 새로 받는다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const INDEX_OUT = path.join(ROOT, 'src/pages/apt/apt-data.json')
const DATA_DIR = path.join(ROOT, 'public/data/apt')
const CACHE = path.join(ROOT, '.cache/apt')
const TRADE_API = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev'
const CODE_API = 'https://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList'

const BUCKETS = { 84: [83, 86], 59: [58, 61] }

// ---------- 설정 ----------
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : def
}
const MONTHS = Number(arg('months', 12))
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

const KEY = readKey()
if (!KEY) {
  console.error('[apt] DATA_GO_KR_KEY 가 없습니다. .env.local 에 DATA_GO_KR_KEY=공공데이터포털 인증키 를 넣어 주세요.')
  process.exit(1)
}
const KEY_Q = KEY.includes('%') ? KEY : encodeURIComponent(KEY) // Encoding 키를 넣었어도 두 번 인코딩하지 않는다

function monthList(n) {
  const now = new Date()
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(url) {
  for (let tryNo = 1; ; tryNo++) {
    try {
      const res = await fetch(url)
      const text = await res.text()
      if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 120)}`)
      return text
    } catch (e) {
      if (tryNo >= 3) throw e
      await sleep(1500 * tryNo)
    }
  }
}

const authError = (text) => {
  const m = text.match(/<returnAuthMsg>([^<]*)</) || text.match(/SERVICE_KEY_IS_NOT_REGISTERED_ERROR|SERVICE_ACCESS_DENIED_ERROR|LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR/)
  return m ? m[1] || m[0] : ''
}

// ---------- 1) 시군구 목록 (행정표준코드_법정동코드) ----------
// 실거래가 API 의 시군구 코드는 법정동 코드 앞 5자리. 구가 있는 시(수원시 등)는 구 코드로 부른다.
async function loadSigungu() {
  const file = path.join(CACHE, 'sigungu.json')
  if (fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 30 * 86400000) return fillSido(JSON.parse(fs.readFileSync(file, 'utf8')))
  const rows = []
  for (let page = 1; page < 100; page++) {
    const text = await get(`${CODE_API}?ServiceKey=${KEY_Q}&type=json&pageNo=${page}&numOfRows=1000&flag=Y`)
    const auth = authError(text)
    if (auth) throw new Error(`법정동코드 API 인증 오류(${auth}). 공공데이터포털에서 "행정안전부_행정표준코드_법정동코드"도 활용신청해 주세요.`)
    let json
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error(`법정동코드 API 응답을 읽지 못했습니다: ${text.slice(0, 160)}`)
    }
    // 응답 모양: { StanReginCd: [ { head: [...] }, { row: [...] } ] } — 어디에 있든 row 를 찾는다
    const found = []
    const walk = (v) => {
      if (Array.isArray(v)) v.forEach(walk)
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) k === 'row' && Array.isArray(x) ? found.push(...x) : walk(x)
    }
    walk(json)
    rows.push(...found)
    if (found.length < 1000) break
    await sleep(150)
  }
  if (!rows.length) throw new Error('법정동코드 API 에서 시군구 목록을 받지 못했습니다.')

  const sidoName = new Map()
  const sgg = []
  for (const r of rows) {
    const code = String(r.region_cd || '')
    if (code.length !== 10 || String(r.umd_cd) !== '000' || String(r.ri_cd) !== '00') continue
    if (String(r.sgg_cd) === '000') sidoName.set(code.slice(0, 2), String(r.locatadd_nm).trim())
    else sgg.push({ code: code.slice(0, 5), full: String(r.locatadd_nm).trim() })
  }
  // 구가 있는 시는 시 대신 구들로 부른다 (예: "경기도 수원시" 는 빼고 "경기도 수원시 장안구" 등을 남긴다)
  const list = sgg.filter((p) => !sgg.some((c) => c !== p && c.full.startsWith(`${p.full} `)))
  const out = {
    fetched: new Date().toISOString().slice(0, 10),
    sido: [...sidoName].map(([code, name]) => ({ code, name })).sort((a, b) => a.code.localeCompare(b.code)),
    sgg: list
      .map((s) => {
        const sido = sidoName.get(s.code.slice(0, 2)) || ''
        return { code: s.code, full: s.full, name: s.full.startsWith(`${sido} `) ? s.full.slice(sido.length + 1) : s.full }
      })
      .sort((a, b) => a.code.localeCompare(b.code)),
  }
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(file, JSON.stringify(out))
  return fillSido(out)
}

// 시도 행이 없는 시군구(예: 세종특별자치시 36110)는 그 자신을 시도로 세운다.
function fillSido(data) {
  const have = new Set(data.sido.map((d) => d.code))
  for (const s of data.sgg) {
    const code = s.code.slice(0, 2)
    if (have.has(code)) continue
    data.sido.push({ code, name: s.full })
    have.add(code)
  }
  data.sido.sort((a, b) => a.code.localeCompare(b.code))
  return data
}

// ---------- 2) 거래 (아파트 매매 실거래가 상세) ----------
function parseItems(xml) {
  const auth = authError(xml)
  if (auth) throw new Error(`실거래가 API 인증 오류(${auth})`)
  const code = (xml.match(/<resultCode>([^<]*)<\/resultCode>/) || [])[1]
  if (code && !/^0+$/.test(code)) throw new Error(`실거래가 API 오류 ${code} ${(xml.match(/<resultMsg>([^<]*)<\/resultMsg>/) || [])[1] || ''}`)
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

// 캐시에는 쓰는 값만 줄여 넣는다: [이름, 동, 지번, 단지번호, 준공, 면적, 금액(만원), 'YYYY-MM', 해제, 직거래]
function compact(o) {
  return [
    pick(o, 'aptNm', '아파트'),
    pick(o, 'umdNm', '법정동'),
    pick(o, 'jibun', '지번'),
    pick(o, 'aptSeq', '일련번호'),
    Number(pick(o, 'buildYear', '건축년도')) || 0,
    Number(pick(o, 'excluUseAr', '전용면적')) || 0,
    Number(String(pick(o, 'dealAmount', '거래금액')).replace(/[,\s]/g, '')) || 0,
    `${pick(o, 'dealYear', '년')}-${String(pick(o, 'dealMonth', '월')).padStart(2, '0')}`,
    /^o$/i.test(pick(o, 'cdealType', '해제여부')) ? 1 : 0,
    /직거래/.test(pick(o, 'dealingGbn', '거래유형')) ? 1 : 0,
  ]
}

let calls = 0
async function monthDeals(lawd, ym, fresh) {
  const file = path.join(CACHE, `${lawd}-${ym}.json`)
  if (!fresh && fs.existsSync(file)) {
    const cached = JSON.parse(fs.readFileSync(file, 'utf8'))
    // 예전 스크립트(서울만 받던 때)는 응답 항목을 통째로 저장했다 → 줄인 모양으로 바꿔 쓴다
    return cached.map((d) => (Array.isArray(d) ? d : compact(d)))
  }
  const all = []
  for (let page = 1; page < 50; page++) {
    const { total, items } = parseItems(await get(`${TRADE_API}?serviceKey=${KEY_Q}&LAWD_CD=${lawd}&DEAL_YMD=${ym}&pageNo=${page}&numOfRows=1000`))
    calls++
    all.push(...items.map(compact))
    if (all.length >= total || items.length === 0) break
    await sleep(120)
  }
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(file, JSON.stringify(all))
  await sleep(100)
  return all
}

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b)
  const h = Math.floor(s.length / 2)
  return s.length % 2 ? s[h] : Math.round((s[h - 1] + s[h]) / 2)
}

// 시도 이름 줄임 (화면 버튼용). 모르는 이름은 그대로 쓴다.
function shortSido(name) {
  const fixed = { 충청북도: '충북', 충청남도: '충남', 전라북도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남' }
  if (fixed[name]) return fixed[name]
  const m = name.match(/^(.+?)(특별자치시|특별자치도|특별시|광역시|도)$/)
  return m ? m[1] : name
}

async function main() {
  const { sido, sgg } = await loadSigungu()
  const months = monthList(MONTHS)
  const freshFrom = months.slice(-2)
  const targets = sgg.filter((s) => !ONLY.length || ONLY.includes(s.code.slice(0, 2)))
  console.log(`[apt] 시군구 ${targets.length}곳 × ${months.length}개월`)

  fs.mkdirSync(DATA_DIR, { recursive: true })
  const index = []
  let used = 0
  const quiet = []
  for (const sd of sido) {
    const mine = targets.filter((s) => s.code.startsWith(sd.code))
    if (!mine.length) continue
    const groups = new Map()
    for (const [i, s] of mine.entries()) {
      let n = 0
      for (const ym of months) {
        const deals = await monthDeals(s.code, ym, freshFrom.includes(ym))
        n += deals.length
        for (const [name, dong, jibun, seq, built, area, amount, ymd, cancelled, direct] of deals) {
          if (cancelled || direct || !name || !amount) continue
          const bucket = Object.keys(BUCKETS).find((b) => area >= BUCKETS[b][0] && area < BUCKETS[b][1])
          if (!bucket) continue
          const key = `${s.code}|${seq || `${dong}|${jibun}|${name}`}`
          if (!groups.has(key)) groups.set(key, { name, sgg: i, dong, jibun, built, 84: [], 59: [] })
          const g = groups.get(key)
          g[bucket].push([amount, ymd])
          if (built && !g.built) g.built = built
          if (jibun && !g.jibun) g.jibun = jibun
          used++
        }
      }
      if (!n) quiet.push(s.full)
      process.stdout.write(`\r[apt] ${sd.name} ${i + 1}/${mine.length} ${s.name} ${n}건`.padEnd(60))
    }
    process.stdout.write('\n')

    const sum = (list) => (list.length ? [median(list.map((d) => d[0])), list.length, list.map((d) => d[1]).sort().at(-1)] : [0, 0, ''])
    // [이름, 시군구 번호, 동, 준공연도, 84 중간값(만원), 84 건수, 84 최근월, 59 중간값, 59 건수, 59 최근월, 지번]
    const apts = [...groups.values()]
      .map((g) => [g.name, g.sgg, g.dong, g.built || 0, ...sum(g[84]), ...sum(g[59]), g.jibun || ''])
      .sort((a, b) => a[0].localeCompare(b[0], 'ko'))
    const file = {
      sido: sd.name,
      code: sd.code,
      sgg: mine.map((s) => ({ code: s.code, name: s.name, full: s.full })),
      apts,
    }
    fs.writeFileSync(path.join(DATA_DIR, `${sd.code}.json`), JSON.stringify(file) + '\n')
    index.push({ code: sd.code, name: sd.name, short: shortSido(sd.name), sgg: mine.map((s) => ({ code: s.code, name: s.name })), apts: apts.length })
  }

  const out = {
    updated: new Date().toISOString().slice(0, 10),
    from: `${months[0].slice(0, 4)}-${months[0].slice(4)}`,
    to: `${months.at(-1).slice(0, 4)}-${months.at(-1).slice(4)}`,
    deals: used,
    sido: index,
  }
  fs.writeFileSync(INDEX_OUT, JSON.stringify(out) + '\n')
  const total = index.reduce((n, s) => n + s.apts, 0)
  console.log(`[apt] 실거래가 API 호출 ${calls}번, 거래 ${used.toLocaleString()}건 사용, 단지 ${total.toLocaleString()}곳, 시도 ${index.length}곳`)
  console.log(`[apt] → ${path.relative(ROOT, INDEX_OUT)}, ${path.relative(ROOT, DATA_DIR)}/*.json`)
  if (quiet.length) console.log(`[apt] 12개월 동안 거래가 한 건도 없는 시군구 ${quiet.length}곳: ${quiet.slice(0, 12).join(', ')}${quiet.length > 12 ? ' …' : ''}`)
}

main().catch((e) => {
  console.error('\n[apt] 실패:', e.message)
  process.exit(1)
})
