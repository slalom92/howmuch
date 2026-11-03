// GET /api/corps/
// 상장사 목록 [[고유번호, 회사명, 종목코드], ...]. 회사명 자동완성에 쓴다.
// 30MB짜리 원본을 매번 받지 않도록 Vercel CDN에 7일 캐시한다.
import { listedCorps } from './_lib/dart.js'
import { send, sendError } from './_lib/youtube.js'

const WEEK = 7 * 86400

export default async function handler(req, res) {
  try {
    const corps = await listedCorps()
    return send(res, 200, { updated: new Date().toISOString().slice(0, 10), corps }, WEEK)
  } catch (e) {
    return sendError(res, e)
  }
}
