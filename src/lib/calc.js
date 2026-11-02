// 수익 추정 로직
//
// 1) 최근 업로드 영상(최대 50개)에서 롱폼/쇼츠를 나눈다 (3분 이하 = 쇼츠로 간주)
// 2) 유형별 평균 조회수(상·하위 10% 제외한 절사평균)와 월 업로드 수를 구한다
// 3) 월 신규 조회수 = 평균 조회수 × 월 업로드 수
// 4) 월 수익 = 월 신규 조회수 / 1000 × RPM(1,000회당 크리에이터 수익)
//
// 기존 영상에서 계속 나오는 조회수, 협찬·멤버십·슈퍼챗은 포함하지 않는다.

const DAY = 86400000
export const SHORTS_MAX_SEC = 180
const MIN_AGE_DAYS = 3

// 1,000회당 크리에이터 수익(원). 주제·시청 국가·시즌에 따라 크게 달라지는 가정값.
export const RPM = {
  low: { label: '보수적', long: 1000, short: 50 },
  mid: { label: '보통', long: 2000, short: 100 },
  high: { label: '높게', long: 3500, short: 200 },
}

export const PERIODS = {
  day: { label: '일', factor: 12 / 365 },
  week: { label: '주', factor: 12 / 52 },
  month: { label: '월', factor: 1 },
  year: { label: '연', factor: 12 },
}

function trimmedMean(values) {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const cut = s.length >= 10 ? Math.floor(s.length * 0.1) : 0
  const mid = s.slice(cut, s.length - cut)
  return mid.reduce((a, b) => a + b, 0) / mid.length
}

export function analyze(videos, now = Date.now()) {
  const vids = videos.filter((v) => v.live !== 'live' && v.live !== 'upcoming')
  if (!vids.length) {
    return { sampleSize: 0, long: emptyType(), short: emptyType(), lastUploadDays: null, windowDays: 0 }
  }
  const mature = vids.filter((v) => (now - v.publishedAt) / DAY >= MIN_AGE_DAYS)
  const base = mature.length >= 3 ? mature : vids

  const oldest = Math.min(...vids.map((v) => v.publishedAt))
  const newest = Math.max(...vids.map((v) => v.publishedAt))
  // 표본 기간: 가장 오래된 영상 ~ 오늘. 최근 업로드가 끊긴 채널은 업로드 빈도가 낮게 잡힌다.
  const windowDays = Math.max(7, (now - oldest) / DAY)

  const byType = (isShort) => {
    const all = vids.filter((v) => (v.durationSec <= SHORTS_MAX_SEC) === isShort)
    const forViews = base.filter((v) => (v.durationSec <= SHORTS_MAX_SEC) === isShort)
    const avgViews = trimmedMean(forViews.map((v) => v.views))
    const uploadsPerMonth = (all.length / windowDays) * 30.44
    return {
      count: all.length,
      avgViews,
      uploadsPerMonth,
      monthlyViews: avgViews * uploadsPerMonth,
    }
  }

  return {
    sampleSize: vids.length,
    windowDays,
    lastUploadDays: Math.floor((now - newest) / DAY),
    long: byType(false),
    short: byType(true),
  }
}

function emptyType() {
  return { count: 0, avgViews: 0, uploadsPerMonth: 0, monthlyViews: 0 }
}

export function monthlyRevenue(a, tier) {
  const r = RPM[tier]
  const long = (a.long.monthlyViews / 1000) * r.long
  const short = (a.short.monthlyViews / 1000) * r.short
  return { long, short, total: long + short }
}

export function overallAvgViews(a) {
  const n = a.long.count + a.short.count
  if (!n) return 0
  return (a.long.avgViews * a.long.count + a.short.avgViews * a.short.count) / n
}
