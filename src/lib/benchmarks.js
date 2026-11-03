// 회사 규모·산업별 평균 임금 (기본값) — 서버와 브라우저가 함께 쓴다
//
// 모든 금액은 "월, 세전, 원".
// KOSIS 연동(api/benchmarks.js)이 설정되면 산업별 값은 KOSIS 최신 값으로 덮어쓴다.
// 새 통계가 나오면 이 파일의 숫자와 출처만 바꾸면 된다.

export const SOURCES = {
  jobs2024: '국가데이터처, 「2024년 임금근로일자리 소득(보수) 결과」 (2026.2.23 발표)',
  midsize2022: 'CEO스코어, 상장 중견기업 직원 평균 급여 조사 (2022년 사업보고서 기준)',
  promotion: '인크루트·이지서베이, 직급별 승진 소요기간 설문 (직장인 1,000명)',
  rankPay: '사람인, 매출 상위 100대 기업 직급별 평균 연봉 집계',
}

// 기업 규모별 평균 (월)
export const SIZE_AVG = {
  대기업: { monthly: 6130000, label: '대기업 평균', source: 'jobs2024' },
  중견: { monthly: Math.round(59200000 / 12), label: '상장 중견기업 평균', source: 'midsize2022' },
  중소: { monthly: 3070000, label: '중소기업 평균', source: 'jobs2024' },
}

// 종사자 수 구간별 평균 (월)
export const HEADCOUNT_AVG = [
  { min: 300, monthly: 4910000, label: '300명 이상 기업' },
  { min: 50, monthly: 3760000, label: '50~299명 기업' },
  { min: 0, monthly: 2800000, label: '50명 미만 기업' },
]

export const ALL_AVG = 3750000 // 전체 임금근로자 평균 (월), jobs2024

// 한국표준산업분류 대분류
export const INDUSTRIES = {
  A: '농업, 임업 및 어업',
  B: '광업',
  C: '제조업',
  D: '전기, 가스, 증기 및 공기조절 공급업',
  E: '수도, 하수 및 폐기물 처리, 원료 재생업',
  F: '건설업',
  G: '도매 및 소매업',
  H: '운수 및 창고업',
  I: '숙박 및 음식점업',
  J: '정보통신업',
  K: '금융 및 보험업',
  L: '부동산업',
  M: '전문, 과학 및 기술 서비스업',
  N: '사업시설 관리, 사업 지원 및 임대 서비스업',
  O: '공공 행정, 국방 및 사회보장 행정',
  P: '교육 서비스업',
  Q: '보건업 및 사회복지 서비스업',
  R: '예술, 스포츠 및 여가관련 서비스업',
  S: '협회 및 단체, 수리 및 기타 개인 서비스업',
  T: '가구 내 고용활동 및 자가소비 생산활동',
  U: '국제 및 외국기관',
}

// 2024년 임금근로일자리 소득 발표에서 공개된 산업별 평균 (월). 발표되지 않은 산업은 KOSIS 연동 시 채워진다.
export const INDUSTRY_AVG_DEFAULT = {
  K: 7770000,
  D: 6990000,
  U: 5380000,
  A: 2440000,
  S: 2290000,
  I: 1880000,
}

// 업종코드(KSIC, 앞 2자리 = 중분류) → 대분류 문자
export function industryFromKsic(code) {
  const d = Number(String(code || '').slice(0, 2))
  if (!Number.isFinite(d) || d <= 0) return null
  const ranges = [
    [1, 3, 'A'], [5, 8, 'B'], [10, 34, 'C'], [35, 35, 'D'], [36, 39, 'E'], [41, 42, 'F'],
    [45, 47, 'G'], [49, 52, 'H'], [55, 56, 'I'], [58, 63, 'J'], [64, 66, 'K'], [68, 68, 'L'],
    [70, 73, 'M'], [74, 76, 'N'], [84, 84, 'O'], [85, 85, 'P'], [86, 87, 'Q'], [90, 91, 'R'],
    [94, 96, 'S'], [97, 98, 'T'], [99, 99, 'U'],
  ]
  const hit = ranges.find(([a, b]) => d >= a && d <= b)
  return hit ? hit[2] : null
}

// 직원 수로 나눈 대략적인 규모 (법적 기준은 매출·자산이라 참고용)
export function sizeFromHeadcount(n) {
  if (!Number.isFinite(n)) return null
  if (n >= 1000) return '대기업'
  if (n >= 300) return '중견'
  return '중소'
}

export function headcountAvg(n) {
  return HEADCOUNT_AVG.find((h) => n >= h.min) || HEADCOUNT_AVG[HEADCOUNT_AVG.length - 1]
}
