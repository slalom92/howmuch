// "긁는 한 줄": 계산 결과를 내 노동시간·내 월급과 맞대어 한 줄로 콕 찌르는 문장 (src/components/Sting.jsx 가 보여 준다)
//
// - 문장은 페이지마다 그 페이지 폴더의 sting.js 가 만든다. 여기에는 함께 쓰는 도구만 둔다.
// - 문장 안의 **굵게** 부분이 강조된다. 숫자는 모두 계산 결과에서 나오고, 지어낸 숫자는 쓰지 않는다.
// - 내 연봉: 월급 분당·존버·집 사기 계산기에서 고른 연봉을 이 브라우저에만 기억해 두고(localStorage),
//   연봉을 고르는 칸이 없는 계산기(야구, 골프, 유튜버, 축의금, 직주근접)가 그 값을 쓴다. 없으면 직장인 평균 4,500만 원.
import { useCallback, useEffect, useState } from 'react'
import { SALARIES } from './salary.js'

export const HOURS_PER_MONTH = 209 // 주 40시간 + 주휴 (최저임금 월급과 같은 기준)
export const HOURS_PER_DAY = 8
export const DEFAULT_PAY = '4500'
const KEY = 'donmeter:pay'

export const salaryOf = (id) => SALARIES.find((s) => s.id === id) || SALARIES.find((s) => s.id === DEFAULT_PAY)

export function readPay() {
  try {
    const v = localStorage.getItem(KEY)
    return SALARIES.some((s) => s.id === v) ? v : DEFAULT_PAY
  } catch {
    return DEFAULT_PAY
  }
}

export function rememberPay(id) {
  try {
    if (SALARIES.some((s) => s.id === id)) localStorage.setItem(KEY, id)
  } catch {
    /* 저장이 막힌 브라우저면 기억하지 않는다 */
  }
}

// 기억해 둔 내 연봉. 미리 그린 HTML 과 첫 화면이 같도록 처음에는 기본값, 화면이 뜬 뒤 기억한 값으로 바꾼다
export function useMyPay() {
  const [id, setId] = useState(DEFAULT_PAY)
  useEffect(() => setId(readPay()), [])
  const set = useCallback((v) => {
    setId(v)
    rememberPay(v)
  }, [])
  return [salaryOf(id), set]
}

// 시급 (원): 세전 또는 실수령 연봉 ÷ 12 ÷ 209시간
export const hourlyOf = (salary, basis = 'net') => (basis === 'gross' ? salary.gross : salary.net) / 12 / HOURS_PER_MONTH

// 일한 시간 → "40초", "14분", "2시간 27분", "3일 4시간", "4.2개월", "3.4년", "1,234년"
// 하루 8시간, 한 달 209시간, 1년 209 × 12 시간 (쉬지 않고 출근하는 시간)
export function workText(hours) {
  const sec = hours * 3600
  if (sec < 60) return `${Math.max(1, Math.round(sec))}초`
  const min = Math.round(hours * 60)
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
    return h && d < 10 ? `${d}일 ${h}시간` : `${Math.round(hours / HOURS_PER_DAY)}일`
  }
  const months = hours / HOURS_PER_MONTH
  if (months < 12) return `${months.toFixed(1).replace(/\.0$/, '')}개월`
  return yearsText(months / 12)
}

// 년 → "3.4년", "34년", "1,234년"
export function yearsText(y) {
  if (y < 10) return `${y.toFixed(1).replace(/\.0$/, '')}년`
  return `${Math.round(y).toLocaleString('ko-KR')}년`
}

// 원 → "4,700원", "23,000원", "326만 원", "1억 2,300만 원", "42억 원"
export function wonText(v) {
  const n = Math.round(v)
  if (n < 100000) return `${n.toLocaleString('ko-KR')}원`
  if (n < 100000000) return `${Math.round(n / 10000).toLocaleString('ko-KR')}만 원`
  const eok = Math.floor(n / 100000000)
  const man = Math.round((n % 100000000) / 10000)
  if (eok >= 10 || !man) return `${(Math.round(n / 10000000) / 10).toLocaleString('ko-KR')}억 원`
  return `${eok}억 ${man.toLocaleString('ko-KR')}만 원`
}

// 몇 배 → "3배", "1.4배", "1,200배"
export function timesText(x) {
  if (x < 10) return `${x.toFixed(1).replace(/\.0$/, '')}배`
  return `${Math.round(x).toLocaleString('ko-KR')}배`
}

export const pctText = (x) => `${Math.round(x * 100)}%`

// 지금(2026년)에서 y년 전부터 모았다면 → "1953년부터", 아주 멀면 시대 이름
export const NOW_YEAR = 2026
export function sinceText(y) {
  const start = NOW_YEAR - Math.round(y)
  if (start >= 1) return `${start}년부터`
  if (start > -2333) return `기원전 ${Math.abs(start) + 1}년부터`
  return '단군 할아버지 때부터'
}

// 문장 목록에서 빈 것(조건이 안 맞아 null)을 빼고, 굵게 표시 없는 공유용 글자를 붙인다
export function lines(...list) {
  return list.filter(Boolean).map((text) => ({ text, plain: text.replace(/\*\*/g, '') }))
}

// ---------- 맨 위 큰 배너 (src/components/StingHero.jsx) ----------
// 큰 숫자는 짧게: "88분", "6.4시간", "16일", "7.8개월", "1.4년", "285년"
export function bigTime(hours) {
  const min = Math.round(hours * 60)
  if (min < 100) return `${Math.max(1, min)}분`
  if (hours < 24) return `${(Math.round(hours * 10) / 10).toString()}시간`
  if (hours < HOURS_PER_MONTH) return `${Math.round(hours / HOURS_PER_DAY)}일`
  const months = hours / HOURS_PER_MONTH
  if (months < 12) return `${months.toFixed(1).replace(/\.0$/, '')}개월`
  return yearsText(months / 12)
}

// 받침에 맞는 조사: josa('한유섬', '이', '가') → '한유섬이', josa('양의지', '이', '가') → '양의지가'
export function josa(word, withFinal, without) {
  const c = word.charCodeAt(word.length - 1)
  if (c < 0xac00 || c > 0xd7a3) return word + without
  return word + ((c - 0xac00) % 28 ? withFinal : without)
}
