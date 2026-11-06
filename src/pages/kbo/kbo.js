// 프로야구(KBO) 선수 연봉 자료
//
// - 금액 단위는 "만 원"이다. 연봉은 그해 소속 선수 등록 기준이며 계약금·옵션(인센티브)은 들어 있지 않다.
// - KBO는 전체 선수 연봉표를 공개하지 않고, 평균·상위 선수만 보도자료로 알린다.
//   그래서 KBO 발표와 구단 공식 발표를 옮긴 기사에서 확인한 선수만 넣었다. 선수마다 출처를 단다.
// - 새 시즌 자료가 나오면 SEASON, LEAGUE, TEAMS, PLAYERS 숫자만 바꾸면 된다.

export const SEASON = 2026
export const GAMES = 144 // 정규시즌 팀당 경기 수
export const INNINGS = 9 // 한 경기 정규 이닝

// 출처 (기사 제목은 옮기지 않고 매체와 발표 주체만 적는다)
export const SOURCES = {
  kbo: { label: 'KBO 2026 선수단 등록·연봉 현황 발표 (2026.3.18)', url: 'https://www.koreabaseball.com/MediaNews/Notice/View.aspx?bdSe=11861' },
  kbo_top: { label: '연합뉴스·경기일보, KBO 2026 연봉 발표 보도', url: 'https://www.kyeonggi.com/article/20260318580259' },
  kbo_x: { label: '엑스포츠뉴스, KBO 2026 연봉 발표 보도', url: 'https://www.xportsnews.com/article/2124498' },
  kbo_star: { label: '스타뉴스, KBO 2026 연봉 발표 보도', url: 'https://www.starnewskorea.com/sports/2026/03/18/2026031813522141894' },
  yang: { label: '스포츠경향, KBO 2026 연봉 발표 보도', url: 'https://sports.khan.co.kr/article/202603181513003/' },
  choi_hw: { label: '톱스타뉴스, KBO 2026 연봉 발표 보도', url: 'https://www.topstarnews.net/news/articleView.html?idxno=16008453' },
  lg: { label: 'LG트윈스 2026시즌 연봉 계약 발표', url: 'https://lg.co.kr/media/release/29793' },
  lg_osen: { label: 'OSEN, LG 샐러리캡 분석 (2026.1.5)', url: 'https://osen.co.kr/article/G1112723323' },
  hanwha: { label: '스타뉴스, 한화 2026 연봉 계약 발표 보도', url: 'https://www.starnewskorea.com/sports/2026/01/21/2026012119084141185' },
  hanwha_x: { label: '엑스포츠뉴스, 한화 2026 연봉 계약 발표 보도', url: 'https://www.xportsnews.com/article/2103107' },
  samsung: { label: '엑스포츠뉴스, 삼성 2026 연봉 계약 발표 보도', url: 'https://www.xportsnews.com/article/2104333' },
  kia: { label: 'OSEN, KIA 2026 연봉 계약 발표 보도', url: 'https://osen.co.kr/article/G1112728955' },
  kt: { label: '파이낸셜뉴스, KT 2026 연봉 계약 발표 보도', url: 'https://www.fnnews.com/news/202601151533125810' },
  nc: { label: '엑스포츠뉴스, NC 2026 연봉 계약 발표 보도', url: 'https://www.xportsnews.com/article/2103524' },
  ssg: { label: 'OSEN, SSG 2026 연봉 계약 발표 보도', url: 'https://osen.co.kr/article/G1112737552' },
  ssg_twig: { label: 'twig24, SSG 2026 연봉 계약 보도', url: 'https://www.twig24.com/news/2026/02/01/20260201500002' },
  ssg_newsis: { label: '뉴시스, SSG 2026 연봉 계약 발표 보도', url: 'https://www.newsis.com/view/NISX20260131_0003497621' },
  ssg_kim: { label: '데일리안, SSG 김광현 연장 계약 보도 (2025.6.13)', url: 'https://www.dailian.co.kr/news/view/1510049/' },
  kiwoom: { label: '엑스포츠뉴스, 키움 2026 연봉 계약 발표 보도', url: 'https://www.xportsnews.com/article/2102671' },
  kiwoom_lee: { label: '엑스포츠뉴스, 키움 2026 연봉 계약 보도', url: 'https://www.xportsnews.com/article/2102715' },
  doosan_kwak: { label: 'OSEN, 두산 곽빈 연봉 보도', url: 'https://osen.co.kr/article/G1112735603' },
  doosan_kim: { label: 'OSEN, 두산 김택연 연봉 보도', url: 'https://osen.co.kr/article/G1112734065' },
  doosan_oh: { label: '노컷뉴스, 두산 2026 연봉 계약 보도', url: 'https://nocutnews.co.kr/news/6459529' },
  lotte: { label: '엑스포츠뉴스, 롯데 2026 연봉 계약 발표 보도', url: 'https://www.xportsnews.com/article/2103416' },
  minimum: { label: '스포츠조선, KBO 최저 연봉 규정 보도', url: 'https://v.daum.net/v/1v6ZnzkPzQ' },
}

// 리그 전체 (신인·외국인·아시아쿼터 선수 제외 529명 기준)
export const LEAGUE = {
  average: 17536, // 평균 연봉
  prevAverage: 16071, // 2025년 평균
  players: 529,
  minimum: 3000, // KBO 규정 최저 연봉
  source: 'kbo',
}

// 구단별 소속 선수 평균 연봉 (KBO 발표)
export const TEAMS = [
  { id: 'ssg', name: 'SSG', full: 'SSG 랜더스', average: 20783 },
  { id: 'doosan', name: '두산', full: '두산 베어스', average: 20776 },
  { id: 'lg', name: 'LG', full: 'LG 트윈스', average: 20094 },
  { id: 'kt', name: 'KT', full: 'KT 위즈', average: 19878 },
  { id: 'samsung', name: '삼성', full: '삼성 라이온즈', average: 18863 },
  { id: 'lotte', name: '롯데', full: '롯데 자이언츠', average: 17654 },
  { id: 'hanwha', name: '한화', full: '한화 이글스', average: 17613 },
  { id: 'kia', name: 'KIA', full: 'KIA 타이거즈', average: 15623 },
  { id: 'nc', name: 'NC', full: 'NC 다이노스', average: 13168 },
  { id: 'kiwoom', name: '키움', full: '키움 히어로즈', average: 10022 },
]

export const TEAM_BY_ID = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

// 선수 (2026 연봉 순)
// prev: 2025년 연봉, history: 해마다 받은 연봉, approx: 정확한 해당 연도 금액이 공개되지 않아 계약 조건으로 어림한 값
export const PLAYERS = [
  { name: '양의지', team: 'doosan', pos: '포수', pay: 420000, prev: 160000, history: { 2023: 30000, 2024: 50000, 2025: 160000, 2026: 420000 }, note: '2026 리그 연봉 1위. 4+2년 최대 152억 원 FA 계약 4년째로, 연봉이 해마다 크게 오르는 구조예요.', src: ['yang', 'kbo_top'] },
  { name: '고영표', team: 'kt', pos: '투수', pay: 260000, note: '2026 리그 연봉 2위, 투수 1위예요.', src: ['kbo_x', 'kbo_top'] },
  { name: '최정', team: 'ssg', pos: '내야수', pay: 220000, prev: 170000, note: '2026 리그 연봉 3위예요.', src: ['kbo_x', 'kbo_star'] },
  { name: '류현진', team: 'hanwha', pos: '투수', pay: 210000, note: '박세웅과 함께 리그 연봉 공동 4위예요.', src: ['kbo_x', 'kbo_top'] },
  { name: '박세웅', team: 'lotte', pos: '투수', pay: 210000, note: '류현진과 함께 리그 연봉 공동 4위, 롯데 1위예요.', src: ['kbo_x', 'kbo_top'] },
  { name: '김광현', team: 'ssg', pos: '투수', pay: 150000, prev: 300000, approx: true, note: '2026~2027년 2년 계약의 연봉 총액 30억 원을 해마다 같게 나눠 어림했어요. 해마다 받는 정확한 금액은 공개되지 않았어요.', src: ['ssg_kim'] },
  { name: '오지환', team: 'lg', pos: '내야수', pay: 140000, prev: 30000, history: { 2024: 30000, 2025: 30000, 2026: 140000 }, note: '야수 연봉 3위, LG 1위예요. 6년 FA 계약 3년째라 연봉이 크게 올랐어요.', src: ['kbo_x', 'lg_osen'] },
  { name: '원태인', team: 'samsung', pos: '투수', pay: 100000, prev: 63000, note: '8년 차 선수 최고 연봉 기록이에요.', src: ['samsung'] },
  { name: '노시환', team: 'hanwha', pos: '내야수', pay: 100000, prev: 33000, note: '한화 연봉 재계약 선수 중 최고 인상액(약 203%)이에요.', src: ['hanwha'] },
  { name: '구창모', team: 'nc', pos: '투수', pay: 90000, prev: 10000, note: '2026 연봉 인상률 1위(800%)예요.', src: ['yang'] },
  { name: '홍창기', team: 'lg', pos: '외야수', pay: 52000, prev: 65000, src: ['lg'] },
  { name: '박동원', team: 'lg', pos: '포수', pay: 50000, prev: 120000, note: 'FA 계약 마지막 해라 연봉이 줄었어요.', src: ['lg_osen'] },
  { name: '문보경', team: 'lg', pos: '내야수', pay: 48000, prev: 41000, src: ['lg'] },
  { name: '안우진', team: 'kiwoom', pos: '투수', pay: 48000, prev: 48000, note: '키움 연봉 재계약 선수 중 최고 연봉이에요.', src: ['kiwoom'] },
  { name: '김진성', team: 'lg', pos: '투수', pay: 45000, prev: 33000, note: 'LG 구단 첫 다년 계약(3년 최대 16억 원)이에요.', src: ['lg'] },
  { name: '박성한', team: 'ssg', pos: '내야수', pay: 42000, prev: 37000, src: ['ssg_twig'] },
  { name: '최형우', team: 'samsung', pos: '외야수', pay: 40000, note: 'KBO 첫 25년 차 연봉 선수이자 2026 최고령 선수예요.', src: ['choi_hw'] },
  { name: '신민재', team: 'lg', pos: '내야수', pay: 38000, prev: 20000, note: 'LG 재계약 선수 중 최고 인상액이에요.', src: ['lg'] },
  { name: '최지훈', team: 'ssg', pos: '외야수', pay: 37000, prev: 30000, src: ['ssg'] },
  { name: '김주원', team: 'nc', pos: '내야수', pay: 35000, prev: 20000, note: 'NC 재계약 선수 중 최고 연봉이에요.', src: ['nc'] },
  { name: '곽빈', team: 'doosan', pos: '투수', pay: 30500, prev: 38000, src: ['doosan_kwak'] },
  { name: '김도영', team: 'kia', pos: '내야수', pay: 25000, prev: 50000, note: '2025년 연봉에서 절반(50%)이 깎였어요.', src: ['kia'] },
  { name: '김택연', team: 'doosan', pos: '투수', pay: 22000, prev: 14000, src: ['doosan_kim'] },
  { name: '하영민', team: 'kiwoom', pos: '투수', pay: 21000, src: ['kiwoom'] },
  { name: '이로운', team: 'ssg', pos: '투수', pay: 20000, prev: 7400, note: 'SSG 재계약 선수 중 최고 인상액이에요.', src: ['ssg_newsis'] },
  { name: '안현민', team: 'kt', pos: '외야수', pay: 18000, prev: 3300, note: 'KT 구단 역대 최고 인상률(445.5%)이에요.', src: ['kt'] },
  { name: '김서현', team: 'hanwha', pos: '투수', pay: 16800, prev: 5600, src: ['hanwha_x'] },
  { name: '송승기', team: 'lg', pos: '투수', pay: 13600, prev: 3600, note: 'LG 재계약 선수 중 최고 인상률(277.8%)이에요.', src: ['lg'] },
  { name: '전사민', team: 'nc', pos: '투수', pay: 13000, prev: 3800, src: ['nc'] },
  { name: '이용규', team: 'kiwoom', pos: '외야수', pay: 12000, prev: 20000, note: '플레잉코치를 겸하는 시즌이에요.', src: ['kiwoom_lee'] },
  { name: '오명진', team: 'doosan', pos: '내야수', pay: 11200, prev: 3100, note: '두산 재계약 선수 중 최고 인상률(261.3%)이에요.', src: ['doosan_oh'] },
  { name: '전민재', team: 'lotte', pos: '내야수', pay: 11000, prev: 7500, note: '데뷔 뒤 첫 억대 연봉이에요.', src: ['lotte'] },
  { name: '이지강', team: 'lg', pos: '투수', pay: 11000, note: '데뷔 뒤 첫 억대 연봉이에요.', src: ['lg'] },
  { name: '임지열', team: 'kiwoom', pos: '외야수', pay: 11000, src: ['kiwoom'] },
]

// 직장인 평균 연봉 (국가데이터처 2024년 임금근로일자리 소득, 월 375만 원 × 12)
export const WORKER_YEAR = 4500

const MAN = 10000 // 만 원 → 원

// 연봉을 시간·경기 단위로 쪼갠다 (결과는 원 단위)
export function breakdown(payMan) {
  const year = payMan * MAN
  return {
    year,
    game: year / GAMES,
    inning: year / (GAMES * INNINGS),
    day: year / 365,
    hour: year / (365 * 24),
    second: year / (365 * 24 * 3600),
  }
}

// 선수 한 명의 결과 화면에 필요한 숫자
export function profile(p) {
  const team = TEAM_BY_ID[p.team]
  const b = breakdown(p.pay)
  const rank = PLAYERS.filter((x) => x.pay > p.pay).length + 1
  const change = p.prev ? (p.pay - p.prev) / p.prev : null
  return {
    player: p,
    team,
    b,
    rank,
    change,
    vsLeague: p.pay / LEAGUE.average,
    vsTeam: p.pay / team.average,
    vsWorker: p.pay / WORKER_YEAR,
    // 직장인 평균 연봉을 버는 데 걸리는 경기 수
    gamesForWorkerYear: (WORKER_YEAR * MAN) / b.game,
  }
}

// ---------- 이름 찾기 ----------

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

// "양의지" → "ㅇㅇㅈ"
export function chosung(s) {
  return Array.from(s)
    .map((ch) => {
      const c = ch.charCodeAt(0) - 0xac00
      return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch
    })
    .join('')
}

const clean = (s) => String(s || '').replace(/\s+/g, '').toLowerCase()
const isChosungOnly = (s) => /^[ㄱ-ㅎ]+$/.test(s)

export function findExact(q) {
  const k = clean(q)
  return PLAYERS.find((p) => p.name === k) || null
}

// 이름(앞부분 우선) → 이름 일부 → 초성 → 팀 이름 순으로 찾는다
export function suggest(q, limit = 8) {
  const k = clean(q)
  if (!k) return []
  const scored = []
  for (const p of PLAYERS) {
    const team = TEAM_BY_ID[p.team]
    let s = 0
    if (p.name === k) s = 100
    else if (p.name.startsWith(k)) s = 80
    else if (p.name.includes(k)) s = 60
    else if (isChosungOnly(k) && chosung(p.name).startsWith(k)) s = 50
    else if (clean(team.name) === k || clean(team.full).includes(k)) s = 20
    if (s) scored.push({ p, s })
  }
  return scored
    .sort((a, b) => b.s - a.s || b.p.pay - a.p.pay)
    .slice(0, limit)
    .map((x) => x.p)
}
