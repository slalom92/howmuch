// "이 유튜버가 이 회사에 다닌다면 몇 년차 무슨 직급일까" 추정 모델
//
// 1) 직급별 승진 시점(입사 후 연차) — 인크루트 직급별 승진 소요기간 조사의 규모별 값
//    (중견기업의 차장·부장 시점은 조사에 없어 대기업과 중소기업의 중간값으로 둔다)
// 2) 직급별 연봉 배율(사원 = 1) — 대형 상장사 직급별 평균 연봉에서 부장이 사원의 약 2.2배인 점을 기준으로
//    직급마다 비슷한 비율로 오르도록 나눈 값
// 3) 회사 평균 연봉과 평균 근속연수(DART 공시)로 "평균 근속연수의 연봉 = 회사 평균 연봉"이 되게 곡선을 맞춘다
// 4) 곡선을 넘어서면 미등기임원 평균, 등기임원(이사·감사) 평균과 비교한다
//
// 회사마다 직급 체계와 연봉 테이블이 달라 결과는 재미로 보는 추정치다.

const RANKS = ['사원', '대리', '과장', '차장', '부장']
const PAY = [1.0, 1.25, 1.55, 1.85, 2.2] // 직급 시작 시점의 배율
const PAY_TOP = 2.45 // 임원 직전 부장 말년

const PROMOTION = {
  대기업: { starts: [0, 3.7, 11.2, 15.3, 17.5], exec: 20.6 },
  중견: { starts: [0, 3.5, 9.8, 12.7, 14.6], exec: 21.3 },
  중소: { starts: [0, 3.3, 6.6, 10.1, 11.7], exec: 18.3 },
}

const DEFAULT_TENURE = 8

function curve(size) {
  const p = PROMOTION[size] || PROMOTION['중견']
  // (연차, 배율) 꺾은선
  const pts = p.starts.map((y, i) => [y, PAY[i]])
  pts.push([p.exec, PAY_TOP])
  return { pts, exec: p.exec, starts: p.starts }
}

function multAt(pts, y) {
  if (y <= pts[0][0]) return pts[0][1]
  for (let i = 1; i < pts.length; i++) {
    const [y0, m0] = pts[i - 1]
    const [y1, m1] = pts[i]
    if (y <= y1) return m0 + ((m1 - m0) * (y - y0)) / (y1 - y0)
  }
  return pts[pts.length - 1][1]
}

function yearAt(pts, m) {
  for (let i = 1; i < pts.length; i++) {
    const [y0, m0] = pts[i - 1]
    const [y1, m1] = pts[i]
    if (m <= m1) return y0 + ((y1 - y0) * (m - m0)) / (m1 - m0)
  }
  return pts[pts.length - 1][0]
}

/**
 * @param {object} company { avgSalary(연, 원), avgTenure(년), size('대기업'|'중견'|'중소'), unregExec?{avgPay}, boardExec?{avgPay} }
 * @param {number} annual 유튜버 연 수익(원)
 */
export function placeInCompany(company, annual) {
  const { pts, exec, starts } = curve(company.size)
  const tenure = Number.isFinite(company.avgTenure) && company.avgTenure > 0 ? Math.min(company.avgTenure, exec - 0.5) : DEFAULT_TENURE
  const base = company.avgSalary / multAt(pts, tenure) // 신입(사원 1년차) 연봉
  const salaryAt = (y) => base * multAt(pts, y)

  // 직급 사다리 (표시용)
  const ladder = RANKS.map((rank, i) => ({
    rank,
    fromYear: Math.floor(starts[i]) + 1,
    salary: Math.round(salaryAt(starts[i])),
  }))
  const topStaff = salaryAt(exec)
  const unreg = company.unregExec?.avgPay
  const board = company.boardExec?.avgPay
  if (unreg) ladder.push({ rank: '임원(미등기)', fromYear: Math.floor(exec) + 1, salary: unreg, exec: true })
  if (board) ladder.push({ rank: '등기임원', fromYear: null, salary: board, exec: true })

  let place
  if (annual < base) {
    place = { kind: 'below', ratio: annual / base, text: `신입 연봉의 ${Math.round((annual / base) * 100)}% 수준` }
  } else if (annual <= topStaff) {
    const y = yearAt(pts, annual / base)
    let r = 0
    while (r + 1 < starts.length && y >= starts[r + 1]) r++
    const yearInRank = Math.floor(y - starts[r]) + 1
    const totalYear = Math.floor(y) + 1
    place = {
      kind: 'staff',
      rank: RANKS[r],
      rankIndex: r,
      yearInRank,
      totalYear,
      text: `${RANKS[r]} ${yearInRank}년차`,
      sub: `입사 ${totalYear}년차`,
    }
  } else if (unreg && annual < unreg) {
    place = { kind: 'preexec', text: '부장 이상, 임원 직전', sub: `입사 ${Math.floor(exec)}년차 이상` }
  } else if (board && annual >= board) {
    const x = annual / board
    place = {
      kind: 'board',
      text: x >= 1.5 ? `등기임원 평균의 ${x >= 10 ? Math.round(x) : x.toFixed(1)}배` : '등기임원(이사회) 수준',
      sub: '이사·감사 1인 평균 보수 이상',
    }
  } else if (unreg) {
    place = { kind: 'exec', text: '임원(상무급) 수준', sub: '미등기임원 1인 평균 이상' }
  } else {
    place = { kind: 'top', text: '부장 말년차 이상', sub: `입사 ${Math.floor(exec)}년차 이상` }
  }

  return { place, ladder, base: Math.round(base), tenureUsed: tenure, tenureAssumed: tenure === DEFAULT_TENURE && !company.avgTenure }
}
