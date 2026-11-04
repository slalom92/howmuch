// 가상 사원증에 쓰는 계산 (화면의 사원증과 저장용 이미지가 함께 쓴다)

// 직급(급)과 직책(맡은 자리)
export function roleOf(place) {
  switch (place.kind) {
    case 'below':
      return { grade: '인턴', title: '수습사원', years: '수습 기간' }
    case 'staff': {
      const titles = ['팀원', '팀원', '파트장', '팀장', '부서장']
      return { grade: place.rank, title: titles[place.rankIndex] || '팀원', years: `${place.rank} ${place.yearInRank}년차 · 경력 ${place.totalYear}년차` }
    }
    case 'preexec':
      return { grade: '수석부장', title: '실장', years: place.sub.replace('입사', '경력') }
    case 'exec':
      return { grade: '상무', title: '본부장', years: '임원' }
    case 'board':
      return /배$/.test(place.text) && parseFloat(place.text.replace(/[^\d.]/g, '')) >= 3
        ? { grade: '사장', title: '대표이사', years: '등기임원' }
        : { grade: '전무', title: '사업부장', years: '등기임원' }
    default:
      return { grade: '부장', title: '부서장', years: (place.sub || '').replace('입사', '경력') }
  }
}

export function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// 받침이 있으면 '과', 없으면 '와' (한글이 아니면 '와(과)')
export function waGwa(word) {
  const last = [...word.replace(/[\s)\]]+$/, '')].pop() || ''
  if (last < '가' || last > '힣') return `${word}와(과)`
  return word + ((last.charCodeAt(0) - 0xac00) % 28 ? '과' : '와')
}

export const ymd = (t) => {
  const d = new Date(t)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 사번: 채널 개설 연도 + 채널 ID로 만든 여섯 자리
export function employeeNo(channel) {
  const no = String(hash(channel.id) % 1000000).padStart(6, '0')
  const year = channel.createdAt ? String(new Date(channel.createdAt).getFullYear()).slice(2) : '00'
  return `YT${year}-${no}`
}

// 회사 표시 이름과 엠블럼 글자 (로고 대신 첫 글자)
export function companyLabel(company) {
  const name = company.stockName || company.name
  const initial = [...name.replace(/^\(주\)|㈜|주식회사\s*/g, '').trim()][0] || '?'
  return { name, initial }
}
