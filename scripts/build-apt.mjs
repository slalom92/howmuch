// 아파트 실거래가 → 단지별 요약 JSON 만들기 (화면: /apt/ "연봉 모아 집 사기")
//
//   npm run apt                 서울, 최근 12개월
//   npm run apt -- --months 6   기간 바꾸기
//
// - 자료: 공공데이터포털 "국토교통부_아파트 매매 실거래가 상세 자료" 오픈 API (이용허락범위 제한 없음).
//   실거래가 공개시스템(rt.molit.go.kr) 화면은 자동 수집을 금지하므로 쓰지 않는다.
// - 인증키: .env.local 의 DATA_GO_KR_KEY (공공데이터포털 "일반 인증키(Decoding)"). 화면 코드에는 넣지 않는다.
//   이 스크립트는 키를 화면에 찍지 않는다. 결과 JSON 에도 키가 들어가지 않는다.
// - 결과: src/pages/apt/apt-data.json (화면이 빌드할 때 그대로 묶어 쓴다. 사이트는 API 를 직접 부르지 않는다.)
// - 받아 둔 달은 .cache/apt/ 에 저장해 다시 부르지 않는다. 신고가 아직 들어오는 최근 2개월만 매번 새로 받는다.
//
// 단지 가격 = 기간 안 해당 면적(전용 84㎡ 또는 59㎡) 거래가의 중간값.
//   - 계약 해제(cdealType = O)된 거래와 직거래는 뺀다 (직거래는 가족 간 거래처럼 시세와 먼 값이 많다).
//   - 84㎡: 전용 83㎡ 이상 86㎡ 미만, 59㎡: 58㎡ 이상 61㎡ 미만.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src/pages/apt/apt-data.json')
const CACHE = path.join(ROOT, '.cache/apt')
const ENDPOINT = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev'

// 지역: 시군구 코드(법정동 코드 앞 5자리). 지금은 서울 25개 구.
const REGION = {
  label: '서울',
  gu: [
    ['11110', '종로구'], ['11140', '중구'], ['11170', '용산구'], ['11200', '성동구'], ['11215', '광진구'],
    ['11230', '동대문구'], ['11260', '중랑구'], ['11290', '성북구'], ['11305', '강북구'], ['11320', '도봉구'],
    ['11350', '노원구'], ['11380', '은평구'], ['11410', '서대문구'], ['11440', '마포구'], ['11470', '양천구'],
    ['11500', '강서구'], ['11530', '구로구'], ['11545', '금천구'], ['11560', '영등포구'], ['11590', '동작구'],
    ['11620', '관악구'], ['11650', '서초구'], ['11680', '강남구'], ['11710', '송파구'], ['11740', '강동구'],
  ],
}

const BUCKETS = { 84: [83, 86], 59: [58, 61] }

// ---------- 설정 읽기 ----------
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : def
}
const MONTHS = Number(arg('months', 12))

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

// 최근 MONTHS 개월 (이번 달 포함), 'YYYYMM'
function monthList(n) {
  const now = new Date()
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

// ---------- API ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 응답 XML 에서 <item> 을 꺼낸다 (영문 태그와 예전 한글 태그 둘 다 받는다)
function parseItems(xml) {
  const code = (xml.match(/<resultCode>([^<]*)<\/resultCode>/) || [])[1]
  if (code && !/^0+$/.test(code)) {
    const msg = (xml.match(/<resultMsg>([^<]*)<\/resultMsg>/) || [])[1] || ''
    throw new Error(`API 오류 ${code} ${msg}`)
  }
  if (/<returnAuthMsg>/.test(xml)) throw new Error(`인증 오류 ${(xml.match(/<returnAuthMsg>([^<]*)</) || [])[1]}`)
  const total = Number((xml.match(/<totalCount>(\d+)<\/totalCount>/) || [])[1] || 0)
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, body]) => {
    const o = {}
    for (const [, k, v] of body.matchAll(/<([^\s>/]+)>([^<]*)<\/\1>/g)) o[k] = v.trim()
    return o
  })
  return { total, items }
}

async function fetchMonth(lawd, ym) {
  const all = []
  for (let page = 1; page < 50; page++) {
    const key = KEY.includes('%') ? KEY : encodeURIComponent(KEY) // Encoding 키를 넣었어도 두 번 인코딩하지 않는다
    const url = `${ENDPOINT}?serviceKey=${key}&LAWD_CD=${lawd}&DEAL_YMD=${ym}&pageNo=${page}&numOfRows=1000`
    let xml = ''
    for (let tryNo = 1; ; tryNo++) {
      try {
        const res = await fetch(url)
        xml = await res.text()
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        break
      } catch (e) {
        if (tryNo >= 3) throw e
        await sleep(1500 * tryNo)
      }
    }
    const { total, items } = parseItems(xml)
    all.push(...items)
    if (all.length >= total || items.length === 0) break
    await sleep(150)
  }
  return all
}

async function monthItems(lawd, ym, fresh) {
  const file = path.join(CACHE, `${lawd}-${ym}.json`)
  if (!fresh && fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'))
  const items = await fetchMonth(lawd, ym)
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(file, JSON.stringify(items))
  await sleep(120)
  return items
}

// ---------- 정리 ----------
const pick = (o, ...keys) => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== '') return o[k]
  return ''
}

function normalize(o, lawd) {
  const amount = Number(String(pick(o, 'dealAmount', '거래금액')).replace(/[,\s]/g, '')) // 만원
  const area = Number(pick(o, 'excluUseAr', '전용면적'))
  const y = pick(o, 'dealYear', '년')
  const m = String(pick(o, 'dealMonth', '월')).padStart(2, '0')
  return {
    lawd,
    name: pick(o, 'aptNm', '아파트'),
    dong: pick(o, 'umdNm', '법정동'),
    jibun: pick(o, 'jibun', '지번'),
    seq: pick(o, 'aptSeq', '일련번호'),
    built: Number(pick(o, 'buildYear', '건축년도')) || null,
    area,
    amount,
    ym: `${y}-${m}`,
    cancelled: /^o$/i.test(pick(o, 'cdealType', '해제여부')),
    direct: /직거래/.test(pick(o, 'dealingGbn', '거래유형')),
  }
}

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b)
  const h = Math.floor(s.length / 2)
  return s.length % 2 ? s[h] : Math.round((s[h - 1] + s[h]) / 2)
}

async function main() {
  const months = monthList(MONTHS)
  const freshFrom = months.slice(-2)
  const deals = []
  let calls = 0
  for (const [lawd, guName] of REGION.gu) {
    let n = 0
    for (const ym of months) {
      const fresh = freshFrom.includes(ym)
      if (fresh || !fs.existsSync(path.join(CACHE, `${lawd}-${ym}.json`))) calls++
      const items = await monthItems(lawd, ym, fresh)
      for (const it of items) deals.push(normalize(it, lawd))
      n += items.length
    }
    console.log(`[apt] ${guName} ${n}건`)
  }

  const guIndex = new Map(REGION.gu.map(([code], i) => [code, i]))
  const groups = new Map()
  let used = 0
  for (const d of deals) {
    if (d.cancelled || d.direct || !d.name || !d.amount) continue
    const bucket = Object.keys(BUCKETS).find((b) => d.area >= BUCKETS[b][0] && d.area < BUCKETS[b][1])
    if (!bucket) continue
    const key = `${d.lawd}|${d.seq || `${d.dong}|${d.jibun}|${d.name}`}`
    if (!groups.has(key)) groups.set(key, { name: d.name, gu: guIndex.get(d.lawd), dong: d.dong, built: d.built, 84: [], 59: [] })
    const g = groups.get(key)
    g[bucket].push(d)
    if (d.built && !g.built) g.built = d.built
    used++
  }

  // [이름, 구 번호, 동, 준공연도, 84㎡ 중간값(만원), 84㎡ 건수, 84㎡ 최근 거래월, 59㎡ 중간값, 59㎡ 건수, 59㎡ 최근 거래월]
  const sum = (list) => (list.length ? [median(list.map((d) => d.amount)), list.length, list.map((d) => d.ym).sort().at(-1)] : [0, 0, ''])
  const apts = [...groups.values()]
    .map((g) => [g.name, g.gu, g.dong, g.built || 0, ...sum(g[84]), ...sum(g[59])])
    .sort((a, b) => a[0].localeCompare(b[0], 'ko'))

  const out = {
    updated: new Date().toISOString().slice(0, 10),
    from: `${months[0].slice(0, 4)}-${months[0].slice(4)}`,
    to: `${months.at(-1).slice(0, 4)}-${months.at(-1).slice(4)}`,
    region: REGION.label,
    gu: REGION.gu.map(([, n]) => n),
    deals: used,
    apts,
  }
  fs.writeFileSync(OUT, JSON.stringify(out) + '\n')
  console.log(`[apt] API 호출 ${calls}번, 거래 ${deals.length}건 중 ${used}건 사용, 단지 ${apts.length}곳 → ${path.relative(ROOT, OUT)} (${Math.round(fs.statSync(OUT).size / 1024)}KB)`)
}

main().catch((e) => {
  console.error('[apt] 실패:', e.message)
  process.exit(1)
})
