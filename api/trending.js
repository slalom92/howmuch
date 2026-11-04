// GET /api/trending/
// "다른 유튜버 수익도 보기" 목록을 자동으로 갱신한다. 개인 유튜버 위주로 고른다.
//
// 1) YouTube 한국 인기 동영상을 전체 + 개인 크리에이터가 많은 카테고리(엔터테인먼트, 인물·블로그, 코미디,
//    게임, 노하우·스타일)에서 가져와 순위대로 번갈아 섞는다.
// 2) 음악·뉴스·스포츠·영화·쇼·예고편 카테고리 영상은 뺀다 (아이돌 뮤직비디오, 방송사 클립, 리그 하이라이트).
// 3) 채널 단위로 다시 거른다.
//    - 주제가 모두 음악인 채널 (가수·레이블·음원 서비스)
//    - 방송사·언론사·기획사·게임사·OTT 같은 이름
//    - 영상이 2만 개 넘는 채널 (방송사 규모)
//    - 구독자 10만 명 미만, 구독자 비공개, @핸들 없는 채널
//    - 채널 국가가 한국이 아닌 채널
// API 사용량은 갱신 1번에 약 8 (인기 영상 6 + 채널 정보 2). 결과는 CDN에 6시간 캐시된다.
// 실패하면 src/lib/popular.js 의 고정 목록을 돌려준다.
import { call, send } from './_lib/youtube.js'
import { POPULAR, channelSlug } from '../src/lib/popular.js'

const SIX_HOURS = 6 * 3600
const MIN_SUBS = 100000
const MAX_VIDEOS = 20000
const LIMIT = 20
const MAX_CANDIDATES = 100

// null = 전체 인기 동영상. 24 엔터테인먼트, 22 인물·블로그, 23 코미디, 20 게임, 26 노하우·스타일
const CHARTS = [null, '24', '22', '23', '20', '26']
// 10 음악, 17 스포츠, 25 뉴스·정치, 30 영화, 43 쇼, 44 예고편
const SKIP_CATEGORIES = new Set(['10', '17', '25', '30', '43', '44'])

// 개인 유튜버가 아닌 채널 이름 (방송사·언론·기획사·레이블·게임사·OTT·리그 등)
// 한글은 이름 어디에 있어도, 영문은 다른 단어 속에 섞이지 않게 단어 단위로 찾는다 (예: 'ena' 가 'Elena' 에 걸리지 않게)
const ORG_KO = /(뉴스|스브스|엠뚜루마뚜루|오분순삭|달라스튜디오|엔터테인먼트|뮤직|딩고|넷플릭스|티빙|웨이브|쿠팡플레이|디즈니|영화사|넥슨|넷마블|엔씨소프트|크래프톤|라이엇|블리자드|포켓몬|닌텐도|e스포츠|k리그|멜론|지니뮤직|채널a|tv조선)/i
const ORG_EN = /\b(news|mbc|kbs|sbs|jtbc|tvn|mnet|ebs|ytn|mbn|ena|entertainment|labels?|records|music|1thek|dingo|studio choom|netflix|tving|wavve|disney|pictures|brawl stars|supercell|nexon|netmarble|ncsoft|krafton|riot games|blizzard|pokemon|nintendo|lck|esports|kbo|kleague|spotv|bugs|melon|genie)\b/i
// 방송사 이름으로 시작하는 채널 (MBCNEWS, @sbsnews, @kbsdrama 처럼 붙여 쓴 경우)
const BROADCASTER_PREFIX = /^@?(mbc|kbs|sbs|jtbc|tvn|mnet|ebs|ytn|mbn|tvchosun|channela)/i
const isOrg = (s) => ORG_KO.test(s) || ORG_EN.test(s.replace(/[_.-]/g, ' ')) || BROADCASTER_PREFIX.test(s.trim())

function interleave(lists) {
  const out = []
  const max = Math.max(0, ...lists.map((l) => l.length))
  for (let i = 0; i < max; i++) for (const l of lists) if (l[i]) out.push(l[i])
  return out
}

async function chart(categoryId) {
  try {
    const params = { part: 'snippet', chart: 'mostPopular', regionCode: 'KR', maxResults: 50 }
    if (categoryId) params.videoCategoryId = categoryId
    const r = await call('videos', params)
    return r.items || []
  } catch {
    return [] // 카테고리별 차트가 없는 경우도 있다
  }
}

// 주제가 전부 음악인 채널만 뺀다 (가수·레이블). 게임·예능 유튜버가 음악 주제를 하나 섞어 가진 경우는 남긴다.
const isMusicTopic = (c) => {
  const topics = (c.topicDetails?.topicCategories || []).map((u) => u.split('/').pop() || '')
  return topics.length > 0 && topics.every((t) => /music/i.test(t))
}

export default async function handler(req, res) {
  try {
    const lists = await Promise.all(CHARTS.map(chart))
    const ids = []
    for (const v of interleave(lists)) {
      const id = v.snippet?.channelId
      if (!id || ids.includes(id) || SKIP_CATEGORIES.has(v.snippet?.categoryId)) continue
      ids.push(id)
      if (ids.length >= MAX_CANDIDATES) break
    }
    if (!ids.length) throw new Error('empty')

    const chunks = []
    for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50))
    const infos = (
      await Promise.all(chunks.map((c) => call('channels', { part: 'snippet,statistics,topicDetails', id: c.join(','), maxResults: 50 })))
    ).flatMap((r) => r.items || [])
    const byId = new Map(infos.map((c) => [c.id, c]))

    const items = []
    for (const id of ids) {
      const c = byId.get(id)
      if (!c) continue
      const st = c.statistics || {}
      const subs = Number(st.subscriberCount || 0)
      const handle = c.snippet?.customUrl || ''
      const name = c.snippet?.title || ''
      if (st.hiddenSubscriberCount || subs < MIN_SUBS || !handle) continue
      if (Number(st.videoCount || 0) > MAX_VIDEOS) continue
      if (isOrg(name) || isOrg(handle) || isMusicTopic(c)) continue
      // 한국 인기 차트에 섞여 들어온 외국 채널 (채널 국가가 한국이 아니라고 적힌 경우만)
      if (c.snippet?.country && c.snippet.country !== 'KR') continue
      items.push({ slug: channelSlug({ id, handle }), name, subs })
      if (items.length >= LIMIT) break
    }
    if (items.length < 5) throw new Error('too few')
    // 오래된 목록을 오래 붙잡지 않게, 6시간이 지나면 길어도 10분 안에 새 목록으로 바뀐다
    return send(res, 200, { source: 'trending', updatedAt: new Date().toISOString(), items }, SIX_HOURS, 600)
  } catch (e) {
    if (e?.message && !['empty', 'too few'].includes(e.message)) console.error('[trending]', e.message)
    // 고정 목록은 짧게 캐시해서 다음 요청 때 다시 인기 목록을 시도한다
    return send(res, 200, { source: 'fixed', items: POPULAR.map(({ slug, name }) => ({ slug, name })) }, 600)
  }
}
