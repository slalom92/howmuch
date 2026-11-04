import { useEffect, useState } from 'react'
import { channelPath, mergeChannels } from '../lib/popular.js'
import { DEMO_MODE } from '../lib/youtube.js'

// 다른 유튜버 바로가기. 링크마다 채널 페이지(/channel/<핸들>/)가 열려 검색엔진도 따라갈 수 있다.
// 목록은 YouTube 한국 인기 동영상의 채널로 6시간마다 자동 갱신되고(/api/trending/),
// 불러오기 전이나 실패하면 고정 목록을 보여 준다.
const KEY = 'yt:trending'
const TTL = 6 * 3600 * 1000

function cached() {
  try {
    const { t, v } = JSON.parse(localStorage.getItem(KEY) || 'null') || {}
    return t && Date.now() - t < TTL ? v : null
  } catch {
    return null
  }
}

export default function PopularChannels({ currentSlug, title, limit = 14 }) {
  const [trend, setTrend] = useState(cached)

  useEffect(() => {
    if (trend || DEMO_MODE) return
    let alive = true
    fetch('/api/trending/')
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!alive || !body?.items) return
        const v = { source: body.source, items: body.items }
        setTrend(v)
        if (body.source === 'trending') {
          try {
            localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), v }))
          } catch {
            /* 무시 */
          }
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [trend])

  const live = trend?.source === 'trending'
  const list = mergeChannels(live ? trend.items : null, currentSlug, limit)

  return (
    <nav className="popular" aria-labelledby="popular-title">
      <h2 className="popular__title" id="popular-title">
        {title}
      </h2>
      <ul className="popular__list">
        {list.map((p) => (
          <li key={p.slug}>
            <a className="popular__chip" href={channelPath(p.slug)}>
              {p.name}
            </a>
          </li>
        ))}
      </ul>
      <p className="popular__meta">
        {live && <span>YouTube 한국 인기 동영상 기준, 6시간마다 바뀌어요. </span>}
        <a className="popular__all" href="/channel/">
          유튜버별 수익 전체 보기
        </a>
      </p>
    </nav>
  )
}
