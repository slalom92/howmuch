// 채널별 페이지(/channel/<핸들>/) 주소 규칙과 "많이 찾는 유튜버" 목록
//
// 검색엔진은 링크를 따라 페이지를 찾는다. 이 목록은 홈 화면, 채널 페이지, /channel/ 모음 페이지,
// sitemap.xml 에 링크로 들어가 각 채널 페이지가 검색에 잡히게 한다.
// slug 는 YouTube @핸들에서 @를 뺀 소문자. 채널을 추가할 때는 핸들이 실제로 있는지 먼저 확인할 것.
// (scripts/build_pages.py 가 이 파일을 읽어 /channel/ 모음 페이지와 sitemap 을 만든다)

export const CATEGORIES = ['예능·코미디', '먹방·요리', '경제·지식', '여행·일상', '게임·방송', '운동·뷰티', '음악·키즈', '스포츠']

export const POPULAR = [
  { slug: 'chimchakman_official', name: '침착맨', cat: '예능·코미디' },
  { slug: 'workman', name: '워크맨', cat: '예능·코미디' },
  { slug: 'shortbox', name: '숏박스', cat: '예능·코미디' },
  { slug: 'ddeunddeun', name: '뜬뜬', cat: '예능·코미디' },
  { slug: 'bdns', name: '빠더너스', cat: '예능·코미디' },
  { slug: 'nerdult', name: '너덜트', cat: '예능·코미디' },
  { slug: 'jinyongjin_official', name: '진용진', cat: '예능·코미디' },
  { slug: 'enjoycouple', name: '엔조이커플', cat: '예능·코미디' },
  { slug: 'ralral', name: '랄랄', cat: '예능·코미디' },
  { slug: 'sbsrunningman', name: '런닝맨', cat: '예능·코미디' },
  { slug: 'tzuyang6145', name: '쯔양', cat: '먹방·요리' },
  { slug: 'paik_jongwon', name: '백종원', cat: '먹방·요리' },
  { slug: 'heebab', name: '히밥', cat: '먹방·요리' },
  { slug: 'leeyeonbok', name: '이연복의 복주머니', cat: '먹방·요리' },
  { slug: 'syukaworld', name: '슈카월드', cat: '경제·지식' },
  { slug: '3protv', name: '삼프로TV', cat: '경제·지식' },
  { slug: 'kurzgesagt_kr', name: '한눈에 보는 세상', cat: '경제·지식' },
  { slug: 'panibottle', name: '빠니보틀', cat: '여행·일상' },
  { slug: 'dex101', name: '덱스101', cat: '여행·일상' },
  { slug: 'sueddu', name: '슛뚜', cat: '여행·일상' },
  { slug: 'woowakgood', name: '우왁굳', cat: '게임·방송' },
  { slug: 'bokyemtv', name: '보겸TV', cat: '게임·방송' },
  { slug: 'gymjongkook', name: '김종국 GYM JONG KOOK', cat: '운동·뷰티' },
  { slug: 'risabae', name: '이사배', cat: '운동·뷰티' },
  { slug: 'officialpsy', name: '싸이', cat: '음악·키즈' },
  { slug: 'blackpink', name: '블랙핑크', cat: '음악·키즈' },
  { slug: 'hybelabels', name: 'HYBE LABELS', cat: '음악·키즈' },
  { slug: 'pinkfong', name: '핑크퐁', cat: '음악·키즈' },
  { slug: 'spotv', name: 'SPOTV', cat: '스포츠' },
]

const ID_RE = /^UC[\w-]{22}$/

// 채널 → 주소에 쓰는 이름. 핸들이 있으면 핸들(@ 빼고 소문자), 없으면 채널 ID
export function channelSlug(ch) {
  const h = String(ch?.handle || '').trim().replace(/^@/, '')
  return h ? h.toLowerCase() : ch.id
}

export function channelPath(chOrSlug) {
  const slug = typeof chOrSlug === 'string' ? chOrSlug : channelSlug(chOrSlug)
  return `/channel/${encodeURIComponent(slug)}/`
}

// 주소의 slug 를 정리한다. 채널 ID는 대소문자를 그대로 두고, 핸들은 소문자로.
export function normalizeSlug(raw) {
  let s = String(raw || '').trim()
  try {
    s = decodeURIComponent(s)
  } catch {
    /* 이미 풀린 값 */
  }
  s = s.replace(/^@/, '').replace(/\/+$/, '')
  if (!s || s.length > 100 || /[\s/?#<>"']/.test(s)) return null
  return ID_RE.test(s) ? s : s.toLowerCase()
}

export const isChannelId = (s) => ID_RE.test(s)

// 지금 주소가 채널 페이지면 slug 를 돌려준다
export function slugFromPath(pathname) {
  const m = pathname.match(/^\/channel\/([^/]+)\/?$/)
  return m ? normalizeSlug(m[1]) : null
}

// 자동 갱신 목록(/api/trending/)을 앞에 두고, 모자라면 고정 목록으로 채운다
export function mergeChannels(trending, excludeSlug, limit) {
  const out = []
  const seen = new Set(excludeSlug ? [excludeSlug] : [])
  for (const c of [...(trending || []), ...POPULAR]) {
    if (!c?.slug || seen.has(c.slug)) continue
    seen.add(c.slug)
    out.push({ slug: c.slug, name: c.name })
    if (out.length >= limit) break
  }
  return out
}
