// 이름 검색을 아끼기 위한 "이름 → @핸들" 사전
//
// YouTube 이름 검색(search.list)은 한 번에 100단위라 하루 한도(10,000)로 100번 남짓밖에 못 한다.
// 핸들 조회(channels.list)는 1단위다. 그래서 잘 알려진 채널 이름이 들어오면 핸들로 바로 찾는다.
// 사전: 많이 찾는 유튜버 목록(src/lib/popular.js) + 요즘 뜨는 채널(/api/trending/) + 아래 별칭.

import { POPULAR } from '../../src/lib/popular.js'

// 채널 이름과 다르게 부르는 이름 (정규화한 이름 → 핸들)
const ALIASES = {
  침투부: 'chimchakman_official',
  침착맨유튜브: 'chimchakman_official',
  김종국: 'gymjongkook',
  짐종국: 'gymjongkook',
  백종원paikjongwon: 'paik_jongwon',
  이연복: 'leeyeonbok',
  삼프로: '3protv',
  쿠르츠게작트: 'kurzgesagt_kr',
  보겸: 'bokyemtv',
  덱스: 'dex101',
  psy: 'officialpsy',
  하이브: 'hybelabels',
}

// 많이 찾는 유튜버 목록에는 없지만 핸들을 확인한 채널 (2026년 11월, 구독자 10만 명 이상만)
const EXTRA = [
  { slug: 'ssoyoung', name: '쏘영' },
  { slug: 'koreanenglishman', name: '영국남자' },
  { slug: 'wassupman', name: '와썹맨' },
  { slug: 'leojmakeup', name: '레오제이' },
  { slug: 'unrealscience', name: '안될과학' },
  { slug: 'sciencedream', name: '과학드림' },
  { slug: 'chimchakman_plus', name: '침착맨 플러스' },
]

// 검색어 뒤에 흔히 붙는 말 ("침착맨 수익", "쯔양 유튜브 월수입")
const TAIL = /(유튜브|유튜버|채널|수익|월수입|수입|연봉|월급|한달|얼마|버는돈)+$/

export function normName(s) {
  return String(s || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s·.,'"!?()[\]{}~_\-|:/]+/g, '')
}

function stripTail(n) {
  const t = n.replace(TAIL, '')
  return t.length >= 2 ? t : n
}

// trending: [{ slug, name }] (없어도 됨)
export function knownHandle(q, trending = []) {
  const n = normName(q)
  if (!n) return null
  const keys = [n, stripTail(n)]
  const map = new Map()
  for (const { slug, name } of [...POPULAR, ...EXTRA, ...trending]) {
    if (!slug || slug.startsWith('UC')) continue
    map.set(normName(name), slug)
    map.set(normName(slug), slug)
  }
  for (const [k, v] of Object.entries(ALIASES)) map.set(k, v)
  for (const k of keys) if (map.has(k)) return map.get(k)
  return null
}

// 이름 검색에 넘기기 전에 뒤에 붙은 "수익", "유튜브" 같은 말을 뗀다 (검색 정확도와 캐시 적중률이 올라간다)
const TAIL_WORDS = /(\s+(유튜브|유튜버|채널|수익|월수입|수입|연봉|월급|한달|한 달|얼마|버는 ?돈))+\s*$/
export function cleanQuery(q) {
  const t = String(q || '').replace(TAIL_WORDS, '').trim()
  return t.length >= 1 ? t : String(q || '').trim()
}
