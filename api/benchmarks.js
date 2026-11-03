// GET /api/benchmarks/
// 규모·산업별 평균 임금. 기본값(src/lib/benchmarks.js)에 KOSIS 최신 산업별 값을 덮어쓴다.
//
// KOSIS 연동 (선택)
// 1. https://kosis.kr/openapi 에서 인증키 발급 → Vercel 환경변수 KOSIS_API_KEY
// 2. KOSIS에서 "산업별 월평균 임금" 통계표(예: 고용노동부 사업체노동력조사·고용형태별근로실태조사)를 열고
//    [OpenAPI] → URL 생성으로 만든 주소에서 apiKey= 부분만 뺀 전체 URL을 KOSIS_INDUSTRY_URL 에 넣는다.
//    표의 분류(산업) 이름에 "제조업", "정보통신업" 같은 대분류 이름이 들어 있으면 자동으로 맞춘다.
// 설정이 없거나 실패하면 기본값만 돌려준다.
import { send } from './_lib/youtube.js'
import { INDUSTRIES, INDUSTRY_AVG_DEFAULT, SIZE_AVG, HEADCOUNT_AVG, ALL_AVG, SOURCES } from '../src/lib/benchmarks.js'

const DAY = 86400
const UNIT = { 원: 1, 천원: 1e3, 만원: 1e4, 백만원: 1e6 }

async function kosisIndustry() {
  const key = process.env.KOSIS_API_KEY
  const url = process.env.KOSIS_INDUSTRY_URL
  if (!key || !url) return null
  try {
    const u = new URL(url)
    u.searchParams.set('apiKey', key)
    u.searchParams.set('format', 'json')
    u.searchParams.set('jsonVD', 'Y')
    const res = await fetch(u)
    const rows = await res.json()
    if (!Array.isArray(rows)) {
      console.error('[kosis]', rows?.err, rows?.errMsg)
      return null
    }
    // 가장 최근 시점 값만
    const latest = rows.reduce((a, r) => (r.PRD_DE > a ? r.PRD_DE : a), '')
    const out = {}
    for (const r of rows) {
      if (r.PRD_DE !== latest) continue
      const name = String(r.C1_NM || r.C2_NM || '').replace(/\s/g, '')
      const letter = Object.entries(INDUSTRIES).find(([, n]) => name.includes(n.replace(/\s/g, '').split(',')[0]))?.[0]
      const v = Number(r.DT) * (UNIT[String(r.UNIT_NM || '').trim()] || 1)
      if (letter && Number.isFinite(v) && v > 0 && !out[letter]) out[letter] = Math.round(v)
    }
    return Object.keys(out).length ? { values: out, period: latest, table: rows[0]?.TBL_NM } : null
  } catch (e) {
    console.error('[kosis]', e)
    return null
  }
}

export default async function handler(req, res) {
  const kosis = await kosisIndustry()
  return send(
    res,
    200,
    {
      all: ALL_AVG,
      size: SIZE_AVG,
      headcount: HEADCOUNT_AVG,
      industry: { ...INDUSTRY_AVG_DEFAULT, ...(kosis?.values || {}) },
      industryNames: INDUSTRIES,
      industrySource: kosis ? `KOSIS ${kosis.table || '산업별 임금'} (${kosis.period})` : SOURCES.jobs2024,
      sources: SOURCES,
    },
    DAY,
  )
}
