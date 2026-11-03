// GET /api/company/?code=00126380
// 회사 한 곳의 임금 정보: 최근 사업보고서의 직원 평균 급여·근속연수, 임원 보수, 업종.
// 사업보고서는 1년에 한 번 나오므로 Vercel CDN에 7일 캐시한다.
import { dart, summarizeEmployees, summarizeExecutives } from './_lib/dart.js'
import { ApiError, query, send, sendError } from './_lib/youtube.js'
import { industryFromKsic, sizeFromHeadcount } from '../src/lib/benchmarks.js'

const WEEK = 7 * 86400
const ANNUAL = '11011' // 사업보고서

export default async function handler(req, res) {
  const code = (query(req).get('code') || '').trim()
  if (!/^\d{8}$/.test(code)) return send(res, 400, { error: '회사를 목록에서 다시 골라 주세요.' })

  try {
    const info = await dart('company.json', { corp_code: code })
    if (info.status !== '000') throw new ApiError(404, '회사 정보를 찾지 못했습니다.')

    // 가장 최근 사업보고서 연도를 찾는다 (올해 3월 이전엔 재작년 보고서가 최신)
    const thisYear = new Date().getFullYear()
    let year = null
    let emp = null
    for (const y of [thisYear - 1, thisYear - 2, thisYear - 3]) {
      const r = await dart('empSttus.json', { corp_code: code, bsns_year: String(y), reprt_code: ANNUAL })
      const s = r.status === '000' ? summarizeEmployees(r.list) : null
      if (s?.avgSalary) {
        year = y
        emp = s
        break
      }
    }
    if (!emp) throw new ApiError(404, '이 회사는 사업보고서에 직원 급여 정보가 없습니다. 회사 규모로 비교해 보세요.')

    const params = { corp_code: code, bsns_year: String(year), reprt_code: ANNUAL }
    const [unreg, board] = await Promise.all([
      dart('unrstExctvMendngSttus.json', params).catch(() => null),
      dart('hmvAuditAllSttus.json', params).catch(() => null),
    ])

    const industry = industryFromKsic(info.induty_code)
    return send(
      res,
      200,
      {
        code,
        name: info.corp_name,
        stockName: info.stock_name || null,
        industry,
        size: sizeFromHeadcount(emp.employees),
        year,
        employees: emp.employees,
        avgSalary: emp.avgSalary,
        avgTenure: emp.avgTenure,
        unregExec: unreg?.status === '000' ? summarizeExecutives(unreg.list) : null,
        boardExec: board?.status === '000' ? summarizeExecutives(board.list) : null,
        source: `${info.corp_name} ${year}년 사업보고서 (금융감독원 전자공시)`,
      },
      WEEK,
    )
  } catch (e) {
    return sendError(res, e)
  }
}
