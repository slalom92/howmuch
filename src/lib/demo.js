// API 키가 없을 때 쓰는 가상 채널 데이터. 실제 채널이 아니다.

const DAY = 86400000

function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function makeVideos({ seed, longEvery, shortEvery, longViews, shortViews, days = 120 }) {
  const rnd = seeded(seed)
  const now = Date.now()
  const out = []
  const push = (age, isShort) => {
    const base = isShort ? shortViews : longViews
    // 롱테일 분포: 가끔 크게 터지는 영상이 섞이게
    const spike = rnd() < 0.08 ? 3 + rnd() * 4 : 0.5 + rnd()
    const ageFactor = Math.min(1, age / 14)
    out.push({
      id: `demo-${seed}-${out.length}`,
      title: isShort ? '쇼츠 영상' : '영상',
      publishedAt: now - age * DAY,
      views: Math.round(base * spike * (0.35 + 0.65 * ageFactor)),
      durationSec: isShort ? 25 + Math.round(rnd() * 40) : 480 + Math.round(rnd() * 900),
      live: 'none',
    })
  }
  if (longEvery) for (let d = 1 + rnd() * 2; d < days; d += longEvery * (0.7 + rnd() * 0.6)) push(d, false)
  if (shortEvery) for (let d = 0.5 + rnd(); d < days; d += shortEvery * (0.7 + rnd() * 0.6)) push(d, true)
  return out.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 50)
}

export const DEMO_CHANNELS = [
  {
    id: 'demo-camping',
    title: '주말캠핑 일지',
    handle: '@weekend_camp_demo',
    subscribers: 384000,
    videoCount: 412,
    totalViews: 98000000,
    color: '#5B7F5E',
    gen: { seed: 11, longEvery: 3.5, shortEvery: 0, longViews: 160000, shortViews: 0 },
  },
  {
    id: 'demo-cook',
    title: '1분 집밥',
    handle: '@oneminute_cook_demo',
    subscribers: 1210000,
    videoCount: 1630,
    totalViews: 870000000,
    color: '#C46A3A',
    gen: { seed: 23, longEvery: 10, shortEvery: 1.1, longViews: 210000, shortViews: 620000 },
  },
  {
    id: 'demo-dev',
    title: '퇴근 후 코딩',
    handle: '@afterwork_dev_demo',
    subscribers: 92000,
    videoCount: 188,
    totalViews: 7400000,
    color: '#3D5A99',
    gen: { seed: 37, longEvery: 7, shortEvery: 6, longViews: 41000, shortViews: 18000 },
  },
]

export function demoSearch(q) {
  const key = q.replace(/\s/g, '').toLowerCase()
  const hits = DEMO_CHANNELS.filter(
    (c) => c.title.replace(/\s/g, '').toLowerCase().includes(key) || c.handle.toLowerCase().includes(key),
  )
  return (hits.length ? hits : DEMO_CHANNELS).map(toSummary)
}

export function demoChannel(id) {
  const c = DEMO_CHANNELS.find((x) => x.id === id) ?? DEMO_CHANNELS[0]
  return { ...toSummary(c), videos: makeVideos(c.gen) }
}

function toSummary(c) {
  return {
    id: c.id,
    title: c.title,
    handle: c.handle,
    thumbnail: null,
    color: c.color,
    subscribers: c.subscribers,
    hiddenSubscribers: false,
    videoCount: c.videoCount,
    totalViews: c.totalViews,
  }
}
