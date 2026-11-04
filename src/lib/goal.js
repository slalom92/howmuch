// "나도 이만큼 벌려면?" 계산
//
// 1) 목표 수익: 검색한 유튜버의 한 달 추정 수익 (선택한 광고 단가 기준)
// 2) 필요한 조회수: 목표 수익을 롱폼 RPM으로 나눈 한 달 조회수
// 3) 내 영상 1편 조회수: 내 구독자 × 구독자 대비 조회수 비율
//    비율은 검색한 유튜버의 최근 롱폼 평균 조회수 ÷ 구독자로 구하고, 너무 튀지 않게 3~30%로 자른다.
// 4) 필요한 영상 수 = 필요한 조회수 ÷ 내 영상 1편 조회수, 제작 기간 = 영상 수 ÷ 내 월 업로드 수
// 5) 구독자 달성 기간
//    - 평균: 구독자 1천·1만·10만 명에 도달한 채널들이 걸린 평균 기간을 이은 성장 곡선 (그 이상은 같은 추세로 연장)
//    - 그 유튜버 속도: 채널 개설부터 지금 구독자까지 걸린 기간에 같은 곡선 모양을 맞춘 값

import { RPM, monthlyRevenue, overallAvgViews } from './calc.js'

const MONTH_MS = 30.44 * 86400000

// [구독자, 달성까지 평균 개월]
// 100명 3~6개월, 1천 명 12~18개월(평균 13), 1만 명 약 27개월, 10만 명 약 51개월 (채널 데이터 모음 평균)
const MILESTONES = [
  [1, 0],
  [100, 4],
  [1e3, 13],
  [1e4, 27],
  [1e5, 51],
]
const PER_DECADE_AFTER = 24 // 10만 명 이후 10배마다 늘어나는 개월 (추세 연장)

export const GOAL_SOURCES = [
  '구독자 달성 기간: 구독자 1천·1만·10만 명에 도달한 채널들의 평균 기간(약 13·27·51개월)을 이은 추정, 그 이상은 같은 추세로 연장',
  '채널 비율: vidIQ Research, 6,119만 개 채널 분석 (2026년 7월)',
]

const lg = (x) => Math.log10(Math.max(1, x))

// 구독자 s명이 되기까지 평균 개월
export function monthsToReach(s) {
  if (s <= 1) return 0
  const x = lg(s)
  for (let i = 1; i < MILESTONES.length; i++) {
    const [s0, m0] = MILESTONES[i - 1]
    const [s1, m1] = MILESTONES[i]
    if (s <= s1) return m0 + ((m1 - m0) * (x - lg(s0))) / (lg(s1) - lg(s0))
  }
  const [sL, mL] = MILESTONES[MILESTONES.length - 1]
  return mL + PER_DECADE_AFTER * (x - lg(sL))
}

// 시작 후 m개월에 평균적으로 도달하는 구독자 (monthsToReach 의 역함수)
export function subsAtMonth(m) {
  if (m <= 0) return 1
  for (let i = 1; i < MILESTONES.length; i++) {
    const [s0, m0] = MILESTONES[i - 1]
    const [s1, m1] = MILESTONES[i]
    if (m <= m1) return 10 ** (lg(s0) + ((lg(s1) - lg(s0)) * (m - m0)) / (m1 - m0))
  }
  const [sL, mL] = MILESTONES[MILESTONES.length - 1]
  return 10 ** (lg(sL) + (m - mL) / PER_DECADE_AFTER)
}

// 구독자 s명 이상인 채널 비율(%) — vidIQ 2026년 7월, 공개 구독자 1명 이상 채널 6,119만 개 기준
const SHARE = [
  [1, 100],
  [100, 68.2],
  [500, 48.5],
  [1e3, 40.6],
  [1e4, 7.9],
  [1e5, 1.3],
  [1e6, 0.13],
  [1e7, 0.005],
  [1e8, 0.000028],
]
export function shareAtLeast(s) {
  if (s <= 1) return 100
  for (let i = 1; i < SHARE.length; i++) {
    const [s0, p0] = SHARE[i - 1]
    const [s1, p1] = SHARE[i]
    if (s <= s1) return 10 ** (Math.log10(p0) + ((Math.log10(p1) - Math.log10(p0)) * (lg(s) - lg(s0))) / (lg(s1) - lg(s0)))
  }
  return SHARE[SHARE.length - 1][1]
}

export const PACES = [
  [4, '주 1편'],
  [8, '주 2편'],
  [13, '주 3편'],
  [30, '매일'],
]

export function planGoal({ channel, analysis, tier, mySubs, uploadsPerMonth }) {
  const target = monthlyRevenue(analysis, tier).total
  const rpm = RPM[tier].long
  const needViews = (target / rpm) * 1000

  const S = channel.hiddenSubscribers ? 0 : channel.subscribers
  const base = analysis.long.count ? analysis.long.avgViews : overallAvgViews(analysis)
  const rawRate = S > 0 && base > 0 ? base / S : null
  const rate = Math.min(0.3, Math.max(0.03, rawRate ?? 0.1))

  const myViews = Math.max(1, mySubs * rate)
  const videosPerMonth = needViews / myViews
  const productionMonths = videosPerMonth / uploadsPerMonth

  const reachS = S ? monthsToReach(S) : null
  const avgMonths = S ? Math.max(0, reachS - monthsToReach(mySubs)) : null
  const ageMonths = channel.createdAt ? Math.max(1, (Date.now() - channel.createdAt) / MONTH_MS) : null
  // 그 유튜버가 실제로 걸린 시간에 평균 곡선 모양을 맞춘다 (채널 개설일 기준)
  const paceMonths = S && ageMonths && reachS > 0 ? (ageMonths * avgMonths) / reachS : null
  const videosAtTarget = S ? needViews / (S * rate) : null

  return {
    target,
    rpm,
    needViews,
    rate,
    rawRate,
    myViews,
    videosPerMonth,
    productionMonths,
    targetSubs: S,
    reachS,
    avgMonths,
    ageMonths,
    paceMonths,
    videosAtTarget,
    myShare: shareAtLeast(mySubs),
    targetShare: S ? shareAtLeast(S) : null,
    monetized: mySubs >= 1000,
    ahead: S > 0 && mySubs >= S,
  }
}

// 개월 → "약 3년 4개월", "약 5개월", "약 12일"
export function duration(months) {
  if (!Number.isFinite(months)) return '-'
  if (months <= 0) return '지금 바로'
  if (months < 1) return `약 ${Math.max(1, Math.round(months * 30.44))}일`
  if (Math.round(months) < 12) return `약 ${Math.round(months)}개월`
  const years = months / 12
  if (years >= 100) return `약 ${Math.round(years).toLocaleString('ko-KR')}년`
  const y = Math.floor(years)
  const m = Math.round(months - y * 12)
  if (m === 12) return `약 ${y + 1}년`
  return m ? `약 ${y}년 ${m}개월` : `약 ${y}년`
}

// 큰 정수를 "1,234" / "12만 3천" 대신 읽기 쉬운 "12.3만"처럼
export function bigCount(n) {
  if (!Number.isFinite(n)) return '-'
  const v = Math.round(n)
  if (v >= 1e12) return `${Math.round(v / 1e12).toLocaleString('ko-KR')}조`
  if (v >= 99995000) return `${(v / 1e8).toFixed(v >= 1e9 ? 0 : 1).replace(/\.0$/, '')}억`
  if (v >= 1e5) return `${Math.round(v / 1e4).toLocaleString('ko-KR')}만`
  if (v >= 1e4) return `${(v / 1e4).toFixed(1).replace(/\.0$/, '')}만`
  return v.toLocaleString('ko-KR')
}

export function subsLabel(s) {
  if (s >= 1e8) return `${s / 1e8}억`
  if (s >= 1e7) return `${s / 1e7}천만`
  if (s >= 1e4) return `${(s / 1e4).toLocaleString('ko-KR')}만`
  if (s >= 1e3) return `${s / 1e3}천`
  return String(s)
}
