// 주식 물타기 계산기 (/stock/) 계산과 저장
//
// 시세는 자동으로 가져오지 않는다. 공공데이터포털의 금융위원회 주식시세정보·KRX상장종목정보는
// 공공누리 4유형(상업적 이용금지, 제3자 제공·재배포 금지)이라 광고가 붙은 사이트에서 보여 줄 수 없다.
// 그래서 매수가와 현재가는 사용자가 증권 앱에서 보는 숫자를 직접 넣고, 계산은 모두 브라우저 안에서 한다.
// 입력값은 이 브라우저의 localStorage 에만 저장하고 서버로 보내지 않는다.

export const STORE_KEY = 'donmeter.stock.v1'
export const FEE = 0.00015 // 증권사 매매 수수료 어림 (0.015%, 증권사·이벤트마다 다르다)
export const TAX = 0.002 // 2026년 증권거래세: 코스피 0.05% + 농특세 0.15%, 코스닥 0.20% → 둘 다 0.20%
export const CHICKEN = 23000 // BBQ 황금올리브 (존버·월급 분당 계산기와 같은 값)
export const TARGETS = [-0.01, -0.03, -0.05, -0.1, -0.2, -0.3] // 물타기 목표 수익률
export const MAX_ITEMS = 20
export const MAX_LOTS = 20
const MAX_QTY = 10000000 // 1천만 주
const MAX_PRICE = 100000000 // 1억 원 (1주 가격)
const MIN_DATE = '1990-01-01'

// 고르기 쉬운 대표 종목 (이름만. 가격은 넣지 않는다). 목록에 없는 종목은 이름을 직접 쓴다.
export const POPULAR = [
  '삼성전자',
  'SK하이닉스',
  'LG에너지솔루션',
  '삼성바이오로직스',
  '현대차',
  '기아',
  '셀트리온',
  'NAVER',
  '카카오',
  'POSCO홀딩스',
  '한화에어로스페이스',
  'KB금융',
  '두산에너빌리티',
  '에코프로',
  '에코프로비엠',
  '알테오젠',
  'HLB',
  '삼성SDI',
  'LG화학',
  '카카오뱅크',
]

export const SOURCES = {
  tax: { label: '세계일보: 2026년 증권거래세 탄력세율 (코스피 0.20%, 코스닥 0.20%)', url: 'https://www.segye.com/newsView/20260105516769' },
  tax2: { label: 'studygov: 2026년 증권거래세 코스피 0.05% + 농특세 0.15%, 코스닥 0.20%', url: 'https://studygov.kr/blog/0337-2026-stock-transaction-tax/' },
  data: { label: '공공데이터포털: 금융위원회_주식시세정보 (공공누리 4유형)', url: 'https://www.data.go.kr/data/15094808/openapi.do' },
}

// ── 날짜 ─────────────────────────────────────────────

export function todayStr(now = new Date()) {
  const z = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${z(now.getMonth() + 1)}-${z(now.getDate())}`
}

// "2025-11-17" 에서 n 일 전
export function daysAgo(n, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - n)
  return todayStr(d)
}

const validDate = (s, today) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && s >= MIN_DATE && s <= today

export function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
}

// ── 입력 정리 (localStorage·주소에서 읽은 값도 같은 규칙으로 거른다) ──

export const toInt = (v, max) => {
  const n = Math.floor(Number(String(v ?? '').replace(/[^\d]/g, '')))
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0
}
export const toQty = (v) => toInt(v, MAX_QTY)
export const toPrice = (v) => toInt(v, MAX_PRICE)

// 종목 이름: 제어 문자·꺾쇠를 빼고 20자까지
export function cleanName(v) {
  return String(v ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20)
}

let seq = 0
export const newId = () => `s${Date.now().toString(36)}${(seq++).toString(36)}`

export function newLot(now = new Date()) {
  return { d: daysAgo(90, now), q: 0, p: 0 }
}

export function newItem(now = new Date()) {
  return { id: newId(), name: '', lots: [newLot(now)], cur: 0 }
}

// 처음 들어온 사람에게 보여 줄 예시 (실제 종목·시세가 아니다)
export function exampleItem(now = new Date()) {
  return { id: 'example', name: '', lots: [{ d: daysAgo(180, now), q: 100, p: 70000 }], cur: 61000, example: true }
}

export function cleanItem(it, now = new Date()) {
  if (!it || typeof it !== 'object') return null
  const today = todayStr(now)
  const lots = (Array.isArray(it.lots) ? it.lots : [])
    .slice(0, MAX_LOTS)
    .map((l) => ({ d: validDate(l?.d, today) ? l.d : '', q: toQty(l?.q), p: toPrice(l?.p) }))
  return {
    id: typeof it.id === 'string' && /^[\w-]{1,40}$/.test(it.id) ? it.id : newId(),
    name: cleanName(it.name),
    lots: lots.length ? lots : [newLot(now)],
    cur: toPrice(it.cur),
  }
}

// localStorage 에서 읽기 (없거나 깨졌으면 null)
export function loadStore() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    const items = (Array.isArray(s?.items) ? s.items : []).slice(0, MAX_ITEMS).map((it) => cleanItem(it)).filter(Boolean)
    if (!items.length) return null
    const active = items.some((it) => it.id === s.active) ? s.active : items[0].id
    return { items, active }
  } catch {
    return null
  }
}

export function saveStore(store) {
  try {
    const items = store.items.filter((it) => !it.example).slice(0, MAX_ITEMS)
    if (!items.length) window.localStorage.removeItem(STORE_KEY)
    else window.localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, active: store.active, items: items.map(({ id, name, lots, cur }) => ({ id, name, lots, cur })) }))
  } catch {
    // 저장소를 못 쓰는 브라우저(사생활 보호 모드 등)는 이번 방문 동안만 기억한다
  }
}

// ── 공유 링크: 숫자만 싣는다. 이름은 대표 종목 목록에 있을 때만 (임의 글자가 남의 화면에 뜨지 않게) ──

export function toShareSearch(r) {
  if (!r.ready) return ''
  const p = new URLSearchParams()
  if (POPULAR.includes(r.name)) p.set('n', r.name)
  p.set('a', String(Math.round(r.avg)))
  p.set('q', String(r.qty))
  p.set('c', String(r.cur))
  if (r.days > 0) p.set('d', String(Math.min(r.days, 20000)))
  return `?${p.toString()}`
}

export function fromShareSearch(search, now = new Date()) {
  const p = new URLSearchParams(search || '')
  const a = toPrice(p.get('a'))
  const q = toQty(p.get('q'))
  const c = toPrice(p.get('c'))
  if (!a || !q || !c) return null
  const n = p.get('n')
  const d = Math.min(toInt(p.get('d'), 20000), 20000)
  return { id: 'shared', name: POPULAR.includes(n) ? n : '', lots: [{ d: d ? daysAgo(d, now) : '', q, p: a }], cur: c, shared: true }
}

// ── 계산 ─────────────────────────────────────────────

export const displayName = (name) => name || '내 종목'

// 물타기: 지금 가격(cur)에 x주를 더 사서 수익률을 t(음수)로 만들려면
// 새 평단 = cur / (1 + t),  x = Q × (평단 − 새 평단) / (새 평단 − cur)
export function waterFor(t, { qty, avg, cur }) {
  const target = cur / (1 + t)
  if (!(target < avg) || !(target > cur)) return null
  const x = (qty * (avg - target)) / (target - cur)
  const shares = Math.ceil(x - 1e-9)
  const cost = shares * cur
  const newQty = qty + shares
  const newAvg = (qty * avg + cost) / newQty
  return {
    t,
    shares,
    cost,
    costWithFee: cost * (1 + FEE),
    newQty,
    newAvg,
    newRate: cur / newAvg - 1,
    rebound: newAvg / cur - 1, // 물타기 뒤 본전까지 올라야 하는 비율
  }
}

export function calculate(item, salary, now = new Date()) {
  const today = todayStr(now)
  const lots = item.lots.filter((l) => l.q > 0 && l.p > 0)
  const qty = lots.reduce((s, l) => s + l.q, 0)
  const invested = lots.reduce((s, l) => s + l.q * l.p, 0)
  const cur = item.cur
  const name = displayName(item.name)
  const base = { name: item.name, label: name, lots, qty, invested, cur, today, ready: false }
  if (!qty || !invested || !cur) return base

  const avg = invested / qty
  const value = qty * cur
  const pl = value - invested
  const rate = pl / invested
  const dates = lots.map((l) => l.d).filter((d) => validDate(d, today)).sort()
  const days = dates.length ? daysBetween(dates[0], today) : 0

  // 지금 다 팔면: 매도 수수료 + 증권거래세, 사면서 낸 수수료까지 빼서 손에 남는 돈
  const sellFee = value * FEE
  const sellTax = value * TAX
  const buyFee = invested * FEE
  const net = value - sellFee - sellTax - invested - buyFee
  // 세금·수수료까지 메우는 본전 가격
  const breakEven = (avg * (1 + FEE)) / (1 - FEE - TAX)

  const hourly = salary.net / 12 / 209
  const monthly = salary.net / 12

  const loss = pl < 0
  const rebound = avg / cur - 1 // 본전(평단)까지 올라야 하는 비율
  const water = loss ? TARGETS.filter((t) => t > rate + 1e-9).map((t) => waterFor(t, { qty, avg, cur })).filter(Boolean) : []
  // 1년으로 환산: 반년 넘게 들고 있을 때만 (짧게 들면 숫자가 터무니없이 커진다)
  const annual = days >= 180 && rate > -1 ? Math.pow(1 + rate, 365 / days) - 1 : null

  return {
    ...base,
    ready: true,
    avg,
    value,
    pl,
    rate,
    days,
    loss,
    flat: Math.abs(rate) < 0.0005,
    rebound,
    breakEven,
    sellFee,
    sellTax,
    buyFee,
    net,
    water,
    annual,
    salary,
    hourly,
    monthly,
    plMonths: Math.abs(pl) / monthly,
    plDays: Math.abs(net) / hourly / 8,
    chickens: Math.floor(Math.abs(pl) / CHICKEN),
  }
}

// ── 글자 ─────────────────────────────────────────────

export const won = (v) => `${Math.round(v).toLocaleString('ko-KR')}원`
export const signPct = (x, digits = 1) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${(Math.abs(x) * 100).toFixed(digits).replace(/\.0+$/, '')}%`
export const pctPlain = (x, digits = 1) => `${(x * 100).toFixed(digits).replace(/\.0+$/, '')}%`
export const qtyText = (n) => `${Math.round(n).toLocaleString('ko-KR')}주`
export const monthsText = (m) => (m < 1 ? `${Math.max(1, Math.round(m * 30))}일` : `${m.toFixed(1).replace(/\.0$/, '')}달`)

export const FAQ = [
  {
    q: '현재가는 왜 직접 넣어야 하나요?',
    a: '공공데이터포털에서 받을 수 있는 주식 시세(금융위원회 주식시세정보)는 공공누리 4유형이라 광고가 붙은 사이트에서 다른 사람에게 보여 줄 수 없어요. 실시간 시세도 거래소·증권사와 따로 계약해야 해요. 그래서 증권 앱에 보이는 지금 가격과 내 평균 단가를 직접 넣는 방식으로 만들었어요.',
  },
  {
    q: '물타기로 본전(0%)을 만들 수는 없나요?',
    a: '지금 가격으로 더 사면 평균 단가는 지금 가격에 가까워질 뿐, 지금 가격보다 낮아지지는 않아요. 그래서 손실을 -1%, -3%처럼 줄일 수는 있어도 0%로 만들려면 끝없이 사야 해요. 본전은 주가가 평균 단가까지 올라와야 돌아와요.',
  },
  {
    q: '-20% 빠졌는데 왜 +25%가 올라야 본전인가요?',
    a: '떨어진 비율과 올라야 하는 비율의 기준이 달라서예요. 10,000원이 8,000원이 되면 20% 빠진 거지만, 8,000원이 다시 10,000원이 되려면 2,000원 ÷ 8,000원 = 25% 올라야 해요. 많이 빠질수록 이 차이는 더 커져요(-50%면 +100%).',
  },
  {
    q: '순익은 어떻게 계산하나요?',
    a: `지금 가격으로 모두 판다고 보고, 평가 금액에서 매도 수수료(${pctPlain(FEE, 3)} 어림)와 증권거래세(${pctPlain(TAX, 2)}), 살 때 낸 수수료를 빼고 매수 금액을 뺐어요. 수수료는 증권사마다 달라요. 대주주가 아니면 국내 상장주식 매매차익에는 양도세가 없고, 배당은 넣지 않았어요.`,
  },
  {
    q: '입력한 종목과 숫자는 어디에 저장되나요?',
    a: '이 브라우저의 저장소(localStorage)에만 저장돼요. 돈미터 서버로는 보내지 않고, 다른 기기나 브라우저에서는 보이지 않아요. 브라우저 기록을 지우면 함께 지워져요.',
  },
  {
    q: '투자 조언인가요?',
    a: '아니에요. 넣은 숫자로 평균 단가와 손익을 셈해 보는 계산기예요. 물타기를 할지, 팔지는 각자 판단할 일이고, 돈미터는 특정 종목이나 매매를 권하지 않아요.',
  },
]
