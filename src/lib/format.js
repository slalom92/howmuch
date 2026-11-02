// 숫자 표기 유틸 (한국식 만/억 단위)

export function won(n) {
  if (!Number.isFinite(n)) return '-'
  const v = Math.max(0, n)
  if (v >= 1e8) {
    const eok = v / 1e8
    return `${eok >= 10 ? Math.round(eok).toLocaleString('ko-KR') : eok.toFixed(1).replace(/\.0$/, '')}억 원`
  }
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString('ko-KR')}만 원`
  return `${Math.round(v / 100) * 100 > 0 ? (Math.round(v / 100) * 100).toLocaleString('ko-KR') : 0}원`
}

export function count(n) {
  if (!Number.isFinite(n)) return '-'
  if (n >= 1e8) return `${(n / 1e8).toFixed(1).replace(/\.0$/, '')}억`
  if (n >= 1e5) return `${Math.round(n / 1e4).toLocaleString('ko-KR')}만`
  if (n >= 1e4) return `${(n / 1e4).toFixed(1).replace(/\.0$/, '')}만`
  return Math.round(n).toLocaleString('ko-KR')
}

export function ratioText(a, b) {
  if (!b) return ''
  const r = a / b
  if (r >= 1.05) return `${r >= 10 ? Math.round(r) : r.toFixed(1)}배`
  if (r >= 0.95) return '비슷한 수준'
  return `${Math.round(r * 100)}% 수준`
}
