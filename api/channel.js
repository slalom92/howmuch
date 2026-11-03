// GET /api/channel?id=UC...
// 채널 정보와 최근 영상(최대 50개). 같은 채널은 Vercel CDN에 6시간 캐시된다.
import { ApiError, channelsBy, recentVideos, query, send, sendError } from './_lib/youtube.js'

const SIX_HOURS = 6 * 3600

export default async function handler(req, res) {
  const id = (query(req).get('id') || '').trim()
  if (!/^[\w-]{10,64}$/.test(id)) return send(res, 400, { error: '채널 주소를 확인한 뒤 다시 검색하세요.' })

  try {
    const [channel] = await channelsBy({ id })
    if (!channel) throw new ApiError(404, '채널을 찾지 못했습니다. 채널 주소를 다시 확인하세요.')
    const videos = await recentVideos(channel.uploads)
    return send(res, 200, { ...channel, videos }, SIX_HOURS)
  } catch (e) {
    return sendError(res, e)
  }
}
