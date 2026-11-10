// 월급 분당 계산기: 연봉을 고르면 생활 속 물건 값을 "몇 시간 일해야 버는지"로 바꿔 보여 준다
//
// - 사용자는 숫자를 직접 쓰지 않고 연봉(대표 값)과 기준(실수령/세전)만 고른다.
// - 시급 = 한 달 급여 ÷ 209시간. 209시간은 주 40시간 + 유급 주휴시간을 한 달로 환산한 값으로, 최저임금 월급(10,320원 × 209)과 같은 기준이다.
// - 하루는 8시간. 출근 시계는 오전 9시 출근, 낮 12시~1시 점심시간은 빼고 센다.
import { SALARIES, PAY_SOURCES } from '../../lib/salary.js'

export { SALARIES }

export const HOURS_PER_MONTH = 209
export const HOURS_PER_DAY = 8
export const MIN_WAGE = 10320 // 2026년 최저시급 (세전)

export const BASES = [
  { id: 'net', label: '실수령' },
  { id: 'gross', label: '세전 연봉' },
]

export const DEFAULTS = { pay: '4500', b: 'net' }

export const SOURCES = {
  ...PAY_SOURCES,
  minwage: { label: '최저임금위원회, 2026년 적용 최저임금 시간급 10,320원', url: 'https://www.minimumwage.go.kr/' },
  subway: { label: '이투데이, 수도권 지하철 기본요금 1,550원 (2025년 6월 28일부터, 교통카드)', url: 'https://www.etoday.co.kr/news/view/2480312' },
  price: { label: 'SBS Biz, 한국소비자원 참가격 2026년 3월 서울 외식 평균 가격', url: 'https://biz.sbs.co.kr/amp/article/20000304844' },
  starbucks: { label: '스마트투데이, 스타벅스 아메리카노 톨 4,700원 (2025년 1월 24일부터)', url: 'https://www.smarttoday.co.kr/ko-kr/articles/70493' },
  netflix: { label: '글라스월렛, 2026년 넷플릭스 요금제 (스탠다드 월 13,500원)', url: 'https://glasswallet.com/blog/netflix-pricing-guide' },
  movie: { label: '뱅크샐러드, 2026년 멀티플렉스 성인 2D 주말 관람료 15,000원', url: 'https://www.banksalad.com/articles/%EB%A9%94%EA%B0%80%EB%B0%95%EC%8A%A4-%ED%95%A0%EC%9D%B8-%EC%B9%B4%EB%93%9C%EC%99%80-%EC%98%81%ED%99%94%ED%91%9C-%ED%95%A0%EC%9D%B8-%EB%B0%A9%EB%B2%95-%EA%B0%80%EA%B2%A9-%EC%A0%95%EB%A6%AC-2023' },
  chicken: { label: 'MTN, BBQ 황금올리브치킨 후라이드 23,000원 (2024년 6월 인상 뒤 유지)', url: 'https://news.mtn.co.kr/news-detail/2024052111194813151' },
  rent: { label: '머니투데이, 다방여지도 2026년 6월 서울 원룸 평균 월세 (보증금 1,000만 원 기준)', url: 'https://www.mt.co.kr/estate/2026/07/28/2026072808575932587' },
  galaxy: { label: '아이뉴스24, 갤럭시 S26 울트라 256GB 출고가 194만 7,000원 (2026년 10월 1일 인상 뒤)', url: 'https://inews24.com/view/2010655' },
  iphone: { label: '디지털데일리, 아이폰 18 프로 256GB 국내 출고가 199만 원', url: 'https://www.ddaily.co.kr/page/view/2026091003374504524' },
  lotteworld: { label: 'SBS Biz, 롯데월드 성인 종합이용권 6만 4천 원 → 6만 7천 원 (2026년 4월 1일부터)', url: 'https://biz.sbs.co.kr/amp/article/20000297877' },
  gas: { label: 'SBS Biz, 오피넷 2026년 11월 첫째 주 전국 휘발유 평균 리터당 1,855.4원 (50L로 계산)', url: 'https://supple.kr/news/cmw5nprjm5g78al9pr2ml17cq' },
  gift: { label: '세계일보, 카카오페이 2025 머니리포트 모바일 축의금 평균 10만 6천 원', url: 'https://www.segye.com/newsView/20260131501309' },
  musical: { label: 'NOL 티켓, 뮤지컬 오페라의 유령 40주년 스페셜 시즌 VIP석 19만 원', url: 'https://nol.yanolja.com/ticket/products/26013995' },
  buffet: { label: 'SBS Biz, 롯데호텔 서울 라세느 성인 저녁 20만 3천 원 (2026년 1월부터, 연말 성수기 요금 별도)', url: 'https://biz.sbs.co.kr/amp/article/20000315306' },
  airpods: { label: 'YTN, 에어팟 프로 3 국내 판매가 36만 9천 원부터', url: 'https://www.ytn.co.kr/_ln/0134_202509211357056286' },
}

// 생활 속 물건 값 (가격 순). note 는 기준을 짧게, icon 은 ItemIcon.jsx 의 그림 이름.
export const ITEMS = [
  { id: 'subway', name: '지하철 한 번', note: '수도권 기본요금', price: 1550, src: 'subway', icon: 'train' },
  { id: 'gimbap', name: '김밥 한 줄', note: '서울 평균', price: 3800, src: 'price', icon: 'gimbap' },
  { id: 'americano', name: '스타벅스 아메리카노', note: '톨 사이즈', price: 4700, src: 'starbucks', icon: 'coffee' },
  { id: 'jjajang', name: '짜장면 한 그릇', note: '서울 평균', price: 7692, src: 'price', icon: 'noodles' },
  { id: 'kimchi', name: '김치찌개 백반', note: '서울 평균', price: 8654, src: 'price', icon: 'pot' },
  { id: 'naengmyeon', name: '냉면 한 그릇', note: '서울 평균', price: 12538, src: 'price', icon: 'coldnoodle' },
  { id: 'netflix', name: '넷플릭스 한 달', note: '스탠다드 요금제', price: 13500, src: 'netflix', icon: 'tv' },
  { id: 'movie', name: '영화 한 편', note: '주말 성인 2D', price: 15000, src: 'movie', icon: 'ticket' },
  { id: 'samgye', name: '삼계탕 한 그릇', note: '서울 평균', price: 18154, src: 'price', icon: 'samgye' },
  { id: 'chicken', name: '치킨 한 마리', note: 'BBQ 황금올리브', price: 23000, src: 'chicken', icon: 'chicken' },
  { id: 'movie2', name: '영화 데이트', note: '주말 성인 2D 두 장', price: 30000, src: 'movie', icon: 'tickets' },
  { id: 'lotteworld', name: '롯데월드 하루', note: '성인 종합이용권', price: 67000, src: 'lotteworld', icon: 'wheel' },
  { id: 'gas', name: '휘발유 가득', note: '50L, 전국 평균', price: 92770, src: 'gas', icon: 'fuel' },
  { id: 'gift', name: '결혼식 축의금', note: '모바일 송금 평균', price: 106000, src: 'gift', icon: 'envelope' },
  { id: 'musical', name: '뮤지컬 VIP석', note: '대극장 한 장', price: 190000, src: 'musical', icon: 'masks' },
  { id: 'buffet', name: '호텔 뷔페', note: '롯데호텔 라세느 저녁', price: 203000, src: 'buffet', icon: 'cloche' },
  { id: 'airpods', name: '에어팟 프로 3', note: '국내 판매가', price: 369000, src: 'airpods', icon: 'earbuds' },
  { id: 'rent', name: '서울 원룸 월세', note: '보증금 1,000만 원 기준', price: 640000, src: 'rent', icon: 'house' },
  { id: 'galaxy', name: '갤럭시 S26 울트라', note: '256GB 출고가', price: 1947000, src: 'galaxy', icon: 'phone' },
  { id: 'iphone', name: '아이폰 18 프로', note: '256GB 출고가', price: 1990000, src: 'iphone', icon: 'phone' },
]

export const salaryOf = (id) => SALARIES.find((s) => s.id === id) || SALARIES.find((s) => s.id === DEFAULTS.pay)

export function normalize(s) {
  return {
    pay: SALARIES.some((x) => x.id === s.pay) ? s.pay : DEFAULTS.pay,
    b: BASES.some((x) => x.id === s.b) ? s.b : DEFAULTS.b,
  }
}

export function fromSearch(search) {
  const p = new URLSearchParams(search || '')
  return normalize({ pay: p.get('pay'), b: p.get('b') })
}

export function toSearch(s) {
  const p = new URLSearchParams()
  if (s.pay !== DEFAULTS.pay) p.set('pay', s.pay)
  if (s.b !== DEFAULTS.b) p.set('b', s.b)
  const q = p.toString()
  return q ? `?${q}` : ''
}

// 고른 연봉 → 한 달, 1시간, 1분, 1초, 하루에 버는 돈
export function calculate(state) {
  const s = normalize(state)
  const salary = salaryOf(s.pay)
  const yearly = s.b === 'gross' ? salary.gross : salary.net
  const monthly = yearly / 12
  const hourly = monthly / HOURS_PER_MONTH
  const items = ITEMS.map((it) => ({ ...it, hours: it.price / hourly, minHours: it.price / MIN_WAGE }))
  return {
    state: s,
    salary,
    yearly,
    monthly,
    hourly,
    perMinute: hourly / 60,
    perSecond: hourly / 3600,
    perDay: hourly * HOURS_PER_DAY,
    vsMin: hourly / MIN_WAGE,
    items,
    today: items.filter((it) => it.hours <= HOURS_PER_DAY),
    later: items.filter((it) => it.hours > HOURS_PER_DAY),
  }
}

// 일한 시간 → "14분", "1시간 20분", "5일 1시간"(근무일 8시간 기준), "1.6개월"(한 달 209시간 기준)
export function timeText(hours) {
  const min = Math.max(1, Math.round(hours * 60))
  if (min < 60) return `${min}분`
  if (hours < HOURS_PER_DAY) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return m ? `${h}시간 ${m}분` : `${h}시간`
  }
  if (hours < HOURS_PER_MONTH) {
    const totalH = Math.round(hours)
    const d = Math.floor(totalH / HOURS_PER_DAY)
    const h = totalH % HOURS_PER_DAY
    return h ? `${d}일 ${h}시간` : `${d}일`
  }
  const months = hours / HOURS_PER_MONTH
  return `${months >= 10 ? Math.round(months) : months.toFixed(1).replace(/\.0$/, '')}개월`
}

// 오전 9시 출근, 낮 12시~1시 점심은 빼고 hours 만큼 일하면 몇 시 몇 분? (8시간 넘으면 null)
export function clockAt(hours) {
  if (hours > HOURS_PER_DAY) return null
  const worked = Math.max(1, Math.round(hours * 60))
  let t = 9 * 60 + worked
  if (t > 12 * 60) t += 60
  const hh = Math.floor(t / 60)
  const mm = t % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

// 원 → "260원", "15,597원", "12만 4,776원", "326만 원"
export function won(v) {
  const n = Math.round(v)
  if (n < 100000) return `${n.toLocaleString('ko-KR')}원`
  if (n >= 1000000) return `${Math.round(n / 10000).toLocaleString('ko-KR')}만 원`
  const man = Math.floor(n / 10000)
  const rest = n % 10000
  return rest ? `${man}만 ${rest.toLocaleString('ko-KR')}원` : `${man}만 원`
}

// 물건 가격은 반올림하지 않는다: "3,800원", "12,538원", "64만 원", "194만 7,000원"
export function priceText(v) {
  if (v < 100000) return `${v.toLocaleString('ko-KR')}원`
  const man = Math.floor(v / 10000)
  const rest = v % 10000
  return rest ? `${man.toLocaleString('ko-KR')}만 ${rest.toLocaleString('ko-KR')}원` : `${man.toLocaleString('ko-KR')}만 원`
}

// 1초처럼 1원 밑으로 내려가는 작은 돈은 소수 한 자리까지
export const wonSmall = (v) => (v < 10 ? `${v.toFixed(1)}원` : won(v))

// 질문과 답은 jonber/index.html 의 FAQ 구조화 데이터와 같게 유지한다
export const FAQ = [
  {
    q: '시급은 어떻게 계산했나요?',
    a: '고른 연봉을 12로 나눈 한 달 급여를 209시간으로 나눴어요. 209시간은 주 40시간 일하고 유급 주휴시간을 더한 한 달 근로시간으로, 최저임금 월급(시급 10,320원 × 209시간)을 낼 때 쓰는 기준과 같아요.',
  },
  {
    q: '실수령과 세전 연봉은 무엇이 다른가요?',
    a: '세전 연봉에서 4대보험과 소득세를 뺀 돈이 실수령액이에요. 2026년 연봉 실수령액표(본인 1명, 비과세 식대 월 20만 원 기준)를 썼고, 1억이 넘는 연봉은 같은 기준에 국세청 간이세액표를 적용해 계산했어요. 실제로 쓸 수 있는 돈은 실수령액이라 기본으로 골라 두었어요.',
  },
  {
    q: '출근 시계는 어떻게 정했나요?',
    a: '오전 9시에 출근해 하루 8시간 일하고, 낮 12시부터 1시까지 점심시간은 일한 시간에서 뺐어요. 그 하루 안에 벌 수 있는 물건만 시계에 올리고, 하루를 넘는 물건은 며칠 또는 몇 달 일해야 하는지로 보여 드려요.',
  },
  {
    q: '물건 가격은 어디서 가져왔나요?',
    a: '회사가 발표한 판매가(스타벅스, 넷플릭스, BBQ, 롯데월드, 갤럭시, 아이폰, 에어팟, 호텔 뷔페, 뮤지컬), 한국소비자원 참가격의 서울 외식 평균 가격, 오피넷 전국 평균 휘발유 값, 카카오페이 모바일 축의금 평균, 지하철 기본요금, 다방이 국토교통부 실거래가로 낸 서울 원룸 평균 월세를 썼어요. 출처와 기준 날짜는 아래 출처에 있어요. 매장과 시기에 따라 실제 가격은 다를 수 있어요.',
  },
  {
    q: '최저시급과 비교한 숫자는 무엇인가요?',
    a: '2026년 최저시급 10,320원(세전)을 받는 사람이 같은 물건을 사려면 몇 시간 일해야 하는지예요. 내 시급이 최저시급의 몇 배인지도 함께 보여 드려요.',
  },
]
