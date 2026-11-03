// OpenDART(금융감독원 전자공시) 공용 모듈
//
// 쓰는 API
// - corpCode.xml          전체 회사 고유번호 목록 (ZIP 안의 XML, 약 30MB)
// - company.json          기업개황 (업종코드 등)
// - empSttus.json         사업보고서 직원 현황 (직원 수, 평균 근속연수, 연간 급여총액, 1인 평균 급여액)
// - unrstExctvMendngSttus.json  미등기임원 보수 현황 (인원, 1인 평균 급여액)
// - hmvAuditAllSttus.json       이사·감사 전체 보수 현황 (인원, 1인 평균 보수액)
//
// 키: 서버 환경변수 DART_API_KEY (https://opendart.fss.or.kr 에서 무료 발급)

import { inflateRawSync } from 'node:zlib'
import { ApiError } from './youtube.js'

const BASE = 'https://opendart.fss.or.kr/api'

function key() {
  const k = process.env.DART_API_KEY
  if (!k) throw new ApiError(503, '회사 비교 기능이 아직 설정되지 않았습니다. (DART_API_KEY 없음)')
  return k
}

// 공통 JSON 호출. status '000' 정상, '013' 조회된 데이터 없음
export async function dart(path, params) {
  const qs = new URLSearchParams({ crtfc_key: key(), ...params })
  let res
  try {
    res = await fetch(`${BASE}/${path}?${qs}`)
  } catch {
    throw new ApiError(502, '전자공시시스템에 연결하지 못했습니다. 잠시 후 다시 시도하세요.')
  }
  const body = await res.json().catch(() => null)
  if (!body) throw new ApiError(502, '전자공시시스템 응답을 읽지 못했습니다.')
  if (body.status === '000' || body.status === '013') return body
  console.error('[dart]', path, body.status, body.message)
  if (body.status === '020') throw new ApiError(429, '오늘 사용할 수 있는 공시 조회량을 모두 썼습니다. 내일 다시 시도하세요.')
  if (['010', '011', '012', '901'].includes(body.status)) throw new ApiError(500, '서버의 DART API 키 설정을 확인해야 합니다.')
  throw new ApiError(502, '전자공시시스템에서 데이터를 가져오지 못했습니다.')
}

// ---------- 회사 목록 (corpCode.xml) ----------
// ZIP 라이브러리 없이 중앙 디렉터리를 읽어 첫 XML 파일만 푼다.
export function unzipFirstXml(buf) {
  let eocd = buf.length - 22
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--
  if (eocd < 0) throw new Error('not a zip')
  const count = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break
    const method = buf.readUInt16LE(p + 10)
    const compSize = buf.readUInt32LE(p + 20)
    const nameLen = buf.readUInt16LE(p + 28)
    const extraLen = buf.readUInt16LE(p + 30)
    const commentLen = buf.readUInt16LE(p + 32)
    const localOff = buf.readUInt32LE(p + 42)
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen)
    if (/\.xml$/i.test(name)) {
      const start = localOff + 30 + buf.readUInt16LE(localOff + 26) + buf.readUInt16LE(localOff + 28)
      const data = buf.subarray(start, start + compSize)
      return (method === 0 ? data : inflateRawSync(data)).toString('utf8')
    }
    p += 46 + nameLen + extraLen + commentLen
  }
  throw new Error('xml not found in zip')
}

// 상장사만 [고유번호, 회사명, 종목코드] 배열로 돌려준다 (약 4천 개)
export async function listedCorps() {
  const qs = new URLSearchParams({ crtfc_key: key() })
  let res
  try {
    res = await fetch(`${BASE}/corpCode.xml?${qs}`)
  } catch {
    throw new ApiError(502, '전자공시시스템에 연결하지 못했습니다.')
  }
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.subarray(0, 2).toString() !== 'PK') {
    console.error('[dart] corpCode not zip:', buf.subarray(0, 200).toString())
    throw new ApiError(500, '회사 목록을 받지 못했습니다. 서버의 DART API 키 설정을 확인해야 합니다.')
  }
  const xml = unzipFirstXml(buf)
  const out = []
  const re = /<list>([\s\S]*?)<\/list>/g
  const tag = (s, t) => (s.match(new RegExp(`<${t}>([^<]*)</${t}>`)) || [])[1]?.trim() || ''
  let m
  while ((m = re.exec(xml))) {
    const stock = tag(m[1], 'stock_code')
    if (!stock) continue
    out.push([tag(m[1], 'corp_code'), decodeXml(tag(m[1], 'corp_name')), stock])
  }
  out.sort((a, b) => a[1].localeCompare(b[1], 'ko'))
  return out
}

function decodeXml(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
}

// ---------- 숫자 정리 ----------
export function num(v) {
  if (v == null) return NaN
  const s = String(v).replace(/[,\s원]/g, '')
  if (!s || s === '-') return NaN
  return Number(s)
}

// 회사마다 금액 단위(원/천원/백만원)가 달라서, 1인 연봉으로 그럴듯한 범위에 들어오게 맞춘다.
// 직원: 500만~20억 원, 임원: 1천만~1천억 원
export function toWonPerPerson(v, max = 2e9, min = 5e6) {
  if (!Number.isFinite(v) || v <= 0) return NaN
  for (const unit of [1, 1e3, 1e6]) {
    const won = v * unit
    if (won >= min && won <= max) return won
  }
  return NaN
}

// 평균 근속연수: "12.5", "12년 5개월", "12년" 등
export function years(v) {
  if (v == null) return NaN
  const s = String(v)
  const ym = s.match(/(\d+(?:\.\d+)?)\s*년(?:\s*(\d+)\s*개월)?/)
  if (ym) return Number(ym[1]) + (ym[2] ? Number(ym[2]) / 12 : 0)
  const n = num(s)
  return Number.isFinite(n) ? n : NaN
}

// 합계·소계·총계·전체 같은 "합친 줄"인지
const isTotal = (s) => /(합계|소계|총계|전체)$|^계$/.test(String(s || '').replace(/\s/g, ''))

// 직원 현황 여러 줄(사업부문 × 성별, 중간중간 소계·합계 줄 포함)을 회사 전체 값 하나로 합친다.
// 1순위: 부문도 성별도 합계인 줄 하나
// 2순위: 부문이 합계인 줄들(성별로 나뉜 경우)
// 3순위: 부문도 성별도 합계가 아닌 맨 아래 줄들
export function summarizeEmployees(list) {
  if (!list?.length) return null
  const size = (rows) => rows.reduce((a, r) => a + (num(r.sm) || 0), 0)
  // 합계 줄이 여러 개(부문 소계 + 전체 합계)면 인원이 가장 많은 쪽이 전체 합계다
  const both = list.filter((r) => isTotal(r.fo_bbm) && (isTotal(r.sexdstn) || !r.sexdstn))
  const bestBoth = both.length ? [both.reduce((a, r) => ((num(r.sm) || 0) >= (num(a.sm) || 0) ? r : a))] : []
  const groups = {}
  for (const r of list) {
    if (isTotal(r.fo_bbm) && r.sexdstn && !isTotal(r.sexdstn)) (groups[r.fo_bbm] ||= []).push(r)
  }
  const bestDept = Object.values(groups).sort((a, b) => size(b) - size(a))[0] || []
  const leaves = list.filter((r) => !isTotal(r.fo_bbm) && !isTotal(r.sexdstn))
  const use = bestBoth.length ? bestBoth : bestDept.length ? bestDept : leaves.length ? leaves : list

  let people = 0
  let payTotal = 0
  let tenureWeighted = 0
  let tenurePeople = 0
  let perHeadWeighted = 0
  let perHeadPeople = 0
  for (const r of use) {
    const n = num(r.sm) || num(r.rgllbr_co) + (num(r.cnttk_co) || 0)
    if (!Number.isFinite(n) || n <= 0) continue
    people += n
    const total = num(r.fyer_salary_totamt)
    if (Number.isFinite(total)) payTotal += total
    const t = years(r.avrg_cnwk_sdytrn)
    if (Number.isFinite(t)) {
      tenureWeighted += t * n
      tenurePeople += n
    }
    const per = toWonPerPerson(num(r.jan_salary_am))
    if (Number.isFinite(per)) {
      perHeadWeighted += per * n
      perHeadPeople += n
    }
  }
  if (!people) return null
  // 1순위: 공시된 1인 평균 급여액(인원 가중), 2순위: 급여총액 ÷ 인원
  const avgFromPer = perHeadPeople ? perHeadWeighted / perHeadPeople : NaN
  const avgFromTotal = toWonPerPerson(payTotal / people)
  const avgSalary = Number.isFinite(avgFromPer) ? avgFromPer : avgFromTotal
  return {
    employees: Math.round(people),
    avgSalary: Number.isFinite(avgSalary) ? Math.round(avgSalary) : null,
    avgTenure: tenurePeople ? Math.round((tenureWeighted / tenurePeople) * 10) / 10 : null,
  }
}

// 임원 보수 표: 인원과 1인 평균. 필드 이름이 표마다 조금 달라 후보를 차례로 본다.
export function summarizeExecutives(list) {
  if (!list?.length) return null
  let people = 0
  let total = 0
  let perWeighted = 0
  let perPeople = 0
  for (const r of list) {
    const n = num(r.nmpr ?? r.nmpr_co ?? r.co)
    if (!Number.isFinite(n) || n <= 0) continue
    people += n
    const t = num(r.fyer_salary_totamt ?? r.mendng_totamt ?? r.psn1_mendng_totamt)
    if (Number.isFinite(t)) total += t
    const per = toWonPerPerson(num(r.jan_salary_am ?? r.jan_avrg_mendng_am ?? r.psn1_avrg_mendng_am), 1e11, 1e7)
    if (Number.isFinite(per)) {
      perWeighted += per * n
      perPeople += n
    }
  }
  if (!people) return null
  const avg = perPeople ? perWeighted / perPeople : toWonPerPerson(total / people, 1e11, 1e7)
  return Number.isFinite(avg) ? { people: Math.round(people), avgPay: Math.round(avg) } : null
}
