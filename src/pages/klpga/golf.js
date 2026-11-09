// 프로골프 선수 시즌 상금 화면이 함께 쓰는 계산 (여자 KLPGA: klpga.js, 남자 KPGA: ../kpga/kpga.js)
//
// - 금액 단위는 "원"이다. 정규투어 공식 상금만이고, 후원 계약금·광고 수입·시즌 보너스는 들어 있지 않다.
// - 골프 선수는 연봉이 없다. 대회 순위에 따라 받는 상금을 '연봉' 자리에 둔다.
// - 투어 누리집의 기록표는 옮겨 싣지 않고, 시즌이 끝난 뒤 언론과 투어 보도자료가 알린 최종 상금만 옮긴다.

// 직장인 평균 연봉 (국가데이터처 2024년 임금근로일자리 소득, 월 375만 원 × 12) — 프로야구 화면과 같은 기준
export const WORKER_YEAR = 45000000

// 1타에 얼마: 한 대회를 라운드마다 72타(파 72)씩 4라운드 친다고 본다.
// 컷 탈락(2라운드)이나 3라운드 대회도 있지만 모두 4라운드로 셈한다. 투어마다 cfg.ROUNDS 로 바꿀 수 있다.
export const PAR = 72
export const ROUNDS = 4

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

// "김민솔" → "ㄱㅁㅅ"
export function chosung(s) {
  return Array.from(s)
    .map((ch) => {
      const c = ch.charCodeAt(0) - 0xac00
      return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch
    })
    .join('')
}

const clean = (s) => String(s || '').replace(/\s+/g, '').toLowerCase()
// 등록 이름 끝의 번호(김민선7, 정재현2575)는 빼고도 찾을 수 있게 (외국 선수는 aliases 로 성·영문 이름도 찾는다)
const bare = (name) => name.replace(/\d+$/, '')
const isChosungOnly = (s) => /^[ㄱ-ㅎ]+$/.test(s)

// 투어 하나의 자료(cfg)에 계산 함수를 붙여 돌려준다
export function makeTour(cfg) {
  const PLAYERS = [...cfg.PLAYERS].sort((a, b) => b.prize - a.prize)

  const breakdown = (won) => ({
    year: won,
    month: won / 12,
    tourDay: won / cfg.TOUR_DAYS,
    day: won / 365,
    hour: won / (365 * 24),
    minute: won / (365 * 24 * 60),
    second: won / (365 * 24 * 3600),
  })

  const profile = (p) => {
    const b = breakdown(p.prize)
    return {
      T: tour,
      player: p,
      b,
      rank: PLAYERS.filter((x) => x.prize > p.prize).length + 1,
      perEvent: p.events ? p.prize / p.events : null,
      // 대회 하나 평균 상금 ÷ (72타 × 라운드 수). 출전 대회 수를 모르면 계산하지 않는다.
      perStroke: p.events ? p.prize / p.events / (PAR * (cfg.ROUNDS || ROUNDS)) : null,
      // 직장인 평균 연봉 몇 년 치를 한 시즌에 벌었나
      workerYears: p.prize / WORKER_YEAR,
      // 직장인 평균 연봉을 버는 데 걸리는 투어 날짜 수
      daysForWorkerYear: WORKER_YEAR / b.tourDay,
    }
  }

  const findExact = (q) => {
    const k = clean(q)
    if (!k) return null
    const alias = (p) => (p.aliases || []).some((a) => clean(a) === k)
    return (
      PLAYERS.find((p) => clean(p.name) === k) ||
      PLAYERS.find((p) => bare(p.name) === k && PLAYERS.filter((x) => bare(x.name) === k).length === 1) ||
      PLAYERS.find(alias) ||
      null
    )
  }

  // 이름(앞부분 우선) → 이름 일부 → 초성 → 소속 순으로 찾는다
  const suggest = (q, limit = 8) => {
    const k = clean(q)
    if (!k) return []
    const scored = []
    for (const p of PLAYERS) {
      const name = clean(p.name)
      const aliases = (p.aliases || []).map(clean)
      let s = 0
      if (name === k || bare(name) === k || aliases.includes(k)) s = 100
      else if (name.startsWith(k) || aliases.some((a) => a.startsWith(k))) s = 80
      else if (name.includes(k) || aliases.some((a) => a.includes(k))) s = 60
      else if (isChosungOnly(k) && chosung(name).includes(k)) s = chosung(name).startsWith(k) ? 50 : 40
      else if (clean(p.team).includes(k)) s = 20
      if (s) scored.push({ p, s })
    }
    return scored
      .sort((a, b) => b.s - a.s || b.p.prize - a.p.prize)
      .slice(0, limit)
      .map((x) => x.p)
  }

  const tour = { ...cfg, PAR, ROUNDS: cfg.ROUNDS || ROUNDS, PLAYERS, WORKER_YEAR, breakdown, profile, findExact, suggest }
  return tour
}
